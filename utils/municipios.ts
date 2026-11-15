import tabelaDeMunicipios from "@/constants/municipios-ibge.json";

/*
 * Tabela oficial de municípios do IBGE (constants/municipios-ibge.json):
 * 5.571 linhas no formato [código de 7 dígitos, nome, UF].
 * Fonte: IBGE, API de Localidades (servicodados.ibge.gov.br/api/v1/localidades/municipios),
 * edição 2026. Funciona sem internet, porque a tabela vai dentro do app.
 */

type LinhaDoMunicipio = [codigoIbge: string, nome: string, uf: string];

/** Deixa o nome comparável: "São José" e "SAO JOSE" viram o mesmo texto. */
function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira os acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ") // pontuação vira espaço
    .trim();
}

function montarChaveDeBusca(uf: string, nome: string): string {
  return `${uf.toUpperCase()}|${normalizarNome(nome)}`;
}

// Mapa "MT|sinop" -> "5107909". É montado uma vez só, na primeira consulta.
let codigoPorUfENome: Map<string, string> | null = null;

function obterMapaDeCodigos(): Map<string, string> {
  if (codigoPorUfENome) {
    return codigoPorUfENome;
  }

  const mapa = new Map<string, string>();
  for (const [codigoIbge, nome, uf] of tabelaDeMunicipios as LinhaDoMunicipio[]) {
    mapa.set(montarChaveDeBusca(uf, nome), codigoIbge);
  }
  codigoPorUfENome = mapa;
  return mapa;
}

/**
 * Descobre o código IBGE do município a partir do que o geocoder devolveu.
 * O nome sozinho não basta (há cidades com o mesmo nome em estados diferentes),
 * por isso a busca é por UF + nome. Recebe vários nomes candidatos (cidade,
 * subregião...) e usa o primeiro que existir na tabela.
 * Devolve null se não encontrar.
 */
export function buscarCodigoIbge(
  nomesCandidatos: (string | null | undefined)[],
  uf: string | null
): string | null {
  if (!uf) {
    return null;
  }

  const mapa = obterMapaDeCodigos();
  for (const nome of nomesCandidatos) {
    if (!nome) {
      continue;
    }
    const codigoIbge = mapa.get(montarChaveDeBusca(uf, nome));
    if (codigoIbge) {
      return codigoIbge;
    }
  }
  return null;
}
