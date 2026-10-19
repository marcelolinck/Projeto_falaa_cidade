/**
 * Traduz os códigos de erro do Firebase Auth para mensagens em português.
 *
 * O Firebase devolve erros como `auth/email-already-in-use`. Em vez de mostrar
 * isso para o usuário, procuramos o código aqui e mostramos um texto amigável.
 */
const mensagens: Record<string, string> = {
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  "auth/missing-password": "Digite a senha.",
  "auth/missing-email": "Digite seu e-mail.",
  // Desde 2023 o Firebase usa este código tanto para "usuário não existe"
  // quanto para "senha errada" (para não revelar quais e-mails estão cadastrados).
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente de novo.",
  "auth/network-request-failed": "Sem conexão com a internet.",
};

export function traduzErroFirebase(erro: unknown): string {
  const codigo = (erro as { code?: string })?.code ?? "";
  return mensagens[codigo] ?? "Algo deu errado. Tente novamente.";
}
