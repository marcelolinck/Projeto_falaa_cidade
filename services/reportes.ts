import { Coordenadas } from "@/context/cidade-context";
import { bancoDeDados, nomeDoBucket } from "@/firebase-config";
import { enviarFoto, FotoGravada } from "@/services/fotos";
import { garantirCadastroDoNotificante } from "@/services/usuarios";
import { Severidade, TipoOcorrencia } from "@/types/ocorrencia";
import { gerarGeohash } from "@/utils/geohash";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  DocumentReference,
  GeoPoint,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

/*
 * Grava um reporte no Firebase seguindo o modelo de dados do projeto
 * (claude/modelo-dados-firebase.md). Coleções, campos e valores gravados estão
 * todos em português, assim como o código.
 */

export type DadosDoReporte = {
  usuarioLogado: User;
  tipo: TipoOcorrencia;
  descricao: string;
  severidade: Severidade;
  coordenadas: Coordenadas;
  endereco: string | null;
  codigoIbge: string; // código IBGE da cidade, vira o `idCidade` da ocorrência
  fotosDoProblema: string[]; // fotos já comprimidas, até 5
  fotosDeReferencia: string[]; // fotos já comprimidas, até 2
};

export type ResultadoDoReporte = {
  idOcorrencia: string;
  armazenamentoAtivo: boolean; // false = bucket não configurado, fotos não enviadas
  quantidadeDeFotosEnviadas: number;
  quantidadeDeFotosComFalha: number;
};

type FotosEnviadas = {
  fotosGravadas: FotoGravada[];
  quantidadeDeFalhas: number;
};

/** Passo 1: cria o documento da ocorrência, com as listas de fotos ainda vazias. */
async function criarOcorrencia(dados: DadosDoReporte): Promise<DocumentReference> {
  const { latitude, longitude } = dados.coordenadas;

  return addDoc(collection(bancoDeDados, "ocorrencias"), {
    idNotificante: dados.usuarioLogado.uid,
    idCidade: dados.codigoIbge,
    idDepartamento: null,
    tipo: dados.tipo,
    localizacao: new GeoPoint(latitude, longitude),
    geohash: gerarGeohash(latitude, longitude),
    endereco: dados.endereco,
    descricao: dados.descricao.trim() || null,
    severidade: dados.severidade,
    situacao: "aberta",
    fotos: { problema: [], referencia: [], resolvida: [] },
    quantidadeApoios: 0,
    criadoEm: serverTimestamp(),
    reconhecidoEm: null,
    resolvidoEm: null,
    confirmadoEm: null,
    tempoResolucaoSegundos: null,
    quantidadeReaberturas: 0,
    atualizadoEm: serverTimestamp(),
  });
}

/**
 * Envia as fotos de uma pasta (ex.: problema/1.jpg, problema/2.jpg...).
 * Se uma foto falhar, as outras continuam sendo enviadas.
 */
async function enviarGrupoDeFotos(
  nomeDoBucketAtivo: string,
  usuarioLogado: User,
  urisDasFotos: string[],
  pasta: string
): Promise<FotosEnviadas> {
  const fotosGravadas: FotoGravada[] = [];
  let quantidadeDeFalhas = 0;

  for (let posicao = 0; posicao < urisDasFotos.length; posicao++) {
    const numeroDaFoto = posicao + 1; // os arquivos são numerados a partir de 1
    const caminho = `${pasta}/${numeroDaFoto}.jpg`;

    try {
      const foto = await enviarFoto(nomeDoBucketAtivo, usuarioLogado, urisDasFotos[posicao], caminho);
      fotosGravadas.push(foto);
    } catch (erro) {
      quantidadeDeFalhas++;
      console.warn(`Falha ao enviar a foto ${caminho}`, erro);
    }
  }

  return { fotosGravadas, quantidadeDeFalhas };
}

/** Passo 3: anexa ao documento da ocorrência as URLs das fotos que foram enviadas. */
async function anexarFotosNaOcorrencia(
  ocorrencia: DocumentReference,
  fotosDoProblema: FotoGravada[],
  fotosDeReferencia: FotoGravada[]
): Promise<void> {
  await updateDoc(ocorrencia, {
    "fotos.problema": fotosDoProblema,
    "fotos.referencia": fotosDeReferencia,
    atualizadoEm: serverTimestamp(),
  });
}

/**
 * Grava o reporte completo. O fluxo tem 3 passos porque a regra do Storage
 * precisa que o documento da ocorrência já exista antes de aceitar a foto:
 *   1. cria a ocorrência no Firestore (com as listas de fotos vazias);
 *   2. envia as fotos para o Storage;
 *   3. anexa as URLs das fotos na ocorrência.
 */
export async function enviarReporte(dados: DadosDoReporte): Promise<ResultadoDoReporte> {
  await garantirCadastroDoNotificante(dados.usuarioLogado);

  const ocorrencia = await criarOcorrencia(dados);

  // Sem bucket configurado: a ocorrência já foi gravada, só não há fotos.
  if (!nomeDoBucket) {
    return {
      idOcorrencia: ocorrencia.id,
      armazenamentoAtivo: false,
      quantidadeDeFotosEnviadas: 0,
      quantidadeDeFotosComFalha: 0,
    };
  }

  const pastaDaOcorrencia = `ocorrencias/${ocorrencia.id}`;
  const fotosDoProblema = await enviarGrupoDeFotos(
    nomeDoBucket,
    dados.usuarioLogado,
    dados.fotosDoProblema,
    `${pastaDaOcorrencia}/problema`
  );
  const fotosDeReferencia = await enviarGrupoDeFotos(
    nomeDoBucket,
    dados.usuarioLogado,
    dados.fotosDeReferencia,
    `${pastaDaOcorrencia}/referencia`
  );

  const quantidadeDeFotosEnviadas =
    fotosDoProblema.fotosGravadas.length + fotosDeReferencia.fotosGravadas.length;

  if (quantidadeDeFotosEnviadas > 0) {
    await anexarFotosNaOcorrencia(
      ocorrencia,
      fotosDoProblema.fotosGravadas,
      fotosDeReferencia.fotosGravadas
    );
  }

  return {
    idOcorrencia: ocorrencia.id,
    armazenamentoAtivo: true,
    quantidadeDeFotosEnviadas,
    quantidadeDeFotosComFalha:
      fotosDoProblema.quantidadeDeFalhas + fotosDeReferencia.quantidadeDeFalhas,
  };
}
