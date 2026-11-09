import { TipoOcorrencia } from "@/types/ocorrencia";

// Tipos de ocorrência que o cidadão pode reportar.
export const TIPOS: Record<TipoOcorrencia, { rotulo: string }> = {
  buraco: { rotulo: "Buraco" },
  calcada: { rotulo: "Calçada estragada" },
  iluminacao: { rotulo: "Iluminação" },
  outro: { rotulo: "Outro" },
};
