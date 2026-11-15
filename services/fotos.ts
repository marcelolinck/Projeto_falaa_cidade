import { File, UploadType } from "expo-file-system";
import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

/*
 * Envio de fotos para o Firebase Storage.
 *
 * Por que não usamos o SDK do Firebase (uploadBytes)? No React Native o SDK
 * precisa montar um "Blob" a partir dos bytes da foto, e o React Native não
 * consegue ("Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not
 * supported"). Com o Blob vindo de fetch(uri).blob() o envio não dava erro,
 * mas o arquivo era gravado com apenas 14 bytes.
 *
 * Por isso enviamos o arquivo direto pela rede nativa do celular
 * (File.upload do expo-file-system), usando a API REST do Storage. O token do
 * usuário logado vai junto, então as regras de segurança do Storage continuam
 * valendo exatamente como se o envio fosse feito pelo SDK.
 */

const ENDERECO_BASE_DO_STORAGE = "https://firebasestorage.googleapis.com/v0/b";

// Como cada foto é registrada dentro do documento da ocorrência.
export type FotoGravada = {
  url: string;
  caminhoNoArmazenamento: string;
  enviadaPor: string; // uid de quem enviou
  enviadaEm: Timestamp;
};

// Parte da resposta do Storage que usamos.
type RespostaDoStorage = {
  name: string; // caminho do arquivo gravado
  size: string; // tamanho gravado, em bytes (o Storage devolve como texto)
  downloadTokens?: string; // chave que permite abrir o arquivo pela URL
};

function montarEnderecoDoEnvio(nomeDoBucket: string, caminho: string): string {
  return `${ENDERECO_BASE_DO_STORAGE}/${nomeDoBucket}/o?name=${encodeURIComponent(caminho)}`;
}

function montarUrlDaFoto(nomeDoBucket: string, resposta: RespostaDoStorage): string {
  const caminhoCodificado = encodeURIComponent(resposta.name);
  const urlBase = `${ENDERECO_BASE_DO_STORAGE}/${nomeDoBucket}/o/${caminhoCodificado}?alt=media`;

  return resposta.downloadTokens ? `${urlBase}&token=${resposta.downloadTokens}` : urlBase;
}

/**
 * Envia uma foto para o Storage e devolve o registro que vai no documento.
 * Depois do envio confere o tamanho gravado: se for diferente do arquivo
 * original, lança um erro em vez de deixar passar uma foto corrompida.
 */
export async function enviarFoto(
  nomeDoBucket: string,
  usuarioLogado: User,
  uriDaFoto: string,
  caminhoNoArmazenamento: string
): Promise<FotoGravada> {
  const arquivo = new File(uriDaFoto);
  const tokenDoUsuario = await usuarioLogado.getIdToken();

  const resultado = await arquivo.upload(
    montarEnderecoDoEnvio(nomeDoBucket, caminhoNoArmazenamento),
    {
      httpMethod: "POST",
      uploadType: UploadType.BINARY_CONTENT, // o arquivo vai como está, sem formulário
      mimeType: "image/jpeg",
      headers: {
        Authorization: `Firebase ${tokenDoUsuario}`,
        "Content-Type": "image/jpeg",
      },
    }
  );

  const envioFoiAceito = resultado.status >= 200 && resultado.status < 300;
  if (!envioFoiAceito) {
    throw new Error(`O Storage recusou a foto (código ${resultado.status}): ${resultado.body}`);
  }

  const resposta = JSON.parse(resultado.body) as RespostaDoStorage;
  const tamanhoGravado = Number(resposta.size);
  if (tamanhoGravado !== arquivo.size) {
    throw new Error(
      `A foto foi gravada com ${tamanhoGravado} bytes, mas o arquivo tinha ${arquivo.size}.`
    );
  }

  return {
    url: montarUrlDaFoto(nomeDoBucket, resposta),
    caminhoNoArmazenamento,
    enviadaPor: usuarioLogado.uid,
    // Timestamp.now() e não serverTimestamp(): o Firestore não aceita
    // serverTimestamp() dentro de listas.
    enviadaEm: Timestamp.now(),
  };
}
