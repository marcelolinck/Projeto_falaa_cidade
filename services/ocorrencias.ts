import { Coordenadas } from "@/context/cidade-context";
import { Ocorrencia } from "@/types/ocorrencia";

// Deslocamentos (em graus) em volta do usuário: 0.001 ≈ 110 metros.
type OcorrenciaMock = Omit<Ocorrencia, "latitude" | "longitude"> & { dLat: number; dLng: number };

const MOCK: OcorrenciaMock[] = [
  { id: "1", titulo: "Buraco na avenida", status: "aberto", dLat: 0.003, dLng: 0.002 },
  { id: "2", titulo: "Buraco em frente à escola", status: "aberto", dLat: -0.004, dLng: 0.001 },
  { id: "3", titulo: "Asfalto afundado", status: "em_execucao", dLat: 0.001, dLng: -0.004 },
  { id: "4", titulo: "Cratera na esquina", status: "em_execucao", dLat: -0.002, dLng: -0.003 },
  { id: "5", titulo: "Buraco tapado", status: "resolvido", dLat: 0.005, dLng: -0.001 },
  { id: "6", titulo: "Rua recapeada", status: "resolvido", dLat: -0.005, dLng: 0.004 },
];

/**
 * Busca as ocorrências perto de `centro`.
 * Por enquanto são dados de mentira. Quando a API existir, troque o corpo
 * por um `fetch(`${API_URL}/occurrences`)` e mantenha o mesmo retorno:
 * as telas não precisam mudar.
 */
export async function buscarOcorrencias(centro: Coordenadas): Promise<Ocorrencia[]> {
  await new Promise((resolve) => setTimeout(resolve, 400)); // simula a rede
  return MOCK.map(({ dLat, dLng, ...resto }) => ({
    ...resto,
    latitude: centro.latitude + dLat,
    longitude: centro.longitude + dLng,
  }));
}
