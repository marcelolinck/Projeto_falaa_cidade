# Tela de mapa com a localização do usuário

**Data:** 26/10/2026

Nesta aula a tela **Mapa** passa a mostrar o lugar onde o usuário está. O app pede permissão de localização, descobre a **cidade e o estado** (ex.: "Cuiabá, MT") e abre um **mapa centralizado** na posição dele.

Pinos, busca e filtros ficam para a próxima aula.

---

## Objetivo da aula

Ao final, o aluno deve saber:

1. Instalar bibliotecas nativas no Expo com a versão certa.
2. Pedir **permissão** ao usuário (localização) e tratar o "não".
3. Criar um **Context** novo (igual ao `AuthProvider`) para compartilhar dados entre telas.
4. Exibir um **mapa** e centralizá-lo em uma coordenada.

---

## Passo 0 — Criar a branch

```bash
git checkout -b feature/tela-mapa
```

Cada assunto novo ganha a sua branch. Assim a `main` continua funcionando.

---

## Passo 1 — Instalar as bibliotecas

```bash
npx expo install react-native-maps expo-location
```

| Biblioteca | Para quê |
|---|---|
| `expo-location` | Pede permissão, lê o GPS e converte coordenadas em endereço. |
| `react-native-maps` | Desenha o mapa na tela (Google Maps no Android, Apple Maps no iOS). |

> Use `npx expo install` (e não `npm install`): ele escolhe a versão compatível com o SDK 57.

---

## Passo 2 — Autorizar a localização (`app.json`)

Dentro de `"plugins"`, depois de `"expo-status-bar"`:

```json
[
  "expo-location",
  {
    "locationWhenInUsePermission": "O app usa sua localização para mostrar os buracos da sua cidade."
  }
]
```

Esse texto aparece na janela de permissão do celular.

---

## Passo 3 — Sigla do estado (`constants/estados.ts`)

O celular devolve o estado por extenso ("Mato Grosso"), mas o design mostra a sigla ("MT"). Este arquivo faz a conversão:

```ts
const SIGLAS: Record<string, string> = {
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  // ... os 27 estados
};

export function siglaDoEstado(nome: string | null): string | null {
  if (!nome) return null;
  return SIGLAS[nome.trim().toLowerCase()] ?? nome;
}
```

`Record<string, string>` é um objeto "nome → sigla". O `?? nome` devolve o próprio nome se não achar a sigla.

---

## Passo 4 — O contexto da cidade (`context/cidade-context.tsx`)

Várias telas vão precisar saber a cidade do usuário (mapa, ranking, criar reporte). Por isso a informação fica em um **Context**, do mesmo jeito que o `AuthProvider` guarda o usuário logado.

### 4.1 O que o contexto guarda

```ts
export type StatusCidade = "carregando" | "pronto" | "negado" | "erro";

type CidadeContextType = {
  cidade: string | null;              // "Cuiabá"
  uf: string | null;                  // "MT"
  coordenadas: Coordenadas | null;    // { latitude, longitude }
  status: StatusCidade;
  atualizar: () => Promise<void>;     // pede a localização de novo
};
```

| `status` | Significado |
|---|---|
| `carregando` | Ainda buscando a posição. |
| `pronto` | Achou a posição. |
| `negado` | O usuário recusou a permissão. |
| `erro` | Deu outro problema (GPS desligado, sem sinal...). |

### 4.2 Buscar a localização

```ts
const { status: permissao } = await Location.requestForegroundPermissionsAsync();
if (permissao !== "granted") {
  setStatus("negado");
  return;
}

const pos = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced,
});
const aqui = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
setCoordenadas(aqui);

const [lugar] = await Location.reverseGeocodeAsync(aqui); // coordenadas -> endereço
setCidade(lugar?.city ?? lugar?.subregion ?? null);
setUf(siglaDoEstado(lugar?.region ?? null));
setStatus("pronto");
```

- `"granted"` é a palavra que a biblioteca devolve quando o usuário **permitiu**.
- `reverseGeocodeAsync` faz a "geocodificação reversa": transforma coordenadas em endereço.
- A busca roda sozinha quando o app abre, dentro de um `useEffect`.

### 4.3 O hook (`hooks/use-cidade.ts`)

```ts
export function useCidade() {
  return useContext(CidadeContext);
}
```

Em qualquer tela: `const { cidade, uf, coordenadas } = useCidade();`

---

## Passo 5 — Ligar o contexto no app (`app/_layout.tsx`)

O `CidadeProvider` envolve o `ThemeProvider`, dentro do `AuthProvider`:

