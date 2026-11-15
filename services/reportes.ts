import { Coordenadas } from "@/context/cidade-context";
import { db, storage } from "@/firebase-config";
import { garantirUsuario } from "@/services/usuarios";
import { Severidade, TipoOcorrencia } from "@/types/ocorrencia";
import { gerarCidadeId } from "@/utils/cidade-id";
import { gerarGeohash } from "@/utils/geohash";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  GeoPoint,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

/*
 * Grava um reporte no Firebase seguindo o modelo de dados do projeto
 * (claude/modelo-dados-firebase.md). Os NOMES DOS CAMPOS dentro do documento
 * ficam em inglês (reporterId, cityId, createdAt...) porque as Security Rules e
 * as Cloud Functions usam esses nomes; as variáveis do código ficam em português.
 */

export type DadosReporte = {
  usuario: User;
  tipo: TipoOcorrencia;
  descricao: string;
  severidade: Severidade;
  coordenadas: Coordenadas;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  fotos: string[]; // fotos do problema (já comprimidas), até 5
  fotosReferencia: string[]; // fotos de referência (já comprimidas), até 2
};

export type ResultadoReporte = {
  id: string;
  storageAtivo: boolean; // false = bucket não configurado, fotos não enviadas
  fotosEnviadas: number;
  fotosComFalha: number;
};

type FotoGravada = {
  url: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
};

/** Sobe uma foto para o Storage e devolve o registro que vai no documento. */
async function enviarFoto(uri: string, caminho: string, uid: string): Promise<FotoGravada> {
  const arquivo = await (await fetch(uri)).blob();
  const referencia = ref(storage!, caminho);
  await uploadBytes(referencia, arquivo, { contentType: "image/jpeg" });
  return {
    url: await getDownloadURL(referencia),
    storagePath: caminho,
    uploadedBy: uid,
    // Timestamp.now() e não serverTimestamp(): o Firestore não aceita
    // serverTimestamp() dentro de listas.
    uploadedAt: Timestamp.now(),
  };
}

/** Sobe várias fotos de uma pasta (ex.: pothole/1.jpg, 2.jpg...). Falhas não derrubam as outras. */
async function enviarFotos(uris: string[], pasta: string, uid: string) {
  const gravadas: FotoGravada[] = [];
  let falhas = 0;
  for (let i = 0; i < uris.length; i++) {
    try {
      gravadas.push(await enviarFoto(uris[i], `${pasta}/${i + 1}.jpg`, uid));
    } catch (erro) {
      falhas++;
      console.warn(`Falha ao enviar a foto ${pasta}/${i + 1}.jpg`, erro);
    }
  }
  return { gravadas, falhas };
}

/**
 * Fluxo em 3 passos (ver nota "ordem de criação" no modelo de dados):
 *  1. cria o documento em `ocorrencias` com as listas de fotos vazias;
 *  2. envia as fotos ao Storage (a regra do Storage só deixa porque o
 *     documento do passo 1 já existe);
 *  3. anexa as URLs ao mesmo documento.
 */
export async function enviarReporte(dados: DadosReporte): Promise<ResultadoReporte> {
  const { usuario, coordenadas } = dados;

  // Cadastro do notificante: garante usuarios/{uid} antes do primeiro reporte.
  await garantirUsuario(usuario);

  // Passo 1: documento da ocorrência.
  const documento = await addDoc(collection(db, "ocorrencias"), {
    reporterId: usuario.uid,
    cityId: gerarCidadeId(dados.cidade, dados.uf),
    departmentId: null,
    type: dados.tipo,
    location: new GeoPoint(coordenadas.latitude, coordenadas.longitude),
    geohash: gerarGeohash(coordenadas.latitude, coordenadas.longitude),
    address: dados.endereco,
    description: dados.descricao.trim() || null,
    severity: dados.severidade,
    status: "aberta",
    photos: { pothole: [], reference: [], resolved: [] },
    supportCount: 0,
    createdAt: serverTimestamp(),
    recognizedAt: null,
    resolvedAt: null,
    confirmedAt: null,
    resolutionTimeSeconds: null,
    reopenedCount: 0,
    updatedAt: serverTimestamp(),
  });

  // Sem bucket configurado: a ocorrência já foi gravada, só não há fotos.
  if (!storage) {
    return { id: documento.id, storageAtivo: false, fotosEnviadas: 0, fotosComFalha: 0 };
  }

  // Passo 2: fotos no Storage.
  const pasta = `ocorrencias/${documento.id}`;
  const problema = await enviarFotos(dados.fotos, `${pasta}/pothole`, usuario.uid);
  const referencia = await enviarFotos(dados.fotosReferencia, `${pasta}/reference`, usuario.uid);

  // Passo 3: anexa as URLs no documento.
  const enviadas = problema.gravadas.length + referencia.gravadas.length;
  if (enviadas > 0) {
    await updateDoc(documento, {
      "photos.pothole": problema.gravadas,
      "photos.reference": referencia.gravadas,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    id: documento.id,
    storageAtivo: true,
    fotosEnviadas: enviadas,
    fotosComFalha: problema.falhas + referencia.falhas,
  };
}
