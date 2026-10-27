export type StatusOcorrencia = "aberto" | "em_execucao" | "resolvido";

export type Ocorrencia = {
  id: string;
  titulo: string;
  descricao?: string;
  status: StatusOcorrencia;
  latitude: number;
  longitude: number;
};