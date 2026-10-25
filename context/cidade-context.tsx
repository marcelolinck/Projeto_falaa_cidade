import { siglaDoEstado } from "@/constants/estados";
import * as Location from "expo-location";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

export type Coordenadas = { latitude: number; longitude: number };

// carregando = buscando | pronto = achou | negado = usuário negou a permissão | erro = falhou
export type StatusCidade = "carregando" | "pronto" | "negado" | "erro";

type CidadeContextType = {
  cidade: string | null; // ex.: "Cuiabá"
  uf: string | null; // ex.: "MT"
  coordenadas: Coordenadas | null; // posição do usuário
  status: StatusCidade;
  atualizar: () => Promise<void>; // pede a localização de novo
};

export const CidadeContext = createContext<CidadeContextType>({
  cidade: null,
  uf: null,
  coordenadas: null,
  status: "carregando",
  atualizar: async () => {},
});

/**
 * Descobre onde o usuário está (GPS -> cidade/UF) e disponibiliza para o app
 * inteiro, igual o AuthProvider faz com o usuário logado.
 * Uso: const { cidade, uf, coordenadas } = useCidade();
 */
export function CidadeProvider({ children }: { children: ReactNode }) {
  const [cidade, setCidade] = useState<string | null>(null);
  const [uf, setUf] = useState<string | null>(null);
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [status, setStatus] = useState<StatusCidade>("carregando");

  const atualizar = useCallback(async () => {
    try {
      setStatus("carregando");

      const { status: permissao } =
        await Location.requestForegroundPermissionsAsync();
      if (permissao !== "granted") {
        setStatus("negado");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const aqui = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setCoordenadas(aqui);

      // Geocodificação reversa: coordenadas -> endereço. Se falhar, o mapa
      // ainda abre no lugar certo, só o título fica sem o nome da cidade.
      try {
        const [lugar] = await Location.reverseGeocodeAsync(aqui);
        setCidade(lugar?.city ?? lugar?.subregion ?? null);
        setUf(siglaDoEstado(lugar?.region ?? null));
      } catch {
        setCidade(null);
        setUf(null);
      }

      setStatus("pronto");
    } catch {
      setStatus("erro");
    }
  }, []);

  useEffect(() => {
    atualizar();
  }, [atualizar]);

  return (
    <CidadeContext.Provider value={{ cidade, uf, coordenadas, status, atualizar }}>
      {children}
    </CidadeContext.Provider>
  );
}
