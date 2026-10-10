# Atualização do Expo SDK 54 → 57

Registro da atualização do projeto do Expo SDK 54 para o SDK 57 e dos ajustes necessários para ele voltar a funcionar.

## Versões

| Pacote         | Antes  | Depois  |
| -------------- | ------ | ------- |
| `expo`         | 54.0   | 57.0    |
| `react-native` | 0.81.5 | 0.86.3  |
| `react`        | 19.1.0 | 19.2.3  |
| `expo-router`  | 6.0    | 57.0    |
| `typescript`   | 5.9    | 6.0     |

Requisitos mínimos a partir daqui: Node `^20.19.4`, `^22.13.0` ou `^24.3.0`, Xcode 26.4 e iOS 16.4.

## Como a atualização foi feita

A Expo recomenda subir **um SDK por vez** (54 → 55 → 56 → 57), testando entre cada etapa. Em cada etapa:

```bash
npx expo install expo@^<versão>.0.0 --fix
npx expo-doctor
npx expo start -c
```

Notas de cada versão: [SDK 55](https://expo.dev/changelog/sdk-55), [SDK 56](https://expo.dev/changelog/sdk-56), [SDK 57](https://expo.dev/changelog/sdk-57).

## Problemas encontrados e correções

### 1. Erro do React Navigation (SDK 56)

A partir do SDK 56, o `expo-router` **não depende mais do React Navigation**: ele traz as próprias versões dessas APIs. Os imports de `@react-navigation/*` passaram a quebrar.

| Arquivo | Antes | Depois |
| --- | --- | --- |
| [app/_layout.tsx](../app/_layout.tsx) | `ThemeProvider`, `DarkTheme`, `DefaultTheme` de `@react-navigation/native` | de `expo-router` |
| [components/haptic-tab.tsx](../components/haptic-tab.tsx) | `PlatformPressable` de `@react-navigation/elements` | de `expo-router/react-navigation` |
| [components/haptic-tab.tsx](../components/haptic-tab.tsx) | `BottomTabBarButtonProps` de `@react-navigation/bottom-tabs` | de `expo-router/tabs` |

Os pacotes `@react-navigation/native`, `@react-navigation/bottom-tabs` e `@react-navigation/elements` foram removidos do `package.json`.

### 2. Chaves removidas do `app.json` (SDK 55)

A nova arquitetura e o modo edge-to-edge do Android passaram a ser obrigatórios, então as opções deixaram de existir. Foram removidas do [app.json](../app.json):

- `expo.newArchEnabled`
- `expo.android.edgeToEdgeEnabled`

### 3. Tema `'unspecified'` (React Native 0.86)

O `useColorScheme()` do React Native agora pode retornar `'light' | 'dark' | 'unspecified'`. Como `Colors` só tem `light` e `dark`, expressões como `Colors[colorScheme]` deixaram de compilar.

Correção: os hooks [use-color-scheme.ts](../hooks/use-color-scheme.ts) e [use-color-scheme.web.ts](../hooks/use-color-scheme.web.ts) agora sempre retornam `'light'` ou `'dark'`:

```ts
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
```

### 4. Ícones: `@expo/vector-icons` descontinuado (SDK 56)

O `@expo/vector-icons` foi descontinuado em favor dos pacotes `@react-native-vector-icons/*`, e o `expo-doctor` acusava conflito porque o projeto usava os dois.

Em [components/ui/icon-symbol.tsx](../components/ui/icon-symbol.tsx):

```ts
// antes
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
// depois
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
```

Também foi ajustado o tipo do mapeamento de ícones, porque no novo `expo-symbols` o `name` pode ser uma string **ou** um objeto por plataforma. Usamos `Extract<SymbolViewProps['name'], string>` para pegar só a forma em string.

## Verificação

- `npx tsc --noEmit`: sem erros
- `npm run lint`: sem erros
- `npx expo-doctor`: 21/21 verificações ok
- `npx expo export --platform ios --platform android`: bundles gerados

## Pontos de atenção

- **`fetch` global**: desde o SDK 56 o `fetch` padrão é o `expo/fetch`. Se o login com Google ou o Firebase se comportarem diferente, teste com `EXPO_PUBLIC_USE_RN_FETCH=1` no `.env` para voltar ao `fetch` antigo.
- **Expo Go / development build**: use o Expo Go compatível com o SDK 57 ou gere um novo development build (entraram pacotes nativos novos).
- **Cache**: depois de atualizar, sempre inicie com `npx expo start -c`.
