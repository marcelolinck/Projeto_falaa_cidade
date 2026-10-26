import { Coordenadas } from "@/context/cidade-context";
import { buscarOcorrencias } from "@/services/ocorrencias";
import { Ocorrencia } from "@/types/ocorrencia";
import { useEffect, useState } from "react";

/** Carrega as ocorrências perto das coordenadas dadas. */
export function useOcorrencias(coordenadas: Coordenadas | null) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!coordenadas) {
      setOcorrencias([]);
      return;
    }
    let ativo = true; // evita atualizar o estado depois que a tela mudou
    setCarregando(true);
    buscarOcorrencias(coordenadas)
      .then((lista) => ativo && setOcorrencias(lista))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [coordenadas]);

  return { ocorrencias, carregando };
}
