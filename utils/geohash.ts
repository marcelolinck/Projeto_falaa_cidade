const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * Converte latitude/longitude em um geohash (texto que representa uma área).
 * Pontos próximos têm geohashes que começam igual, o que permite buscar
 * ocorrências por proximidade no Firestore (RF09).
 * Precisão 9 ≈ 5 metros.
 */
export function gerarGeohash(latitude: number, longitude: number, precisao = 9): string {
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
  let hash = "";
  let bit = 0;
  let indice = 0;
  let usaLongitude = true;

  while (hash.length < precisao) {
    if (usaLongitude) {
      const meio = (lngMin + lngMax) / 2;
      if (longitude >= meio) { indice = indice * 2 + 1; lngMin = meio; }
      else { indice = indice * 2; lngMax = meio; }
    } else {
      const meio = (latMin + latMax) / 2;
      if (latitude >= meio) { indice = indice * 2 + 1; latMin = meio; }
      else { indice = indice * 2; latMax = meio; }
    }
    usaLongitude = !usaLongitude;

    if (++bit === 5) {
      hash += BASE32[indice];
      bit = 0;
      indice = 0;
    }
  }
  return hash;
}
