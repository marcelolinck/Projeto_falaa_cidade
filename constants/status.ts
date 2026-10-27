import { cores } from "@/styles";
import { StatusOcorrencia } from "@/types/ocorrencia";

export const STATUS:Record<StatusOcorrencia,{rotulo:string, cor:string}> ={
    aberto:{ rotulo:"Aberto", cor:"#dc7b26"},
    em_execucao:{ rotulo:"Em execução", cor:cores.alerta},
    resolvido:{ rotulo:"Resolvido", cor:cores.verde},
}
