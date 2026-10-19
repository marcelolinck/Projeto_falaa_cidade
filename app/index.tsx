import GoogleLogo from "@/components/google-logo";
import { traduzErroFirebase } from "@/constants/erros-firebase";
import { auth } from "@/firebase-config";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { cores } from "@/styles";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Link, router } from "expo-router";



export default function HomeScreen() {
  // `user` vem do Firebase (via AuthProvider) e só deixa de ser null depois
  // que o login com Google terminar de verdade — não é mais um estado fake local.
  const { user } = useAuth();
  // `request` fica null até o client id carregar; `promptAsync` abre a tela/popup
  // de login do Google; `error` guarda qualquer falha do processo.
  const { request, promptAsync, error } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroLogin, setErroLogin] = useState<string | null>(null);

  // Assim que o usuário loga com sucesso no Firebase, o AuthProvider atualiza
  // `user` (via onAuthStateChanged) e daí sim navegamos pra tela de mapa.
  useEffect(() => {
    if (user) {
      // `replace` troca a tela atual em vez de empilhar uma nova (`push`).
      // Assim, ao apertar "voltar" no mapa, o usuário não cai de novo no login.
      // Quem entrou com e-mail e senha mas ainda não clicou no link de
      // confirmação vai para a tela de verificação. (Contas Google já
      // chegam com `emailVerified = true`.)
      router.replace(user.emailVerified ? "/mapa" : "/verificar-email");
    }
  }, [user]);

  /**
   * Login com e-mail e senha. Se der certo, o AuthProvider atualiza `user`
   * e o useEffect acima faz a navegação.
   */
  async function handleEmailLogin() {
    setErroLogin(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (e) {
      setErroLogin(traduzErroFirebase(e));
    }
  }

  useEffect(() => {
    if (error) {
      console.error("Erro ao fazer login com Google:", error);
    }
  }, [error]);

  /**
   * Abre o fluxo de login do Google. O resultado (sucesso/erro) é tratado
   * dentro do hook useGoogleAuth — aqui só disparamos o processo.
   */
  function handleGoogleLogin() {
    promptAsync();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>FC</Text>
      </View>
      <Text style={styles.titulo}>Falaa cidade!</Text>
      <Text style={styles.subtitulo}>
        Reporte, acompanhe e confirme a correção de eventos que ocorrem na sua cidade.
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
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor={cores.cinzaClaro}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      {erroLogin && <Text style={styles.erro}>{erroLogin}</Text>}

      {/* Leva o e-mail já digitado para a tela de recuperação. */}
      <Link
        href={{ pathname: "/esqueci-senha", params: { email: email.trim() } }}
        asChild
      >
        <TouchableOpacity activeOpacity={0.8} style={styles.esqueciSenha}>
          <Text style={styles.esqueciSenhaTexto}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.botao, styles.botaoEmail]}
        onPress={handleEmailLogin}
      >
        <Text style={styles.textoBotao}>Entrar</Text>
      </TouchableOpacity>

      <Link href="/cadastro" asChild>
        <TouchableOpacity activeOpacity={0.8}>
          <Text style={styles.mapaSemLogin}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </Link>

      <Text style={styles.ou}>ou</Text>

      <TouchableOpacity
        activeOpacity={0.8}
        // Visual do botão oficial do Google: fundo branco, borda cinza, texto escuro.
        style={[styles.botao, styles.botaoGoogle]}
        // Sem `request` carregado ainda não tem como abrir o login (client id
        // não pronto), então o botão fica desabilitado até esse momento.
        disabled={!request}
        onPress={() => handleGoogleLogin()}
      >
        <GoogleLogo size={20} />
        <Text style={styles.textoBotaoGoogle}>Entrar com o Google</Text>
      </TouchableOpacity>
      <Text style={styles.rodape}>
        Ao continuar, você concorda com os Termos e a Política de Privacidade
        (LGPD).
      </Text>
      <Link
        //href="/mapa"
        href={{
          pathname: "/mapa",
          params: { logado: "false" },
        }}
        asChild
      >
        <TouchableOpacity activeOpacity={0.8}>
          <Text style={styles.mapaSemLogin}>Ver mapa sem login {">"}</Text>
        </TouchableOpacity>
      </Link>
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
  logo: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: cores.verde,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "white",
    fontSize: 40,
    fontWeight: 900,
  },
  titulo: {
    color: cores.preto, //Troca a cor da fonte
    fontSize: 40, //Troca o tamanho da fonte
    marginVertical: 20,
    fontWeight: 800 /*Coloca o efeito para a fonte ficar mais forte ou mais fraca*/,
  },
  subtitulo: {
    color: cores.cinzaClaro, //Troca a cor da fonte
    fontSize: 18, //Troca o tamanho da fonte
    marginBottom: 20,
    textAlign: "center", //Centraliza o texto
    fontWeight: 800 /*Coloca o efeito para a fonte ficar mais forte ou mais fraca*/,
  },

  rodape: {
    color: cores.cinzaClaro, //Troca a cor da fonte
    justifyContent: "center", //Centraliza o texto
    fontSize: 15, //Troca o tamanho da fonte
    fontWeight: 400 /*Coloca o efeito para a fonte ficar mais forte ou mais fraca*/,
    alignItems: "center", //Centraliza o texto
    textAlign: "center", //Centraliza o texto
    marginTop: 15,
  },
  botao: {
    backgroundColor: cores.verde,
    width: 300,
    height: "auto",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    flexDirection: "row", // Adiciona a propriedade flexDirection para alinhar os elementos horizontalmente
  },
  botaoEmail: {
    backgroundColor: cores.azul,
    padding: 16,
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
  esqueciSenha: {
    width: 300,
    alignItems: "flex-end",
    marginTop: -4,
    marginBottom: 12,
  },
  esqueciSenhaTexto: {
    color: cores.verde,
    fontSize: 14,
    fontWeight: "600",
  },
  ou: {
    color: cores.cinzaClaro,
    fontSize: 15,
    marginVertical: 12,
  },
  textoBotao: {
    marginStart: 10,
    color: cores.branco,
    fontSize: 20,
    fontWeight: 800,
  },
  mapaSemLogin: {
    fontSize: 16,
    fontWeight: "700",
    color: cores.verde,
    marginTop: 10,
  },
  botaoGoogle: {
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.googleBorda,
    padding: 16,
  },
  textoBotaoGoogle: {
    marginStart: 12,
    color: cores.googleTexto,
    fontSize: 18,
    fontWeight: "500",
  },
});
