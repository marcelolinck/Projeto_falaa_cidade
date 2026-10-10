import GoogleLogo from "@/components/google-logo";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Link, router } from "expo-router";

/**
 * Paleta de cores que será usado no projeto por completo
 * Deve ser usado em todas as telas.
 */
const cores = {
  verde: "#108245", // verde de marca — botão primário, logo
  verdeEscuro: "#0c6b38", // verde mais escuro — usado em estado "pressed"
  preto: "#161a20", // cor do texto principal (títulos)
  cinzaEscuro: "#5b6472", // cor do texto secundário (subtítulo)
  cinzaClaro: "#8a93a1", // cor do texto mais apagado (texto legal/LGPD)
  bgBrancoGelo: "#f6f8fa", // fundo geral da tela
  branco: "#ffffff",
};

export default function HomeScreen() {
  // `user` vem do Firebase (via AuthProvider) e só deixa de ser null depois
  // que o login com Google terminar de verdade — não é mais um estado fake local.
  const { user } = useAuth();
  // `request` fica null até o client id carregar; `promptAsync` abre a tela/popup
  // de login do Google; `error` guarda qualquer falha do processo.
  const { request, promptAsync, error } = useGoogleAuth();

  // Assim que o usuário loga com sucesso no Firebase, o AuthProvider atualiza
  // `user` (via onAuthStateChanged) e daí sim navegamos pra tela de mapa.
  useEffect(() => {
    if (user) {
      router.push({
        pathname: "/mapa",
        params: { logado: "true" },
      });
    }
  }, [user]);

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

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.botao}
        // Sem `request` carregado ainda não tem como abrir o login (client id
        // não pronto), então o botão fica desabilitado até esse momento.
        disabled={!request}
        onPress={() => handleGoogleLogin()}
      >
        <View style={styles.googleIconCircle}>
          <GoogleLogo size={20} />
        </View>
        <Text style={styles.textoBotao}>Entrar com o Google</Text>
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
  googleIconText: {
    color: cores.branco,
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 10,
    marginRight: 10,
  },
  googleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: cores.branco,
    alignItems: "center",
    justifyContent: "center",
  },
});
