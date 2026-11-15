// Letras usadas pelo geohash. Cada letra representa 5 bits.
const ALFABETO_GEOHASH = "0123456789bcdefghjkmnpqrstuvwxyz";
const BITS_POR_LETRA = 5;

type Intervalo = { minimo: number; maximo: number };

type MetadeEscolhida = {
  bit: 0 | 1; // 1 = o valor está na metade de cima; 0 = na metade de baixo
  intervaloReduzido: Intervalo; // a metade onde o valor está
};

/** Divide o intervalo ao meio e diz em qual das duas metades o valor está. */
function escolherMetade(valor: number, intervalo: Intervalo): MetadeEscolhida {
  const meio = (intervalo.minimo + intervalo.maximo) / 2;

  if (valor >= meio) {
    return { bit: 1, intervaloReduzido: { minimo: meio, maximo: intervalo.maximo } };
  }
  return { bit: 0, intervaloReduzido: { minimo: intervalo.minimo, maximo: meio } };
}

/**
 * Converte latitude/longitude em um geohash: um texto que representa uma área.
 * Pontos próximos têm geohashes que começam igual, o que permite buscar
 * ocorrências por proximidade no Firestore (RF09).
 * Com 9 letras a área tem cerca de 5 metros.
 *
 * Como funciona: o mapa é dividido ao meio várias vezes, alternando entre
 * longitude e latitude. Cada divisão gera 1 bit (qual metade?), e a cada 5 bits
 * escolhemos uma letra do alfabeto.
 */
export function gerarGeohash(
  latitude: number,
  longitude: number,
  quantidadeDeLetras = 9
): string {
  let intervaloLatitude: Intervalo = { minimo: -90, maximo: 90 };
  let intervaloLongitude: Intervalo = { minimo: -180, maximo: 180 };

  let geohash = "";
  let bitsDaLetraAtual = 0;
  let numeroDaLetraAtual = 0;
  let proximoBitEhDaLongitude = true; // o geohash começa pela longitude

  while (geohash.length < quantidadeDeLetras) {
    if (proximoBitEhDaLongitude) {
      const metade = escolherMetade(longitude, intervaloLongitude);
      intervaloLongitude = metade.intervaloReduzido;
      numeroDaLetraAtual = numeroDaLetraAtual * 2 + metade.bit;
    } else {
      const metade = escolherMetade(latitude, intervaloLatitude);
      intervaloLatitude = metade.intervaloReduzido;
      numeroDaLetraAtual = numeroDaLetraAtual * 2 + metade.bit;
    }

    proximoBitEhDaLongitude = !proximoBitEhDaLongitude;
    bitsDaLetraAtual++;

    if (bitsDaLetraAtual === BITS_POR_LETRA) {
      geohash += ALFABETO_GEOHASH[numeroDaLetraAtual];
      bitsDaLetraAtual = 0;
      numeroDaLetraAtual = 0;
    }
  }

  return geohash;
}
