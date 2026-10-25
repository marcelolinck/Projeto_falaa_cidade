import { CityContext } from "@/context/city-context";
import { useContext } from "react";

/** Cidade, UF e coordenadas do usuário (ver context/city-context.tsx). */
export function useCity() {
  return useContext(CityContext);
}
