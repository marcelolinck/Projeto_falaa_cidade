import { Coordenadas } from "@/context/cidade-context";
import { armazenamento, bancoDeDados } from "@/firebase-config";
import { garantirCadastroDoNotificante } from "@/services/usuarios";
import { Severidade, TipoOcorrencia } from "@/types/ocorrencia";
import { gerarGeohash } from "@/utils/geohash";
import { File } from "expo-file-system";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  DocumentReference,
  GeoPoint,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { FirebaseStorage, getDownloadURL, getMetadata, ref, uploadBytes } from "firebase/storage";

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

// Como cada foto é registrada dentro do documento da ocorrência.
type FotoGravada = {
  url: string;
  caminhoNoArmazenamento: string;
  enviadaPor: string; // uid de quem enviou
  enviadaEm: Timestamp;
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
 * Envia uma foto para o armazenamento e devolve o registro que vai no documento.
 *
 * Os bytes são lidos direto do arquivo (File.bytes). Não usamos fetch(uri).blob()
 * porque no React Native esse Blob nem sempre chega completo ao Firebase, e o
 * arquivo acabava gravado com apenas alguns bytes.
 * Depois do envio conferimos o tamanho gravado: se for diferente do original,
 * a foto é tratada como falha em vez de aparecer como enviada.
 */
async function enviarUmaFoto(
  armazenamentoAtivo: FirebaseStorage,
  uriDaFoto: string,
  caminhoNoArmazenamento: string,
  idNotificante: string
): Promise<FotoGravada> {
  const bytesDaFoto = await new File(uriDaFoto).bytes();

  const referenciaDaFoto = ref(armazenamentoAtivo, caminhoNoArmazenamento);
  await uploadBytes(referenciaDaFoto, bytesDaFoto, { contentType: "image/jpeg" });

  const dadosDoArquivoGravado = await getMetadata(referenciaDaFoto);
  if (dadosDoArquivoGravado.size !== bytesDaFoto.length) {
    throw new Error(
      `A foto foi gravada com ${dadosDoArquivoGravado.size} bytes, mas tinha ${bytesDaFoto.length}.`
    );
  }

  return {
    url: await getDownloadURL(referenciaDaFoto),
    caminhoNoArmazenamento,
    enviadaPor: idNotificante,
    // Timestamp.now() e não serverTimestamp(): o Firestore não aceita
    // serverTimestamp() dentro de listas.
    enviadaEm: Timestamp.now(),
  };
}

/**
 * Envia as fotos de uma pasta (ex.: problema/1.jpg, problema/2.jpg...).
 * Se uma foto falhar, as outras continuam sendo enviadas.
 */
async function enviarGrupoDeFotos(
  armazenamentoAtivo: FirebaseStorage,
  urisDasFotos: string[],
  pasta: string,
  idNotificante: string
): Promise<FotosEnviadas> {
  const fotosGravadas: FotoGravada[] = [];
  let quantidadeDeFalhas = 0;

  for (let posicao = 0; posicao < urisDasFotos.length; posicao++) {
    const numeroDaFoto = posicao + 1; // os arquivos são numerados a partir de 1
    const caminho = `${pasta}/${numeroDaFoto}.jpg`;

    try {
      const foto = await enviarUmaFoto(armazenamentoAtivo, urisDasFotos[posicao], caminho, idNotificante);
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
  const idNotificante = dados.usuarioLogado.uid;

  await garantirCadastroDoNotificante(dados.usuarioLogado);

  const ocorrencia = await criarOcorrencia(dados);

  // Sem bucket configurado: a ocorrência já foi gravada, só não há fotos.
  if (!armazenamento) {
    return {
      idOcorrencia: ocorrencia.id,
      armazenamentoAtivo: false,
      quantidadeDeFotosEnviadas: 0,
      quantidadeDeFotosComFalha: 0,
    };
  }

  const pastaDaOcorrencia = `ocorrencias/${ocorrencia.id}`;
  const fotosDoProblema = await enviarGrupoDeFotos(
    armazenamento,
    dados.fotosDoProblema,
    `${pastaDaOcorrencia}/problema`,
    idNotificante
  );
  const fotosDeReferencia = await enviarGrupoDeFotos(
    armazenamento,
    dados.fotosDeReferencia,
    `${pastaDaOcorrencia}/referencia`,
    idNotificante
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