```tsx
<AuthProvider>
  <CidadeProvider>
    <ThemeProvider value={...}>
      <Stack>...</Stack>
    </ThemeProvider>
  </CidadeProvider>
</AuthProvider>
```

Sem isso, o `useCidade()` devolve só os valores iniciais (cidade vazia, status "carregando").

---

## Passo 6 — O componente do mapa (`components/mapa-view.tsx`)

```tsx
<MapView
  style={style}
  showsUserLocation          // bolinha azul da posição do usuário
  showsMyLocationButton      // botão "voltar para minha posição"
  initialRegion={
    coordenadas
      ? { ...coordenadas, latitudeDelta: 0.02, longitudeDelta: 0.02 }
      : BRASIL
  }
/>
```

- `latitudeDelta` / `longitudeDelta` é o **zoom**: quanto menor, mais perto. `0.02` mostra mais ou menos um bairro.
- `BRASIL` é o centro do país, usado só se não houver localização.
- O arquivo `mapa-view.web.tsx` mostra um aviso na **web**, onde o `react-native-maps` não funciona. O Expo escolhe sozinho o arquivo `.web.tsx` quando roda no navegador.

---

## Passo 7 — A tela (`app/(tabs)/mapa.tsx`)

Estrutura da tela:

```
┌──────────────────────────────┐
│ Cuiabá, MT              [ML] │  <- cabeçalho: cidade + iniciais do usuário
├──────────────────────────────┤
│                              │
│            MAPA              │  <- <MapaView coordenadas={coordenadas} />
│                              │
│  [aviso se negou permissão]  │
└──────────────────────────────┘
```

Pontos importantes do código:

```tsx
const { user } = useAuth();                                   // quem está logado
const { cidade, uf, coordenadas, status, atualizar } = useCidade();

const titulo = cidade
  ? `${cidade}${uf ? `, ${uf}` : ""}`   // "Cuiabá, MT"
  : status === "carregando" ? "Localizando..." : "Sua cidade";
```

- **Iniciais do avatar:** `"Marcelo Linck"` vira `"ML"` (primeira letra de cada palavra, no máximo 2).
- **`key` no mapa:** `<MapaView key={coordenadas ? "com-gps" : "sem-gps"} .../>`. O `initialRegion` só vale na primeira vez; mudar a `key` faz o mapa ser recriado quando a posição chega.
- **Permissão negada:** mostra um aviso com o botão **"Abrir ajustes"** (`Linking.openSettings`). Em caso de erro, o botão é **"Tentar de novo"** (`atualizar`).

---

## Passo 8 — Testar

> O `react-native-maps` **não roda no Expo Go**. É preciso gerar um *development build*:

```bash
npx expo run:android      # ou: npx expo run:ios
```

Checklist de teste:

- [ ] Ao abrir, o celular pergunta se pode usar a localização.
- [ ] Permitindo: o título muda para a sua cidade e o mapa centraliza onde você está.
- [ ] Negando: aparece o aviso "Permita a localização..." e o botão "Abrir ajustes".
- [ ] Voltando dos ajustes e tocando em "Tentar de novo" (caso `erro`), a busca recomeça.
- [ ] No navegador (`npx expo start --web`), aparece só o aviso de que o mapa é do app.

> **Android:** para o mapa do Google aparecer em um build, é preciso uma **chave da Google Maps API** (`android.config.googleMaps.apiKey` no `app.json`). Sem ela o mapa fica cinza.

---

## Resumo dos arquivos

| Arquivo | Novo? | O que faz |
|---|---|---|
| `constants/estados.ts` | novo | Nome do estado → sigla. |
| `context/cidade-context.tsx` | novo | Permissão, GPS, cidade/UF e status. |
| `hooks/use-cidade.ts` | novo | Atalho `useCidade()`. |
| `components/mapa-view.tsx` | novo | Mapa nativo centralizado. |
| `components/mapa-view.web.tsx` | novo | Aviso no lugar do mapa, na web. |
| `app/(tabs)/mapa.tsx` | alterado | Cabeçalho + mapa + aviso de permissão. |
| `app/_layout.tsx` | alterado | Registra o `CidadeProvider`. |
| `app.json` | alterado | Plugin `expo-location`. |

---

## Desafios para os alunos

1. Mostrar o texto "Sem cidade detectada" quando `cidade` for `null` e `status` for `pronto`.
2. Trocar o zoom inicial para ficar mais perto (`0.005`) e observar a diferença.
3. Exibir a `uf` em negrito no cabeçalho.

## Próxima aula

Buscar as ocorrências na API e desenhar os **pinos** coloridos por status (aberto, em execução, resolvido), mais a barra de busca e os filtros.
