# Roteiro de explicação: tela Novo reporte (branch `09112026`)

Roteiro para apresentar, na ordem, o que foi feito na tela **Novo reporte**. Tempo total estimado: **60 a 70 minutos**.

**Resumo em uma frase:** a tela que só mostrava um título virou um formulário completo: tipo da ocorrência, descrição, fotos (com limite e exclusão), localização automática e envio com validação.

Manual detalhado, passo a passo: [manual-nova-solicitacao.md](manual-nova-solicitacao.md)

---

## 0. Abertura (3 min)

**Mostrar:** o app no celular: mapa → botão "+" → tela Novo reporte preenchida.

**Falar:**
- Na aula passada o "+" abria uma tela vazia. Hoje ela vira o formulário real.
- Vamos fazer 5 coisas: ler o desenho, escolher o tipo, tirar fotos, mostrar o local e enviar.

**Perguntar à turma:** "O que o cidadão precisa informar para a prefeitura entender o problema?" (o que é, onde é, foto, detalhes).

---

## 1. Do desenho para o código (7 min)

**Mostrar:** o print do desenho ao lado da tela pronta.

**Falar:**
- Antes de programar, **quebre o desenho em blocos**: cabeçalho, etapas, foto, foto de referência, mapa, endereço, severidade, descrição, botão.
- Cada bloco vira um pedaço do JSX, na mesma ordem de cima para baixo.
- Cores sempre de `@/styles` (`cores.verde`...). Mudou a marca? Muda num lugar só.

**Comandos:**

```bash
git checkout -b 09112026
npx expo install expo-image-picker   # câmera
```

**Ponto didático:** o desenho não é a verdade final. Durante a aula o pedido mudou ("não é só buraco") e o formulário se adaptou. Código bem separado aguenta mudança.

---

## 2. Cabeçalho, etapas e rolagem (7 min)

**Arquivo:** `app/novo-reporte.tsx`

**Falar:**
- `SafeAreaView`: respeita o notch do celular.
- `ScrollView`: o formulário é maior que a tela. `KeyboardAvoidingView`: o teclado não cobre o campo.
- O X chama `router.back()`. No `_layout.tsx` escondemos o cabeçalho padrão (`headerShown: false`) porque a tela desenha o próprio.
- `Etapas` é um **componente**: recebe nada, desenha 4 bolinhas. Concluída = azul com check, atual = verde, futura = cinza. No desenho está fixo na etapa 2.

---

## 3. Tipo de ocorrência e severidade: os "chips" (10 min)

**Arquivos:** `types/ocorrencia.ts`, `constants/tipos.ts`

```ts
export type TipoOcorrencia = "buraco" | "calcada" | "iluminacao" | "outro";

export const TIPOS: Record<TipoOcorrencia, { rotulo: string }> = {
  buraco:     { rotulo: "Buraco" },
  calcada:    { rotulo: "Calçada estragada" },
  iluminacao: { rotulo: "Iluminação" },
  outro:      { rotulo: "Outro" },
};
```

**Falar:**
- Mesma ideia dos status da aula passada: `type` + `Record` com o rótulo. Os botões são gerados com `.map()` em cima de `TIPOS`.
- **Para criar um tipo novo:** uma linha no `type` e uma em `TIPOS`. O botão aparece sozinho.
- O botão selecionado vem de um `useState`: `onPress={() => setTipo(valor)}`; o estilo muda comparando `tipo === valor`.
- Severidade usa exatamente o mesmo estilo de chip: **reaproveitar estilo** em vez de copiar.

**Desafio rápido:** "Se adicionarmos `arvore_caida`, o que o TypeScript vai reclamar se esquecermos o `TIPOS`?"

---

## 4. Descrição com regra (5 min)

```tsx
{tipo === "outro" ? "2. Descrição *" : "2. Descrição (opcional)"}
```

**Falar:**
- Para "Buraco" a foto basta. Para **"Outro"** a descrição é a única forma de entender o problema, então vira obrigatória.
- O rótulo e o placeholder mudam conforme o tipo escolhido: a tela **reage ao estado**.
- A descrição fica logo depois do tipo, antes das fotos (pedido de ordem da aula).

---

## 5. Fotos: câmera, limite e exclusão (15 min)

**Falar:**
- `fotos` e `fotosReferencia` são listas de texto (`string[]`): o endereço (`uri`) de cada foto no celular.
- Limites: **5** fotos do problema e **2** de referência (`MAX_FOTOS`, `MAX_FOTOS_REFERENCIA`).

**Tirar a foto:**

```ts
const { granted } = await ImagePicker.requestCameraPermissionsAsync();
const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
if (!resultado.canceled) definir((atuais) => [...atuais, resultado.assets[0].uri]);
```

- Primeiro **pede permissão**; se negar, mostra um alerta.
- `[...atuais, nova]` cria uma lista nova com a foto no fim. No React nunca se altera a lista antiga, sempre se cria outra.
- No `app.json`, o plugin `expo-image-picker` traz o texto que o iOS exibe ao pedir a câmera.

