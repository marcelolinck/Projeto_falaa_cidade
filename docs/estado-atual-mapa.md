# Estado atual — tela de mapa

**Atualizado em:** 25/10/2026 · **Branch:** `feature/tela-mapa`

Arquivo de contexto para quem for continuar o trabalho (pessoa ou Claude no VS Code). O passo a passo completo está em `docs/tela-mapa-localizacao.md`.

## O que já funciona

- `CidadeProvider` (`context/cidade-context.tsx`) pede permissão de localização, lê o GPS e descobre cidade e UF. Está no `app/_layout.tsx`, dentro do `AuthProvider`.
- Hook `useCidade()` (`hooks/use-cidade.ts`) devolve `{ cidade, uf, coordenadas, status, atualizar }`. `status` pode ser `carregando`, `pronto`, `negado` ou `erro`.
- Tela `app/(tabs)/mapa.tsx`: cabeçalho com "Cidade, UF" e avatar com iniciais, mapa centralizado no usuário e aviso quando a permissão é negada.
- `components/mapa-view.tsx` (nativo) e `mapa-view.web.tsx` (aviso na web).
- `constants/estados.ts` converte "Mato Grosso" em "MT".
- Plugin `expo-location` no `app.json`. Dependências: `react-native-maps@1.27.2` e `expo-location`.

## Convenções

- Nomes de variáveis, funções, tipos e status em **português**. Ficam em inglês só os campos que vêm das bibliotecas (`city`, `region`, `pos.coords`).
- Cores sempre de `cores` (`@/styles`). Código com comentários didáticos, pois é material de aula.
- Expo SDK 57: instalar com `npx expo install`; se a API da Expo estiver inacessível, usar as versões de `node_modules/expo/bundledNativeModules.json`.

## Limitações conhecidas

- `react-native-maps` não roda no Expo Go: usar `npx expo run:android` ou `run:ios`.
- Android: falta a chave da Google Maps API no `app.json` para builds.
- Nunca foi testado em aparelho; só `tsc` e `lint` foram rodados.
- `tsc` acusa 9 erros antigos em `notificacoes.tsx`, `perfil.tsx` e `ranking.tsx` (`perfil` é `User | string`). Não foram tocados.

## O que falta (próximos passos)

1. Barra de busca ("Buscar endereço, bairro...").
2. Filtros: Todos, Abertos, Em execução, Resolvidos.
3. Pinos coloridos por status, vindos da API de ocorrências (`GET /occurrences`).
4. Botão "+" levando à criação de reporte (rota protegida).
5. Seletor de cidade (▾), com `cidadeId` da tabela `cities` da API.
