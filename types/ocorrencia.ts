export type StatusOcorrencia = "aberto" | "em_execucao" | "resolvido";

export type TipoOcorrencia = "buraco" | "calcada" | "iluminacao" | "outro";

export type Ocorrencia = {
  id: string;
  titulo: string;
  tipo?: TipoOcorrencia;
  descricao?: string;
  status: StatusOcorrencia;
  latitude: number;
  longitude: number;
};