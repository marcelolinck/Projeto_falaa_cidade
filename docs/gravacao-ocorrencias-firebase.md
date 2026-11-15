# Gravando o reporte no Firebase

**Data:** 16/11/2026 · **Branch:** `aula16112026`

Até aqui o botão **Enviar reporte** só fingia que enviava. Agora ele grava de verdade: o cadastro do notificante e a ocorrência vão para o **Firestore**, e as fotos (já comprimidas para até 1 MB) vão para o **Storage**.

---

## O fluxo (3 passos)

```
[Enviar reporte]
   │  0. garante usuarios/{uid}  (cadastro do notificante)
   │  1. cria ocorrencias/{id}   (fotos = listas vazias)
   │  2. envia as fotos          (Storage: ocorrencias/{id}/pothole/1.jpg ...)
   ▼  3. anexa as URLs no mesmo documento (update)
```

**Por que em 3 passos?** A regra do Storage confere quem é o autor lendo o documento da ocorrência no Firestore. Então o documento precisa existir **antes** da foto.

---

## Compressão da foto (`utils/imagem.ts`)

Cada celular tira fotos de um tamanho. Ao tirar a foto, `comprimirImagem()` reduz para **até 1 MB**:

1. limita o lado maior a 1600 px (nunca aumenta);
2. salva em JPEG com qualidade 0.8 e mede o arquivo;
3. se passar de 1 MB: baixa a qualidade (0.7, 0.6, 0.5) e, se ainda passar, reduz a resolução (1280, 1024, 800 px).

Bônus: como a imagem é regravada, o **EXIF** (GPS embutido na foto) é descartado (RNF07).

> O limite de 1 MB do Firestore é por **documento**. Por isso a foto **não** vai dentro dele: o arquivo fica no Storage e o documento guarda só a URL.

---

## Arquivos

| Arquivo | O que faz |
|---|---|
| `firebase-config.ts` | Exporta `db` (Firestore) e `storage` (nulo se não houver bucket). |
| `services/usuarios.ts` | `garantirUsuario()`: cria `usuarios/{uid}` com papel `citizen` se não existir. |
| `services/reportes.ts` | `enviarReporte()`: os 3 passos acima. |
| `utils/imagem.ts` | `comprimirImagem()`: foto de até 1 MB. |
| `utils/geohash.ts` | `gerarGeohash()`: texto da área, para buscas por proximidade (RF09). |
| `utils/cidade-id.ts` | `gerarCidadeId("Cuiabá", "MT")` → `cuiaba-mt` (provisório). |
| `app/novo-reporte.tsx` | Comprime ao tirar a foto e chama `enviarReporte()` no botão. |
| `firebase/firestore.rules` | Regras do Firestore (para colar no console). |
| `firebase/storage.rules` | Regras do Storage (para colar no console). |

---

## O que é gravado em `ocorrencias/{id}`

Nomes dos **campos** em inglês (como no modelo de dados); variáveis do código em português.

| Campo | Valor |
|---|---|
| `reporterId` | uid de quem reportou |
| `cityId` | `cuiaba-mt` (provisório) |
| `type` | `buraco`, `calcada`, `iluminacao` ou `outro` |
| `location` / `geohash` | GeoPoint e texto da área |
| `address`, `description` | texto, ou `null` |
| `severity` | `leve`, `moderado` ou `grave` |
| `status` | sempre `aberta` na criação |
| `photos` | `{ pothole: [...], reference: [...], resolved: [] }` — listas com `url`, `storagePath`, `uploadedBy`, `uploadedAt` |
| `createdAt`, `updatedAt` | horário do servidor |
| demais (`supportCount`, `reopenedCount`, `confirmedAt`...) | zeros e `null` |

---

## Passo a passo para publicar e testar

### 1. Ativar os serviços no Console do Firebase
- **Firestore Database** → *Criar banco de dados*.
- **Storage** → *Começar* (pode exigir o plano Blaze). Copie o nome do bucket.

### 2. Preencher o `.env`
```
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
```
Reinicie com `npx expo start -c`. **Se a variável estiver vazia**, o reporte é gravado no Firestore normalmente e o app avisa que as fotos não foram enviadas.

### 3. Publicar as regras
- Firestore → *Regras*: colar `firebase/firestore.rules` → *Publicar*.
- Storage → *Regras*: colar `firebase/storage.rules` → *Publicar*.

Sem as regras novas o app recebe `permission-denied` (as regras antigas usavam os nomes em inglês).

### 4. Testar
- [ ] Logado, criar um reporte com 1 ou 2 fotos.
- [ ] Console → Firestore: aparecem `usuarios/{uid}` e `ocorrencias/{id}` com `photos.pothole` preenchido.
- [ ] Console → Storage: arquivos em `ocorrencias/{id}/pothole/1.jpg`, cada um com **menos de 1 MB**.
- [ ] Sem login: o app pede para entrar.
- [ ] Bucket vazio: o reporte grava e o aviso de fotos aparece.

---

## Limites desta etapa

- O mapa ainda mostra ocorrências de mentira (`services/ocorrencias.ts`). Ler do Firestore é o próximo passo.
- `reportsCount`, `historicoStatus`, `geohash`/`cityId` oficiais e a checagem de duplicidade dependem das **Cloud Functions**, ainda não criadas.
- As regras não foram testadas no Firebase Emulator; faça isso antes de ir para produção.
