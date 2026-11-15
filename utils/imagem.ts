import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// Limite de tamanho de cada foto depois de comprimida: 1 MB.
export const LIMITE_FOTO_BYTES = 1024 * 1024;

// Do maior para o menor: tentamos primeiro a melhor resolução e só vamos
// diminuindo se a foto ainda passar de 1 MB.
const LADOS_MAXIMOS = [1600, 1280, 1024, 800]; // pixels do lado maior
const QUALIDADES = [0.8, 0.7, 0.6, 0.5]; // 1 = sem compressão, 0 = máxima compressão

export type FotoComprimida = {
  uri: string;
  largura: number;
  altura: number;
  tamanhoBytes: number;
};

/** Descobre o tamanho (em bytes) de um arquivo local lendo-o como blob. */
async function tamanhoDoArquivo(uri: string): Promise<number> {
  const resposta = await fetch(uri);
  const blob = await resposta.blob();
  return blob.size;
}

/**
 * Reduz a foto para caber em até 1 MB, qualquer que seja a câmera do celular.
 *
 * 1. Limita o lado maior (1600 px). Fotos de 12 MP+ viram ~2 MP, mais que
 *    suficiente para enxergar o buraco na tela.
 * 2. Salva em JPEG com qualidade 0.8 e confere o tamanho do arquivo.
 * 3. Se ainda passar de 1 MB, baixa a qualidade; se mesmo assim passar,
 *    reduz também a resolução, e repete.
 *
 * Como a imagem é regravada, os metadados EXIF (ex.: GPS embutido na foto)
 * não vão junto — importante para a privacidade (RNF07).
 */
export async function comprimirImagem(uri: string): Promise<FotoComprimida> {
  // Renderização "pura", só para saber a largura e a altura originais.
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const ladoMaiorOriginal = Math.max(original.width, original.height);
  const retrato = original.height >= original.width;

  let ultima: FotoComprimida | null = null;

  for (const lado of LADOS_MAXIMOS) {
    // Nunca aumenta a foto: se ela já é menor que `lado`, mantém o tamanho.
    const redimensionar =
      ladoMaiorOriginal > lado
        ? retrato
          ? { height: lado }
          : { width: lado }
        : {};
    const imagem = await ImageManipulator.manipulate(uri)
      .resize(redimensionar)
      .renderAsync();

    for (const qualidade of QUALIDADES) {
      const salva = await imagem.saveAsync({
        compress: qualidade,
        format: SaveFormat.JPEG,
      });
      const tamanhoBytes = await tamanhoDoArquivo(salva.uri);
      ultima = {
        uri: salva.uri,
        largura: salva.width,
        altura: salva.height,
        tamanhoBytes,
      };
      if (tamanhoBytes <= LIMITE_FOTO_BYTES) return ultima;
    }
  }

  // Muito improvável: devolve a menor versão que conseguimos gerar.
  return ultima!;
}

/** Formata bytes para exibir: 734 KB, 1.2 MB. */
export function formatarTamanho(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}
