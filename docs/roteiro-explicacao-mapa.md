# Roteiro de explicação: tela de mapa (branch `aula26202026`)

Roteiro para apresentar, na ordem, o que foi feito na tela **Mapa** do app. Tempo total estimado: **60 a 70 minutos**.

**Resumo em uma frase:** o mapa deixou de ser só um mapa centralizado e virou uma tela útil: mostra ocorrências como pinos coloridos por status, tem busca e filtros, e leva para a tela de novo reporte.

---

## 0. Abertura (3 min)

**Mostrar:** o app rodando no celular com o mapa, os pinos, a busca e o botão "+".

**Falar:**
- Na aula anterior o mapa só mostrava onde o usuário está.
- Hoje o mapa passa a mostrar os **buracos da cidade**: onde estão e em que situação.
- Vamos fazer 4 coisas: atualizar o Expo, desenhar pinos por status, filtrar/buscar e criar o botão de novo reporte.

**Perguntar à turma:** "O que uma pessoa precisa ver num mapa de buracos?" (posição, situação, filtrar por situação).

---

## 1. Atualizar o Expo SDK 57 → 58 (10 min)

**Por que:** manter o projeto na versão atual do Expo, com as bibliotecas compatíveis entre si.

**Comandos para mostrar:**

```bash
git checkout -b aula26202026          # cada assunto novo ganha a sua branch
npx expo install expo@^58.0.0 --fix   # atualiza o Expo e as bibliotecas juntas
npx expo-doctor                       # confere se está tudo compatível
```

**Falar:**
- Use sempre `npx expo install`, não `npm install`: ele escolhe a versão certa para o SDK.
- Se o comando falhar com conflito de dependência (aconteceu aqui com o `@expo/ui`), apague `node_modules` e `package-lock.json` e rode `npm install` de novo.
- Depois de atualizar, o **development build** antigo não serve mais: refazer com `npx expo run:ios` ou `run:android`.

**Pegadinha real da aula (mostrar o erro):** o SDK 58 passou a validar a rota inicial. O `app/_layout.tsx` tinha `initialRouteName: "login"`, mas a tela de login é `app/index.tsx`. Correção:

```ts
export const unstable_settings = {
  anchor: "index", // tela de login
};
```

**Ponto didático:** "Atualizar versão quebra coisas que antes funcionavam em silêncio. Ler a mensagem de erro inteira resolve."

---

## 2. Tipos e cores dos status (7 min)

**Arquivos:** `types/ocorrencia.ts` e `constants/status.ts`

```ts
export type StatusOcorrencia = "aberto" | "em_execucao" | "resolvido";

export type Ocorrencia = {
  id: string;
  titulo: string;
  descricao?: string;   // o ? significa opcional
  status: StatusOcorrencia;
  latitude: number;
  longitude: number;
};
```

```ts
export const STATUS: Record<StatusOcorrencia, { rotulo: string; cor: string }> = {
  aberto:      { rotulo: "Aberto",      cor: "#dc2626" },
  em_execucao: { rotulo: "Em execução", cor: cores.alerta },
  resolvido:   { rotulo: "Resolvido",   cor: cores.verde },
};
```

**Falar:**
- `type` descreve a **forma** do dado. O TypeScript avisa se alguém escrever um status que não existe.
- `Record<chave, valor>` é um objeto "status → rótulo e cor". Rótulo e cor ficam num lugar só: pinos, legenda e filtros usam o mesmo.

**Desafio rápido:** "Se criarmos o status `cancelado`, o que o TypeScript vai reclamar?" (falta a entrada em `STATUS`).

---

## 3. Dados de ocorrências: serviço + hook (10 min)

**Arquivos:** `services/ocorrencias.ts` e `hooks/use-ocorrencias.ts`

**Falar:**
- Ainda **não existe API**. Usamos um **mock** (dados de mentira): 6 ocorrências espalhadas em volta do usuário.
- O mock fica dentro de uma função `buscarOcorrencias(centro)`. Quando a API existir, trocamos só o corpo dela por um `fetch`. **As telas não mudam.** Esse é o motivo de ter um "serviço".
- `await new Promise(... setTimeout ...)` simula a demora da rede.

```ts
export async function buscarOcorrencias(centro: Coordenadas): Promise<Ocorrencia[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK.map(({ dLat, dLng, ...resto }) => ({
    ...resto,
    latitude: centro.latitude + dLat,
    longitude: centro.longitude + dLng,
  }));
}
```

- Os `dLat`/`dLng` são deslocamentos: `0.001` grau ≈ 110 metros. Assim os pinos aparecem perto de **onde o aluno estiver**.

**Hook `useOcorrencias(coordenadas)`:**
- Chama o serviço dentro de um `useEffect` quando as coordenadas chegam.
- A variável `ativo` evita atualizar o estado depois que a tela foi fechada (limpeza do `useEffect`).
- Devolve `{ ocorrencias, carregando }`.

**Ponto didático:** serviço (de onde vêm os dados) separado do hook (como a tela os usa) separado da tela (como aparecem).

---

## 4. Pinos coloridos no mapa (8 min)

**Arquivos:** `components/mapa-view.tsx` e `components/mapa-view.web.tsx`

```tsx
<MapView ...>
  {ocorrencias.map((o) => (
    <Marker
      key={o.id}
      coordinate={{ latitude: o.latitude, longitude: o.longitude }}
      title={o.titulo}
      description={STATUS[o.status].rotulo}
      pinColor={STATUS[o.status].cor}
    />
  ))}
</MapView>
```