**Componente `ListaFotos`** (um só, usado nas duas seções; só mudam `max` e o texto):
- Quadro da câmera aparece enquanto não chegou no limite.
- Abaixo: "✓ 3 fotos adicionadas" e as miniaturas, **para a pessoa saber o que já foi tirado**.
- Lixeira vermelha em cada miniatura → alerta "Deseja excluir esta foto?" → `filter` remove só aquela:

```ts
setFotos((f) => f.filter((_, j) => j !== i));
```

**Ponto didático:** um componente com **props** (`uris`, `max`, `onAdicionar`, `onRemover`) serve para os dois casos. É o motivo de existir componente.

**Dica de demonstração:** a câmera não funciona no simulador do iOS nem na web. Demonstrar em aparelho real.

---

## 6. Localização automática (10 min)

**Falar:**
- `useCidade()` (contexto da aula anterior) já traz as `coordenadas` do usuário. **Não pedimos o GPS de novo.**
- Mini-mapa: reaproveita o `MapaView` dentro de uma `View` com `pointerEvents="none"` (só mostra, não deixa arrastar) e um pino por cima.
- Endereço: `Location.reverseGeocodeAsync(coordenadas)` transforma latitude/longitude em "Rua, número — Bairro".

```ts
useEffect(() => {
  let ativo = true;
  Location.reverseGeocodeAsync(coordenadas).then(([lugar]) => { if (ativo) ... });
  return () => { ativo = false; };
}, [coordenadas]);
```

- `ativo` evita mexer no estado depois que a tela foi fechada (mesma limpeza do `useOcorrencias`).
- Limitação conhecida: o pino é fixo na posição do usuário; não dá para escolher outro ponto ainda.

---

## 7. Validar e enviar (8 min)

```ts
if (fotos.length === 0) → "Foto obrigatória"
if (tipo === "outro" && !descricao.trim()) → "Descrição obrigatória"
```

**Falar:**
- Validar **antes** de enviar e dizer claramente o que falta.
- `.trim()` evita aceitar só espaços como descrição.
- `enviando` desabilita o botão e troca o texto para "Enviando..." (evita duplo toque).
- **Não existe API ainda**: o envio é simulado (600 ms) e volta para o mapa. Há um `TODO` com os campos que serão enviados. Mesmo padrão do `buscarOcorrencias`: quando a API chegar, troca-se só esse trecho.

---

## 8. Extra: splash screen (3 min)

**Falar:**
- A imagem do splash era a padrão do template (círculos cinza). Trocamos por um pino verde com "Falaa Cidade".
- O splash só muda em **build novo**, não ao recarregar o app.

---

## 9. Testar e fechar (5 min)

**Checklist para a turma:**
- [ ] "+" no mapa abre a tela; o X volta.
- [ ] Os 4 tipos selecionam um por vez.
- [ ] Sem foto → "Foto obrigatória". "Outro" sem descrição → "Descrição obrigatória".
- [ ] 5 fotos do problema: na quinta o quadro da câmera some.
- [ ] 2 fotos de referência: na segunda o quadro some.
- [ ] A lixeira pede confirmação e remove a foto certa.
- [ ] O endereço aparece; o envio mostra "Reporte enviado" e volta ao mapa.

**Fechamento (recapitular em 4 linhas):**
1. Desenho quebrado em blocos, um bloco por parte do JSX.
2. Tipos e rótulos em `types/` e `constants/`; botões gerados com `.map()`.
3. Estado (`useState`) para tipo, fotos, descrição; listas sempre recriadas, nunca alteradas.
4. Componente reutilizável (`ListaFotos`) e envio atrás de um `TODO` até a API existir.

---

## Desafios para os alunos

1. Adicionar o tipo `arvore_caida` e ver o botão aparecer.
2. Permitir também escolher foto da **galeria** (`launchImageLibraryAsync`).
3. Fazer o indicador de etapas avançar de verdade conforme o formulário é preenchido.
4. Deixar o usuário arrastar o pino para ajustar o local.
5. Trocar o envio simulado por um `fetch` numa API.

## Próxima aula

Ligar o envio à API real (upload das fotos) e mostrar o reporte novo no mapa.

---

## Apoio: arquivos da branch

| Arquivo | Novo? | O que faz |
|---|---|---|
| `app/novo-reporte.tsx` | alterado | O formulário completo. |
| `constants/tipos.ts` | novo | Rótulo de cada tipo de ocorrência. |
| `types/ocorrencia.ts` | alterado | `TipoOcorrencia` e campo `tipo`. |
| `app/_layout.tsx` | alterado | Esconde o cabeçalho padrão da tela. |
| `app.json` | alterado | Permissão da câmera; tamanho do splash. |
| `assets/images/splash-icon.png` | alterado | Splash com "Falaa Cidade". |
| `package.json` | alterado | Inclui `expo-image-picker`. |
