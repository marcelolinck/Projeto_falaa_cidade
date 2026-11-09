# Manual: criação da tela "Novo reporte" (nova solicitação)

**Branch:** `09112026`  ·  **Arquivo principal:** [app/novo-reporte.tsx](../app/novo-reporte.tsx)

Passo a passo de como a tela foi construída, a partir do desenho (Figma/print). No fim há a lista de arquivos e um checklist de teste.

---

## O que a tela faz

O cidadão registra um problema da cidade (buraco, calçada estragada, iluminação ou outro): escolhe o tipo, descreve, tira fotos, confere a localização e envia.

Ordem final dos campos:

1. Tipo de ocorrência *
2. Descrição (obrigatória só no tipo "Outro")
3. Fotos do problema * (até **5**)
4. Fotos de referência (opcional, até **2**)
5. Localização (mini-mapa + endereço)
6. Severidade (Leve / Moderado / Grave)
7. Botão "Enviar reporte"

---

## Passo 1 — Criar a branch

```bash
git checkout -b 09112026
```

Cada assunto novo ganha a sua branch.

## Passo 2 — Instalar a biblioteca da câmera

```bash
npx expo install expo-image-picker
```

Use `npx expo install` (não `npm install`) para vir a versão certa para o SDK 58. A localização (`expo-location`) e os ícones (Feather) já estavam no projeto.

## Passo 3 — Pedir permissão da câmera no `app.json`

No iOS é obrigatório explicar por que o app usa a câmera. Em `plugins`:

```json
["expo-image-picker", { "cameraPermission": "O app usa a câmera para fotografar o problema da sua cidade." }]
```

Mudanças em `app.json` só valem em **novo development build** (`npx expo run:ios` / `run:android`).

## Passo 4 — Tipos de ocorrência

`types/ocorrencia.ts` ganhou o tipo e um campo opcional:

```ts
export type TipoOcorrencia = "buraco" | "calcada" | "iluminacao" | "outro";
// em Ocorrencia:
tipo?: TipoOcorrencia;
```

`constants/tipos.ts` guarda o rótulo de cada tipo (mesma ideia do `constants/status.ts`):

```ts
export const TIPOS: Record<TipoOcorrencia, { rotulo: string }> = {
  buraco: { rotulo: "Buraco" },
  calcada: { rotulo: "Calçada estragada" },
  iluminacao: { rotulo: "Iluminação" },
  outro: { rotulo: "Outro" },
};
```

**Para criar um tipo novo:** adicionar o valor em `TipoOcorrencia` e uma linha em `TIPOS`. O TypeScript avisa se esquecer uma das duas.

## Passo 5 — Registrar a tela no layout

Em `app/_layout.tsx` a tela desenha o próprio cabeçalho (X + título), então o cabeçalho padrão é escondido:

```tsx
<Stack.Screen name="novo-reporte" options={{ headerShown: false }} />
```

O mapa já abre a tela com `router.push("/novo-reporte")`.

## Passo 6 — Esqueleto da tela e cabeçalho

- `SafeAreaView` para respeitar o notch.
- Cabeçalho branco arredondado com o botão **X** (`router.back()`) e o título "Novo reporte".
- `KeyboardAvoidingView` + `ScrollView` para o teclado não cobrir o campo de descrição (`keyboardShouldPersistTaps="handled"` deixa tocar nos botões com o teclado aberto).
- Cores sempre de `@/styles` (`cores.verde`, `cores.azul`...), nunca digitadas soltas.

## Passo 7 — Indicador de etapas

Componente `Etapas`: 4 bolinhas ligadas por linhas. Etapa concluída = azul com check, atual = verde, futuras = cinza. No desenho está fixo na etapa 2 (`ETAPA_ATUAL = 2`).

## Passo 8 — Tipo e severidade (botões "chip")

Os dois usam o mesmo estilo (`chips`, `chip`, `chipAtivo`). Um `useState` guarda o valor escolhido; o chip selecionado ganha borda verde e fundo verde claro.

```tsx
const [tipo, setTipo] = useState<TipoOcorrencia>("buraco");
{(Object.keys(TIPOS) as TipoOcorrencia[]).map((valor) => (
  <Pressable key={valor} onPress={() => setTipo(valor)} ... />
))}
```

