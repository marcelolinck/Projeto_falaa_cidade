/**
 * Gera o identificador da cidade usado no campo `cityId` das ocorrências.
 * Ex.: ("Cuiabá", "MT") -> "cuiaba-mt"
 *
 * Provisório: quando existir a coleção `cidades` (cadastrada por um admin) e a
 * Cloud Function onOccurrenceCreate, o `cityId` oficial virá de lá.
 */
export function gerarCidadeId(cidade: string | null, uf: string | null): string {
  if (!cidade) return "desconhecida";
  return [cidade, uf]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
