import { useAuth } from "@/hooks/use-auth";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const cores = {
  verde: "#108245",
  preto: "#161a20",
  cinzaClaro: "#8a93a1",
  bgBrancoGelo: "#f6f8fa",
  branco: "#ffffff",
  alerta: "#b8860b",
};


interface PerfilParams {
  uid?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

export default function Mapa() {
  // Com abas, não dá pra depender dos params da URL (cada aba é uma rota
  // separada), então o usuário logado vem direto do AuthProvider.
  const { user, isLogin: estaLogado } = useAuth();

  const perfil: PerfilParams = {
    uid: user?.uid,
    displayName: user?.displayName ?? undefined,
    email: user?.email ?? undefined,
    photoURL: user?.photoURL ?? undefined,
    emailVerified: user?.emailVerified,
  };

  console.log("Estou na tela de mapas")
  console.log("Perfil do usuário:", perfil);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.status}>
        {estaLogado ? (
          <>
            <Text style={[styles.statusTexto, { color: cores.verde }]}>
              Você está logado
            </Text>
            <Text style={styles.titulo}>Aqui vai o mapa</Text>
            <Text style={{ color: cores.preto, fontSize: 16, marginTop: 8 }}>
              Bem-vindo, {perfil.displayName || "usuário"}!
            </Text>
          </>
        ) : (
          <Text style={[styles.statusTexto, { color: cores.alerta }]}>
            Você não está logado
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.bgBrancoGelo,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  status: {
    alignItems: "center",
    marginBottom: 16,
  },
  statusTexto: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  link: {
    color: cores.verde,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
  },
  titulo: {
    color: cores.preto,
    fontSize: 18,
    fontWeight: "600",
  },
});