`flexWrap: "wrap"` faz os chips irem para a linha de baixo se não couberem.

## Passo 9 — Descrição

`TextInput` com `multiline`. Quando o tipo é **"Outro"**, o rótulo ganha `*` e o placeholder muda para "Descreva o problema...", porque sem descrição não há como saber o que é.

## Passo 10 — Fotos (até 5 e até 2)

Estados: `fotos` e `fotosReferencia`, ambos `string[]` com o endereço (`uri`) de cada foto.

**Tirar a foto** (`tirarFoto`): pede permissão, abre a câmera e acrescenta a foto na lista.

```ts
const { granted } = await ImagePicker.requestCameraPermissionsAsync();
const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
if (!resultado.canceled) definir((atuais) => [...atuais, resultado.assets[0].uri]);
```

**Componente `ListaFotos`** (usado nas duas seções, só mudam `max` e o texto):
- Enquanto não chegou no limite, mostra o quadro da câmera ("Toque para adicionar outra foto").
- Logo abaixo, "✓ N fotos adicionadas" e as miniaturas.
- Cada miniatura tem uma **lixeira vermelha**; ao tocar, abre a confirmação "Deseja excluir esta foto?".
- Ao chegar no limite, o quadro da câmera some e o texto mostra "(limite atingido)".
- Os rótulos mostram o contador: `(2/5)` e `(1/2)`.

Os limites são as constantes `MAX_FOTOS = 5` e `MAX_FOTOS_REFERENCIA = 2`.

## Passo 11 — Localização

- `useCidade()` entrega as `coordenadas` do usuário (contexto que já existia).
- Mini-mapa: reaproveita o `MapaView`, dentro de uma `View` com `pointerEvents="none"` (não deixa mexer) e um pino vermelho por cima.
- Endereço: um `useEffect` converte as coordenadas em texto com `Location.reverseGeocodeAsync` ("Rua, número — Bairro"). A variável `ativo` evita atualizar o estado se a tela fechar antes da resposta.

## Passo 12 — Enviar

```ts
if (fotos.length === 0) → alerta "Foto obrigatória"
if (tipo === "outro" && !descricao.trim()) → alerta "Descrição obrigatória"
```

Passando nas validações, mostra "Enviando...", espera 600 ms (simulado), exibe "Reporte enviado" e volta para o mapa. **Ainda não existe API**: o `TODO` no código lista o que enviar quando ela existir (`tipo, fotos, fotosReferencia, coordenadas, endereco, severidade, descricao`).

---

## Arquivos da branch

| Arquivo | Novo? | O que faz |
|---|---|---|
| `app/novo-reporte.tsx` | alterado | A tela completa. |
| `constants/tipos.ts` | novo | Rótulo de cada tipo de ocorrência. |
| `types/ocorrencia.ts` | alterado | `TipoOcorrencia` e campo `tipo`. |
| `app/_layout.tsx` | alterado | Esconde o cabeçalho padrão da tela. |
| `app.json` | alterado | Permissão da câmera e tamanho do splash. |
| `assets/images/splash-icon.png` | alterado | Splash com o nome "Falaa Cidade". |
| `package.json` / `package-lock.json` | alterado | Inclui `expo-image-picker`. |

## Checklist de teste

- [ ] Tocar no "+" do mapa abre a tela; o X volta.
- [ ] Os 4 tipos selecionam um por vez; "Buraco" vem marcado.
- [ ] Enviar sem foto mostra "Foto obrigatória".
- [ ] Tipo "Outro" sem descrição mostra "Descrição obrigatória".
- [ ] Dá para tirar 5 fotos do problema; na 5ª o quadro da câmera some.
- [ ] Dá para tirar 2 fotos de referência; na 2ª o quadro some.
- [ ] A lixeira pede confirmação e remove só a foto escolhida.
- [ ] O endereço aparece com a localização liberada.
- [ ] Enviar com tudo certo mostra "Reporte enviado" e volta ao mapa.

## Lembretes

- A câmera **não funciona no simulador do iOS** nem na web: testar em aparelho real.
- O mapa (`react-native-maps`) não roda no Expo Go; usar development build.
- O envio é simulado até a API existir.
