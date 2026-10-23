import { AuthContext } from "@/context/auth-context";
import { router } from "expo-router";
import { useContext } from "react";
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Desloga e volta para a tela inicial (index), apagando o histórico.
 * Depois disso, o botão "voltar" não leva a nenhuma tela de dentro do app.
 */
export function useSair() {
  const { signOut } = useAuth();

  return async function sair() {
    // 1. Espera o Firebase terminar o logout (user vira null).
    await signOut();
    // 2. Fecha todas as telas empilhadas acima da primeira...
    if (router.canDismiss()) {
      router.dismissAll();
    }
    // 3. ...e troca essa primeira tela pelo index. Resultado: só o index na pilha.
    router.replace("/");
  };
}
