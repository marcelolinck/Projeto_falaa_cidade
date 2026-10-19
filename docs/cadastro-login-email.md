# Cadastro e login com e-mail e senha

**Data:** 19/10/2026

Agora o usuário pode criar uma conta com **e-mail e senha**, além do login com Google. Para barrar e-mails falsos, o app só libera o acesso depois que o usuário **clica no link de confirmação** enviado para o e-mail dele.

---

## Passo 0 — Ativar o provedor no Firebase (uma vez só)

1. Abra o [Console do Firebase](https://console.firebase.google.com) e escolha o projeto.
2. Vá em **Authentication → Sign-in method**.
3. Clique em **E-mail/senha**, ative a primeira opção e salve. Deixe o "link de e-mail (sem senha)" desligado.
4. (Opcional) Em **Authentication → Templates → Verificação de endereço de e-mail**, ajuste o texto do e-mail.

Sem o passo 3, o cadastro dá o erro `auth/operation-not-allowed`.

---

## O fluxo

```
[index]  ──"Cadastre-se"──▶  [cadastro]
   │                             │ cria conta + envia e-mail
   │ Entrar (e-mail/senha)       ▼
   ├──── e-mail NÃO confirmado ─▶ [verificar-email] ──"Já confirmei"──▶ [mapa]
   └──── e-mail confirmado ─────────────────────────────────────────▶ [mapa]
```

| Arquivo | O que faz |
|---|---|
| `app/cadastro.tsx` | Formulário (nome, e-mail, senha, confirmar senha). Cria a conta e envia o e-mail de confirmação. |
| `app/verificar-email.tsx` | Tela de espera. Botões: "Já confirmei", "Reenviar e-mail" e "Usar outra conta". |
| `app/esqueci-senha.tsx` | Envia o e-mail com o link para criar uma nova senha. |
| `app/index.tsx` | Ganhou os campos de e-mail/senha, o botão "Entrar" e os links "Esqueci minha senha" e "Cadastre-se". |
| `app/_layout.tsx` | Registra as duas telas novas no `Stack`. |
| `constants/erros-firebase.ts` | Traduz os códigos de erro do Firebase para português. |

---

## Passo 1 — Cadastrar (`app/cadastro.tsx`)

```tsx
const { user } = await createUserWithEmailAndPassword(auth, email, senha);
await updateProfile(user, { displayName: nome }); // salva o nome
auth.languageCode = "pt-BR";                       // e-mail em português
await sendEmailVerification(user);                 // manda o link
router.replace("/verificar-email");
```

Depois do `createUserWithEmailAndPassword`, o usuário **já está logado**, mas com `user.emailVerified === false`.

## Passo 2 — Confirmar o e-mail (`app/verificar-email.tsx`)

O Firebase **não avisa o app** quando o link é clicado. Por isso, o botão "Já confirmei" pede os dados atualizados ao servidor:

```tsx
await auth.currentUser.reload();
if (auth.currentUser.emailVerified) router.replace("/mapa");
```

## Passo 3 — Login (`app/index.tsx`)

```tsx
await signInWithEmailAndPassword(auth, email, senha);
```

Quem decide para onde ir é o `useEffect`, que observa o `user`:

```tsx
router.replace(user.emailVerified ? "/mapa" : "/verificar-email");
```

As contas Google já chegam com `emailVerified = true` e vão direto para o mapa.

## Passo 4 — Recuperar a senha (`app/esqueci-senha.tsx`)

O link "Esqueci minha senha", que fica abaixo do campo de senha, abre esta tela já com o e-mail digitado:

```tsx
await sendPasswordResetEmail(auth, email);
```

O Firebase manda um e-mail com um link. A nova senha é escolhida numa **página do próprio Firebase**, então o app não precisa de uma tela de "nova senha". Depois disso, o usuário volta ao app e entra com a nova senha.

A mensagem de sucesso é a mesma **exista ou não a conta**. Assim, ninguém consegue usar a tela para descobrir quais e-mails estão cadastrados.

---

## Como testar

1. `npx expo start`
2. Na tela inicial, toque em **Não tem conta? Cadastre-se**.
3. Cadastre-se com um e-mail **real** que você consiga abrir.
4. Você cai na tela "Confirme seu e-mail". Toque em **Já confirmei** e veja a mensagem de "ainda não confirmado".
5. Abra o e-mail (olhe também o spam) e clique no link.
6. Volte ao app e toque em **Já confirmei**. Você vai para o mapa.
7. Feche o app, abra de novo e entre com o mesmo e-mail e senha.
8. Saia, toque em **Esqueci minha senha**, envie o link, crie uma nova senha pelo e-mail e entre com ela.

Para apagar contas de teste, use **Authentication → Users** no console.

---

## Limitações (de propósito, para ficar simples)

- **Telas sem proteção:** a confirmação só é checada no login. Quem ainda não confirmou consegue abrir `/mapa` pela opção "Ver mapa sem login". Para bloquear de verdade, o certo é checar `emailVerified` também nas regras do Firestore/backend.
- **E-mails descartáveis** (mailinator etc.) conseguem confirmar o link. Para barrá-los, seria preciso uma lista de domínios bloqueados.