**Falar:**
- `Marker` é o pino. Um pino por ocorrência, com `.map()`.
- `key={o.id}` é obrigatório em listas: o React usa para saber quem é quem.
- Tocar no pino mostra `title` e `description`.
- O componente ganhou a prop `ocorrencias`. Na versão web (`mapa-view.web.tsx`) a prop também existe, mas é ignorada: na web só aparece o aviso.

**Mostrar na tela:** tocar em um pino de cada cor.

---

## 5. Campo de pesquisa e filtros (15 min)

**Arquivos:** `components/busca-filtros.tsx` e `app/(tabs)/mapa.tsx`

**Parte A: o componente (só aparência)**
- Campo `TextInput` com ícone de lupa e "x" para limpar.
- Botões **Todos, Abertos, Em execução, Resolvidos** numa `ScrollView` horizontal. O botão ativo fica verde.
- O componente **não guarda estado**: recebe `busca`, `filtro` e as funções `aoMudarBusca`/`aoMudarFiltro` pela props. Quem guarda é a tela.

**Parte B: a lógica na tela**

```tsx
const [busca, setBusca] = useState("");
const [filtro, setFiltro] = useState<Filtro>("todos");

const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const termo = normalizar(busca.trim());

const visiveis = ocorrencias.filter(
  (o) =>
    (filtro === "todos" || o.status === filtro) &&
    normalizar(`${o.titulo} ${o.descricao ?? ""}`).includes(termo),
);
```

**Falar:**
- `useState` guarda o que o usuário digitou/escolheu. Mudou o estado, a tela redesenha.
- `.filter()` devolve só os itens que passam nas duas condições (status **e** texto).
- `normalizar` tira acento e maiúscula: "ESCOLA", "escola" e "Escola" acham o mesmo pino.
- O mapa recebe `visiveis` no lugar de `ocorrencias`. Os dados originais não são alterados.
- Se nada combinar, aparece "Nenhuma ocorrência encontrada."

**Limitação para falar com honestidade:** a busca só **esconde** pinos. Ela não move o mapa até o resultado (fica como desafio).

**Mostrar na tela:** tocar nos filtros; digitar "escola"; digitar algo que não existe.

---

## 6. Botão "+" e tela Novo reporte (7 min)

**Arquivos:** `app/(tabs)/mapa.tsx`, `app/novo-reporte.tsx` e `app/_layout.tsx`

**Falar:**
- No Expo Router, **o arquivo é a rota**: criar `app/novo-reporte.tsx` já cria a tela `/novo-reporte`.
- O botão fica por cima do mapa (`position: "absolute"`, canto inferior direito) e navega com:

```tsx
const router = useRouter();
<Pressable onPress={() => router.push("/novo-reporte")}>
```

- Quando o aviso de "permita a localização" aparece, o botão sobe para não ficar em cima dele (`bottom: semLocalizacao ? 112 : 12`).
- A tela nova só mostra o texto "Novo reporte". O formulário fica para a próxima aula.
- No `_layout.tsx` a tela foi registrada no `Stack` mostrando só a seta de voltar.

---

## 7. Testar e fechar (5 min)

**Checklist para a turma:**
- [ ] O mapa abre centralizado e mostra 6 pinos de 3 cores.
- [ ] Tocar num pino mostra título e status.
- [ ] Cada filtro mostra só os pinos do seu status.
- [ ] Buscar "escola" deixa só o pino correspondente.
- [ ] O "+" abre "Novo reporte" e a seta volta ao mapa.

**Lembretes que sempre aparecem:**
- O `react-native-maps` **não roda no Expo Go**: use development build.
- No Android, sem a chave da Google Maps API o mapa fica cinza.
- Na web aparece só o aviso de que o mapa é do app.

**Fechamento (recapitular em 4 linhas):**
1. Tipos e cores centralizados (`types/`, `constants/`).
2. Dados atrás de um serviço (mock hoje, API amanhã).
3. Estado (`useState`) + `.filter()` para busca e filtros.
4. Nova rota criando um arquivo em `app/`.

---

## Desafios para os alunos

1. Adicionar o status `cancelado` e ver o TypeScript apontar o que falta.
2. Mostrar quantas ocorrências aparecem, ex.: "3 ocorrências".
3. Ao digitar na busca, centralizar o mapa no primeiro resultado (`MapView` + `ref.animateToRegion`).
4. Trocar o mock por um `fetch` numa API de verdade.

## Próxima aula

Formulário da tela **Novo reporte** (foto, descrição e local) e ligação com a API real.

---

## Apoio: arquivos da branch

| Arquivo | Novo? | O que faz |
|---|---|---|
| `types/ocorrencia.ts` | novo | Tipos `Ocorrencia` e `StatusOcorrencia`. |
| `constants/status.ts` | novo | Rótulo e cor de cada status. |
| `services/ocorrencias.ts` | novo | Busca ocorrências (mock por enquanto). |
| `hooks/use-ocorrencias.ts` | novo | Carrega as ocorrências das coordenadas. |
| `components/busca-filtros.tsx` | novo | Campo de pesquisa e botões de filtro. |
| `app/novo-reporte.tsx` | novo | Tela "Novo reporte" (só o título). |
| `components/mapa-view.tsx` | alterado | Desenha um `Marker` por ocorrência. |
| `components/mapa-view.web.tsx` | alterado | Aceita a prop `ocorrencias` (ignorada). |
| `app/(tabs)/mapa.tsx` | alterado | Busca, filtros, legenda, botão "+". |
| `app/_layout.tsx` | alterado | Rota inicial corrigida e tela Novo reporte registrada. |
| `package.json` | alterado | Expo SDK 58. |
