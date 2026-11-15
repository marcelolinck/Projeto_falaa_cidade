import { File } from "expo-file-system";
import { ImageManipulator, ImageRef, SaveFormat } from "expo-image-manipulator";

// Limite de tamanho de cada foto depois de comprimida: 1 MB.
export const LIMITE_FOTO_BYTES = 1024 * 1024;

// Do maior para o menor: tentamos primeiro a melhor resolução e só vamos
// diminuindo se a foto ainda passar de 1 MB.
const LADOS_MAXIMOS_EM_PIXELS = [1600, 1280, 1024, 800];

// Qualidade do JPEG: 1 = sem compressão, 0 = compressão máxima.
const QUALIDADES_JPEG = [0.8, 0.7, 0.6, 0.5];

export type FotoComprimida = {
  uri: string;
  largura: number;
  altura: number;
  tamanhoBytes: number;
};

/** Descobre o tamanho (em bytes) de um arquivo local, direto do disco do celular. */
function descobrirTamanhoEmBytes(uri: string): number {
  return new File(uri).size;
}

/**
 * Reduz a foto para que o lado maior tenha no máximo `ladoMaximo` pixels,
 * mantendo a proporção. Se a foto já é menor que isso, não mexe no tamanho:
 * nunca aumentamos uma foto.
 */
async function redimensionarFoto(uri: string, ladoMaximo: number): Promise<ImageRef> {
  // Renderização sem alterações, só para ler a largura e a altura originais.
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const ladoMaiorOriginal = Math.max(original.width, original.height);

  if (ladoMaiorOriginal <= ladoMaximo) {
    return original;
  }

  const fotoEmPe = original.height > original.width;
  const novoTamanho = fotoEmPe ? { height: ladoMaximo } : { width: ladoMaximo };
  return ImageManipulator.manipulate(uri).resize(novoTamanho).renderAsync();
}

/** Salva a imagem como JPEG na qualidade indicada e mede o arquivo gerado. */
async function salvarComoJpeg(imagem: ImageRef, qualidade: number): Promise<FotoComprimida> {
  const arquivo = await imagem.saveAsync({ compress: qualidade, format: SaveFormat.JPEG });
  const tamanhoBytes = descobrirTamanhoEmBytes(arquivo.uri);

  return {
    uri: arquivo.uri,
    largura: arquivo.width,
    altura: arquivo.height,
    tamanhoBytes,
  };
}

/**
 * Reduz a foto para caber em até 1 MB, qualquer que seja a câmera do celular.
 *
 * Para cada resolução (da maior para a menor) tenta cada qualidade (da melhor
 * para a pior) e devolve a primeira foto que couber no limite. Assim a foto
 * fica com a melhor aparência possível dentro de 1 MB.
 *
 * Como a imagem é regravada, os metadados EXIF (ex.: GPS embutido na foto) não
 * vão junto. Isso protege a privacidade do usuário (RNF07).
 */
export async function comprimirFoto(uri: string): Promise<FotoComprimida> {
  let ultimaTentativa: FotoComprimida | null = null;

  for (const ladoMaximo of LADOS_MAXIMOS_EM_PIXELS) {
    const imagem = await redimensionarFoto(uri, ladoMaximo);

    for (const qualidade of QUALIDADES_JPEG) {
      ultimaTentativa = await salvarComoJpeg(imagem, qualidade);

      if (ultimaTentativa.tamanhoBytes <= LIMITE_FOTO_BYTES) {
        return ultimaTentativa;
      }
    }
  }

  // Muito improvável (exigiria uma foto gigante mesmo em 800 px e qualidade 0.5):
  // devolvemos a menor versão que foi possível gerar.
  if (!ultimaTentativa) {
    throw new Error("Não foi possível comprimir a foto.");
  }
  return ultimaTentativa;
}
