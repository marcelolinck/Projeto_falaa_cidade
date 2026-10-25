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

// loading = buscando | ready = achou | denied = usuário negou a permissão | error = falhou
export type StatusCidade = "loading" | "ready" | "denied" | "error";

type CityContextType = {
  cidade: string | null; // ex.: "Cuiabá"
  uf: string | null; // ex.: "MT"
  coords: Coordenadas | null; // posição do usuário
  status: StatusCidade;
  atualizar: () => Promise<void>; // pede a localização de novo
};

export const CityContext = createContext<CityContextType>({
  cidade: null,
  uf: null,
  coords: null,
  status: "loading",
  atualizar: async () => {},
});

/**
 * Descobre onde o usuário está (GPS -> cidade/UF) e disponibiliza para o app
 * inteiro, igual o AuthProvider faz com o usuário logado.
 * Uso: const { cidade, uf, coords } = useCity();
 */
export function CityProvider({ children }: { children: ReactNode }) {
  const [cidade, setCidade] = useState<string | null>(null);
  const [uf, setUf] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [status, setStatus] = useState<StatusCidade>("loading");

  const atualizar = useCallback(async () => {
    try {
      setStatus("loading");

      const { status: permissao } =
        await Location.requestForegroundPermissionsAsync();
      if (permissao !== "granted") {
        setStatus("denied");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const aqui = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setCoords(aqui);

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

      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    atualizar();
  }, [atualizar]);

  return (
    <CityContext.Provider value={{ cidade, uf, coords, status, atualizar }}>
      {children}
    </CityContext.Provider>
  );
}
