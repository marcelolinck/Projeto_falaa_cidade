import { CidadeContext } from "@/context/cidade-context";
import { useContext } from "react";

/** Cidade, UF e coordenadas do usuário (ver context/cidade-context.tsx). */
export function useCidade() {
  return useContext(CidadeContext);
}