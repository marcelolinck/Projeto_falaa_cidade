import { siglaDoEstado } from "@/constants/estados";
import { buscarCodigoIbge } from "@/utils/municipios";
import * as Location from "expo-location";
import { createContext, ReactNode, useCallback, useEffect, useState } from "react";

export type Coordenadas = { latitude: number; longitude: number };

// carregando = buscando | pronto = achou | negado = usuário negou a permissão | erro = falhou
export type SituacaoCidade = "carregando" | "pronto" | "negado" | "erro";

type ContextoCidade = {
  cidade: string | null; // ex.: "Sinop"
  uf: string | null; // ex.: "MT"
  codigoIbge: string | null; // ex.: "5107909", identifica a cidade no banco de dados
  coordenadas: Coordenadas | null; // posição do usuário
  situacao: SituacaoCidade;
  atualizar: () => Promise<void>; // pede a localização de novo
};

export const CidadeContext = createContext<ContextoCidade>({
  cidade: null,
  uf: null,
  codigoIbge: null,
  coordenadas: null,
  situacao: "carregando",
  atualizar: async () => {},
});

type DadosDaCidade = {
  cidade: string | null;
  uf: string | null;
  codigoIbge: string | null;
};

const CIDADE_NAO_IDENTIFICADA: DadosDaCidade = { cidade: null, uf: null, codigoIbge: null };

/** Pergunta ao usuário se o app pode usar a localização enquanto está aberto. */
async function usuarioPermitiuLocalizacao(): Promise<boolean> {
  const resposta = await Location.requestForegroundPermissionsAsync();
  return resposta.granted;
}

/** Lê a posição atual do GPS. */
async function lerCoordenadasAtuais(): Promise<Coordenadas> {
  const posicao = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: posicao.coords.latitude,
    longitude: posicao.coords.longitude,
  };
}

/**
 * Descobre cidade, UF e código IBGE a partir das coordenadas.
 * Se a geocodificação reversa falhar, o mapa ainda abre no lugar certo; só
 * ficamos sem o nome da cidade.
 */
async function descobrirCidade(coordenadas: Coordenadas): Promise<DadosDaCidade> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync(coordenadas);
    const uf = siglaDoEstado(lugar?.region ?? null);

    return {
      cidade: lugar?.city ?? lugar?.subregion ?? null,
      uf,
      // Cidade do GPS -> código oficial do IBGE (tabela embutida no app).
      codigoIbge: buscarCodigoIbge([lugar?.city, lugar?.subregion], uf),
    };
  } catch {
    return CIDADE_NAO_IDENTIFICADA;
  }
}

/**
 * Descobre onde o usuário está (GPS -> cidade/UF -> código IBGE) e disponibiliza
 * para o app inteiro, igual o AuthProvider faz com o usuário logado.
 * Uso: const { cidade, uf, codigoIbge, coordenadas } = useCidade();
 */
export function CidadeProvider({ children }: { children: ReactNode }) {
  const [dadosDaCidade, setDadosDaCidade] = useState<DadosDaCidade>(CIDADE_NAO_IDENTIFICADA);
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [situacao, setSituacao] = useState<SituacaoCidade>("carregando");

  const atualizar = useCallback(async () => {
    try {
      setSituacao("carregando");

      if (!(await usuarioPermitiuLocalizacao())) {
        setSituacao("negado");
        return;
      }

      const coordenadasAtuais = await lerCoordenadasAtuais();
      setCoordenadas(coordenadasAtuais);
      setDadosDaCidade(await descobrirCidade(coordenadasAtuais));
      setSituacao("pronto");
    } catch {
      setSituacao("erro");
    }
  }, []);

  useEffect(() => {
    atualizar();
  }, [atualizar]);

  return (
    <CidadeContext.Provider value={{ ...dadosDaCidade, coordenadas, situacao, atualizar }}>
      {children}
    </CidadeContext.Provider>
  );
}
