import { traduzErroFirebase } from "@/constants/erros-firebase";
import { auth } from "@/firebase-config";
import { useAuth, useSair } from "@/hooks/use-auth";
import { cores } from "@/styles";
import { router } from "expo-router";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Tela de espera: o usuário já tem conta, mas ainda não clicou no link
 * que chegou no e-mail. Enquanto `emailVerified` for false, ele fica aqui.
 */
export default function VerificarEmail() {
  const { user } = useAuth();
  const handleSair = useSair();
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function handleJaConfirmei() {
    if (!auth.currentUser) return;

    // O Firebase não avisa o app sozinho quando o link é clicado.
    // `reload()` busca os dados atualizados do usuário no servidor.
    await auth.currentUser.reload();

    if (auth.currentUser.emailVerified) {
      router.replace("/mapa");
    } else {
      setMensagem("Ainda não confirmado. Abra o link que enviamos no seu e-mail.");
    }
  }

  async function handleReenviar() {
    if (!auth.currentUser) return;
    try {
      auth.languageCode = "pt-BR";
      await sendEmailVerification(auth.currentUser);
      setMensagem("E-mail reenviado! Confira também a caixa de spam.");
    } catch (e) {
      setMensagem(traduzErroFirebase(e));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Confirme seu e-mail</Text>
      <Text style={styles.texto}>
        Enviamos um link de confirmação para{"\n"}
        <Text style={styles.email}>{user?.email}</Text>
      </Text>
      <Text style={styles.texto}>
        Abra o e-mail, clique no link e depois volte aqui.
      </Text>

      {mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.botao}
        onPress={handleJaConfirmei}
      >
        <Text style={styles.textoBotao}>Já confirmei</Text>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.8} onPress={handleReenviar}>
        <Text style={styles.link}>Reenviar e-mail</Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.8} onPress={handleSair}>
        <Text style={styles.link}>Usar outra conta</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.bgBrancoGelo,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  titulo: {
    color: cores.preto,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },
  texto: {
    color: cores.cinzaEscuro,
    fontSize: 17,
    textAlign: "center",
    marginBottom: 12,
  },
  email: {
    color: cores.preto,
    fontWeight: "700",
  },
  mensagem: {
    color: cores.alerta,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 12,
  },
  botao: {
    backgroundColor: cores.verde,
    width: 300,
    padding: 18,
    alignItems: "center",
    borderRadius: 15,
    marginTop: 12,
  },
  textoBotao: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: "800",
  },
  link: {
    color: cores.verde,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
  },
});
