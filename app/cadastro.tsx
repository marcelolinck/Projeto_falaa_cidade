import { traduzErroFirebase } from "@/constants/erros-firebase";
import { auth } from "@/firebase-config";
import { cores } from "@/styles";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
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
 * Tela de cadastro com e-mail e senha.
 *
 * Passos:
 * 1. Cria a conta no Firebase (createUserWithEmailAndPassword).
 * 2. Salva o nome no perfil (updateProfile).
 * 3. Manda um e-mail com link de confirmação (sendEmailVerification).
 * 4. Leva para a tela "verificar-email", que só libera o app depois do clique no link.
 *
 * Assim, um e-mail inventado (que ninguém consegue abrir) nunca chega no app.
 */
export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleCadastrar() {
    setErro(null);

    // Validações simples antes de chamar o Firebase.
    if (!nome.trim() || !email.trim() || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    setCarregando(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        senha,
      );
      await updateProfile(user, { displayName: nome.trim() });

      // Faz o e-mail de confirmação chegar em português.
      auth.languageCode = "pt-BR";
      await sendEmailVerification(user);

      // `replace` para que "voltar" não traga de novo o formulário de cadastro.
      router.replace("/verificar-email");
    } catch (e) {
      setErro(traduzErroFirebase(e));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Text style={styles.titulo}>Criar conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        placeholderTextColor={cores.cinzaClaro}
        value={nome}
        onChangeText={setNome}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Senha (mínimo 6 caracteres)"
        placeholderTextColor={cores.cinzaClaro}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry // esconde o texto digitado (●●●●)
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar senha"
        placeholderTextColor={cores.cinzaClaro}
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        secureTextEntry
      />

      {erro && <Text style={styles.erro}>{erro}</Text>}

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.botao}
        disabled={carregando}
        onPress={handleCadastrar}
      >
        {carregando ? (
          <ActivityIndicator color={cores.branco} />
        ) : (
          <Text style={styles.textoBotao}>Cadastrar</Text>
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
