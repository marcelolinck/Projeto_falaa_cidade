# Fala Cidade 🏙️

O **Fala Cidade** é um aplicativo de participação cidadã. Com ele, qualquer pessoa pode **reportar problemas da cidade**, como buracos na rua, iluminação pública queimada, lixo acumulado ou calçadas danificadas, indicando o local no mapa.

A **prefeitura** acompanha esses reportes, prioriza o que for necessário e **resolve os problemas de forma mais rápida**. Já a **população** acompanha o andamento de cada reporte, do registro até a solução, o que dá mais transparência à relação entre cidadão e poder público.

O projeto é desenvolvido com o envolvimento da turma de **Análise e Desenvolvimento de Sistemas (ADS)**, que participa da construção do aplicativo como atividade prática do curso.

## Funcionalidades

- Login com conta Google (via Firebase Authentication)
- Navegação sem login, para consultar o mapa e a tela inicial
- Mapa com os problemas reportados
- Criação de reportes de problemas na cidade
- Perfil do usuário
- Acompanhamento do status dos reportes (em desenvolvimento)

## Tecnologias

- [Expo](https://expo.dev) SDK 57 + [Expo Router](https://docs.expo.dev/router/introduction/) (rotas baseadas em arquivos)
- React Native + TypeScript
- [Firebase](https://firebase.google.com/) (Authentication)
- `expo-auth-session` para o login com Google

## Pré-requisitos

- [Node.js](https://nodejs.org/) LTS (20 ou superior)
- npm
- Um projeto no [Firebase](https://console.firebase.google.com/) com o login do **Google** ativado em *Authentication*
- Um **OAuth Client ID (Web)** criado no [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Para rodar no celular: o app [Expo Go](https://expo.dev/go) ou um emulador Android/iOS

## Configuração

1. Clone o repositório e instale as dependências:

   ```bash
   git clone <url-do-repositorio>
   cd Projeto_falaa_cidade
   npm install
   ```

2. Crie o arquivo `.env` na raiz do projeto a partir do exemplo:

   ```bash
   cp .envExample .env
   ```

3. Preencha o `.env` com as credenciais do seu projeto Firebase e do Google:

   | Variável | Onde encontrar |
   | --- | --- |
   | `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase → Configurações do projeto → Seus apps |
   | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google Cloud Console → APIs e serviços → Credenciais |

   > O `.env` está no `.gitignore`. Nunca faça commit das suas credenciais.

4. No Google Cloud Console, cadastre a *redirect URI* usada pelo app em **Authorized redirect URIs** e **Authorized JavaScript origins**. A URI exata aparece no terminal ao abrir a tela de login (log `Google OAuth redirectUri:`).

## Como rodar

```bash
npm start          # inicia o servidor do Expo
npm run android    # abre no emulador/dispositivo Android
npm run ios        # abre no simulador iOS (somente macOS)
npm run web        # abre no navegador
```

Com o servidor rodando, escaneie o QR Code com o **Expo Go** para abrir no celular.

## Scripts úteis

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o Expo |
| `npm run lint` | Roda o ESLint |
| `npx tsc --noEmit` | Verifica os tipos do TypeScript |

## Estrutura do projeto

```
app/                 # Telas e rotas (Expo Router)
  (tabs)/            # Navegação por abas
  login.tsx          # Tela de login
  mapa.tsx           # Mapa com os reportes
  criarReport.tsx    # Criação de reporte
  perfil.tsx         # Perfil do usuário
components/          # Componentes reutilizáveis
context/             # Contextos React (ex: autenticação)
hooks/               # Hooks customizados (ex: login com Google)
constants/           # Cores, temas e constantes
assets/              # Imagens e fontes
docs/                # Documentação e anotações do projeto
firebase-config.ts   # Inicialização do Firebase
```

## Fluxo de trabalho (Git)

- A branch principal é a `main`.
- Crie uma branch para cada tarefa: `feature/...`, `fix/...` ou `chore/...`.
- Abra um Pull Request para a `main` quando a tarefa estiver pronta.

## Documentação adicional

- [Atualização para o Expo SDK 57](docs/atualizacao-expo-sdk-57.md)
- [Documentação do Expo](https://docs.expo.dev/)
