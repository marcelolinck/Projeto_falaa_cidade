import { cores } from "@/styles";
import { StatusOcorrencia } from "@/types/ocorrencia";

// Rótulo e cor de cada status. Usado nos pinos do mapa e na legenda.
export const STATUS: Record<StatusOcorrencia, { rotulo: string; cor: string }> = {
  aberto: { rotulo: "Aberto", cor: "#dc2626" },
  em_execucao: { rotulo: "Em execução", cor: cores.alerta },
  resolvido: { rotulo: "Resolvido", cor: cores.verde },
};
