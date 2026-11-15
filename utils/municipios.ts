import tabela from "@/constants/municipios-ibge.json";

/*
 * Tabela oficial de municípios do IBGE (constants/municipios-ibge.json):
 * 5.571 linhas no formato [código de 7 dígitos, nome, UF].
 * Fonte: IBGE, API de Localidades (servicodados.ibge.gov.br/api/v1/localidades/municipios),
 * edição 2026. Funciona offline, porque a tabela vai dentro do app.
 */

type Municipio = [codigo: string, nome: string, uf: string];

// "São José do Rio Claro" e "SAO JOSE DO RIO CLARO" viram o mesmo texto.
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Índice "MT|sinop" -> "5107909". Montado uma vez, na primeira consulta.
let indice: Map<string, string> | null = null;

function obterIndice(): Map<string, string> {
  if (!indice) {
    indice = new Map();
    for (const [codigo, nome, uf] of tabela as Municipio[]) {
      indice.set(`${uf}|${normalizar(nome)}`, codigo);
    }
  }
  return indice;
}

/**
 * Descobre o código IBGE do município a partir do que o geocoder devolveu.
 * O nome sozinho não basta (há cidades com o mesmo nome em estados diferentes),
 * por isso a busca é por UF + nome. Recebe vários nomes candidatos (cidade,
 * subregião...) e usa o primeiro que existir na tabela.
 * Devolve null se não encontrar.
 */
export function buscarCodigoIbge(
  nomes: (string | null | undefined)[],
  uf: string | null
): string | null {
  if (!uf) return null;
  const mapa = obterIndice();
  for (const nome of nomes) {
    if (!nome) continue;
    const codigo = mapa.get(`${uf.toUpperCase()}|${normalizar(nome)}`);
    if (codigo) return codigo;
  }
  return null;
}
