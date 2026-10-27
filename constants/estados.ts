/**
 * Converte o nome do estado ("Mato Grosso") para a sigla ("MT").
 * O geocoder do celular devolve o nome por extenso, mas o design mostra a sigla.
 * Se o nome não for encontrado, a função devolve o próprio texto recebido.
 */
const SIGLAS: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapá: "AP", amazonas: "AM", bahia: "BA",
  ceará: "CE", "distrito federal": "DF", "espírito santo": "ES", goiás: "GO",
  maranhão: "MA", "mato grosso": "MT", "mato grosso do sul": "MS",
  "minas gerais": "MG", pará: "PA", paraíba: "PB", paraná: "PR",
  pernambuco: "PE", piauí: "PI", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", "rio grande do sul": "RS", rondônia: "RO",
  roraima: "RR", "santa catarina": "SC", "são paulo": "SP", sergipe: "SE",
  tocantins: "TO",
};

export function siglaDoEstado(nome: string | null): string | null {
  if (!nome) return null;
  return SIGLAS[nome.trim().toLowerCase()] ?? nome;
}