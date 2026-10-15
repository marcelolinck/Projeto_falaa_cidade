# Notas da versão: navegação por abas e cores compartilhadas

**Data:** 14/10/2026

Nesta versão, as telas soltas do app viraram uma **barra de abas** (Mapa, Ranking, Notificações e Perfil). Também criamos **um único arquivo de cores**, que todas as telas usam.

---

## Resumo do que mudou

| O quê | Antes | Depois |
|---|---|---|
| Navegação | Telas soltas em `app/` (`mapa.tsx`, `perfil.tsx`, `login.tsx`) | Abas em `app/(tabs)/` |
| Ícones | `IconSymbol` (só funciona bem no iOS) | Ícones **Feather** (`@react-native-vector-icons/feather`) |
| Cores | Objeto `cores` copiado em cada tela | Um único arquivo, `styles/index.tsx` |
| Saber se está logado | Parâmetro na URL: `/mapa?logado=true` | Hook `useAuth()` (Firebase) |
| Depois do login | `router.push("/mapa")` | `router.replace("/mapa")` |

### Arquivos

- **Novos:** `app/(tabs)/mapa.tsx`, `ranking.tsx`, `notificacoes.tsx`, `perfil.tsx` e `styles/index.tsx`
- **Alterados:** `app/(tabs)/_layout.tsx`, `app/_layout.tsx`, `app/index.tsx` e `package.json`
- **Removidos:**
  - `app/login.tsx` (repetia a tela inicial)
  - `app/mapa.tsx` e `app/perfil.tsx` (foram para dentro de `(tabs)`)
  - `app/(tabs)/index.tsx` e `app/(tabs)/explore.tsx` (exemplos do template)

---

## 1. Barra de abas: `app/(tabs)/_layout.tsx`˜

```tsx
<Tabs
  screenOptions={{
    tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
    headerShown: false,
    tabBarButton: HapticTab,
  }}>
  <Tabs.Screen
    name="mapa"
    options={{
      title: 'Mapa',
      tabBarIcon: ({ color }) => <Feather name="map" size={24} color={color} />,
    }}
  />
  ...
</Tabs>
```

- **`(tabs)`**: os parênteses criam um *grupo de rotas*. Eles organizam as pastas, mas **não aparecem na URL**. O arquivo `app/(tabs)/mapa.tsx` continua sendo a rota `/mapa`.
- **`name="mapa"`**: tem que ser igual ao nome do arquivo, sem o `.tsx`.
- **`screenOptions`**: configuração que vale para todas as abas de uma vez.
- **`tabBarIcon`**: o Expo Router envia a `color` (aba ativa ou inativa) e nós desenhamos o ícone com essa cor.

Para usar os ícones, instalamos um pacote novo:

```bash
npx expo install @react-native-vector-icons/feather
```

Os nomes dos ícones estão em <https://feathericons.com>. Nesta versão usamos `map`, `award`, `bell` e `user`.

---

## 2. Cores em um único lugar: `styles/index.tsx`

```tsx
export const cores = {
  verde: "#108245",
  ...
  alerta: "#b8860b",
};
```

Em qualquer tela:

```tsx
import { cores } from "@/styles";
...
backgroundColor: cores.bgBrancoGelo,
```

- **`export`** deixa outros arquivos importarem o objeto.
- **`@/`** é um atalho para a raiz do projeto, configurado no `tsconfig.json`.
- **Por que fazer assim?** Antes, para mudar o verde do app, era preciso editar cada tela e era fácil esquecer uma. Agora basta mudar em um lugar só. Esse princípio se chama **DRY** (*Don't Repeat Yourself*, "não se repita").

---

## 3. Saber quem está logado com `useAuth()`

**Antes**, a tela de login avisava o mapa pela URL:

```tsx
router.push({ pathname: "/mapa", params: { logado: "true" } });
// e no mapa:
const { logado } = useLocalSearchParams();
```

O problema dessa abordagem: qualquer pessoa poderia abrir `/mapa?logado=true` sem estar logada. Além disso, cada tela nova precisava receber esse parâmetro.

**Agora**, toda tela pergunta direto ao contexto de autenticação:

```tsx
const { user, isLogin: estaLogado } = useAuth();
```

- `useAuth()` lê o `AuthContext`, que é atualizado pelo Firebase quando o usuário entra ou sai.
- `isLogin: estaLogado` usa *desestruturação com renomeação*: pega o campo `isLogin` e o guarda na variável `estaLogado`.
- `user` traz `displayName`, `email` e `photoURL` da conta Google. Mostramos a foto com o `<Image>` do `expo-image`.

---

## 4. `router.push` × `router.replace`: `app/index.tsx`

```tsx
useEffect(() => {
  if (user) {
    router.replace("/mapa");
  }
}, [user]);
```

- **`push`** empilha a tela nova. Ao apertar "voltar", o usuário retorna para a tela anterior, que aqui seria o login.
- **`replace`** troca a tela atual. Depois de logar, o "voltar" não leva de novo ao login.
- O `useEffect` com `[user]` roda toda vez que `user` muda. Quando o Firebase confirma o login, `user` deixa de ser `null` e a navegação acontece.

---

## Pendências para a próxima aula

- [ ] As telas **Ranking**, **Notificações** e **Perfil** ainda são cópias da tela Mapa. Cada uma precisa ganhar o seu próprio conteúdo.
- [ ] O link "Ver mapa sem login" em `app/index.tsx` ainda envia `params: { logado: "false" }`, mas esse parâmetro não é mais usado e pode ser removido.
- [ ] Implementar o mapa de verdade na aba **Mapa**.
- [ ] Criar o botão **Sair** na aba **Perfil** (o `AuthContext` já tem a função `signOut`).

## Segurança

O arquivo `falaCidadeWeb.json` tem o **client secret** do Google OAuth. Ele foi incluído no `.gitignore` e **nunca deve ser enviado ao GitHub**. Credenciais ficam só na máquina de quem desenvolve ou no `.env`.
