import { Link, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const cores = {
  verde: "#108245",
  preto: "#161a20",
  cinzaClaro: "#8a93a1",
  bgBrancoGelo: "#f6f8fa",
  branco: "#ffffff",
  alerta: "#b8860b",
};

export default function Mapa() {
  const { logado } = useLocalSearchParams<{ logado?: string }>();
  const estaLogado = logado === "true";

  console.log("Parâmetro logado recebido:", logado);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.status}>
        {estaLogado ? (
          <>
            <Text style={[styles.statusTexto, { color: cores.verde }]}>
              Você está logado
            </Text>
            <Text style={styles.titulo}>Aqui vai o mapa</Text>
            <Link href="/perfil" asChild>
              <Pressable>
                <Text style={styles.link}>Perfil do usuário</Text>
              </Pressable>
            </Link>
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
