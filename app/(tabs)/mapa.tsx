import { MapaView } from "@/components/mapa-view";
import { useAuth } from "@/hooks/use-auth";
import { useCity } from "@/hooks/use-city";
import { cores } from "@/styles";
import { Feather } from "@react-native-vector-icons/feather";
import { Linking, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Mapa() {
  const { user } = useAuth();
  const { cidade, uf, coords, status, atualizar } = useCity();

  // Iniciais do nome para o avatar ("Marcelo Linck" -> "ML"). Sem login: ícone.
  const iniciais = user?.displayName
    ?.split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const titulo = cidade
    ? `${cidade}${uf ? `, ${uf}` : ""}`
    : status === "loading"
      ? "Localizando..."
      : "Sua cidade";

  const semLocalizacao = status === "denied" || status === "error";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.cabecalho}>
        <Text style={styles.cidade}>{titulo}</Text>
        <View style={styles.avatar}>
          {iniciais ? (
            <Text style={styles.avatarTexto}>{iniciais}</Text>
          ) : (
            <Feather name="user" size={18} color={cores.cinzaEscuro} />
          )}
        </View>
      </View>

      <View style={styles.mapaBox}>
        {status === "loading" ? (
          <ActivityIndicator size="large" color={cores.verde} />
        ) : (
          // `key` recria o mapa quando a posição chega, para ele abrir centralizado
          <MapaView key={coords ? "com-gps" : "sem-gps"} coords={coords} style={styles.mapa} />
        )}

        {semLocalizacao && (
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>
              {status === "denied"
                ? "Permita a localização para ver os buracos perto de você."
                : "Não foi possível obter sua localização."}
            </Text>
            <Pressable onPress={status === "denied" ? Linking.openSettings : atualizar}>
              <Text style={styles.avisoLink}>
                {status === "denied" ? "Abrir ajustes" : "Tentar de novo"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bgBrancoGelo },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: cores.branco,
  },
  cidade: { fontSize: 22, fontWeight: "700", color: cores.preto },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: { fontWeight: "700", color: cores.cinzaEscuro },
  mapaBox: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "stretch",
    justifyContent: "center",
    backgroundColor: "#e8eee8",
  },
  mapa: { flex: 1 },
  aviso: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    padding: 14,
    gap: 6,
    borderRadius: 12,
    backgroundColor: cores.branco,
  },
  avisoTexto: { color: cores.preto },
  avisoLink: { color: cores.verde, fontWeight: "700" },
});
