import { traduzErroFirebase } from "@/constants/erros-firebase";
import { auth } from "@/firebase-config";
import { cores } from "@/styles";
import { useLocalSearchParams } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Recuperação de senha.
 *
 * O Firebase manda um e-mail com um link. O usuário abre o link, escolhe
 * a nova senha numa página do próprio Firebase e depois volta para o app
 * para entrar com ela. O app não precisa de nenhuma tela de "nova senha".
 */
export default function EsqueciSenha() {
  // Se a tela de login já tinha um e-mail digitado, ele chega aqui pela URL.
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleEnviar() {
    setErro(null);
    setMensagem(null);

    if (!email.trim()) {
      setErro("Digite seu e-mail.");
      return;
    }

    setCarregando(true);
    try {
      auth.languageCode = "pt-BR";
      await sendPasswordResetEmail(auth, email.trim());
      // A mensagem é a mesma exista ou não a conta: assim ninguém usa esta
      // tela para descobrir quais e-mails estão cadastrados.
      setMensagem(
        "Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha. Confira também a caixa de spam.",
      );
    } catch (e) {
      setErro(traduzErroFirebase(e));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Text style={styles.titulo}>Recuperar senha</Text>
      <Text style={styles.texto}>
        Digite o e-mail da sua conta. Vamos enviar um link para você criar uma
        nova senha.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor={cores.cinzaClaro}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      {erro && <Text style={styles.erro}>{erro}</Text>}
      {mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.botao}
        disabled={carregando}
        onPress={handleEnviar}
      >
        {carregando ? (
          <ActivityIndicator color={cores.branco} />
        ) : (
          <Text style={styles.textoBotao}>Enviar link</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.bgBrancoGelo,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  titulo: {
    color: cores.preto,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
  },
  texto: {
    color: cores.cinzaEscuro,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: 300,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: cores.preto,
    marginBottom: 12,
  },
  erro: {
    color: cores.alerta,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  mensagem: {
    width: 300,
    color: cores.verde,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  botao: {
    backgroundColor: cores.verde,
    width: 300,
    padding: 18,
    alignItems: "center",
    borderRadius: 15,
  },
  textoBotao: {
    color: cores.branco,
    fontSize: 18,
    fontWeight: "800",
  },
});
