import { BuscaFiltros, Filtro } from "@/components/busca-filtros";
import { MapaView } from "@/components/mapa-view";
import { STATUS } from "@/constants/status";
import { useAuth } from "@/hooks/use-auth";
import { useCidade } from "@/hooks/use-cidade";
import { useOcorrencias } from "@/hooks/use-ocorrencias";
import { cores } from "@/styles";
import { Feather } from "@react-native-vector-icons/feather";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Mapa() {
  const router = useRouter();
  const { user } = useAuth(); // usuário logado (Firebase)
  const { cidade, uf, coordenadas, status, atualizar } = useCidade();
  const { ocorrencias } = useOcorrencias(coordenadas);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  // Aplica o filtro de status e a busca por texto (título/descrição, sem acento ou maiúscula)
  const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const termo = normalizar(busca.trim());
  const visiveis = ocorrencias.filter(
    (o) =>
      (filtro === "todos" || o.status === filtro) &&
      normalizar(`${o.titulo} ${o.descricao ?? ""}`).includes(termo),
  );

  // Iniciais do nome para o avatar ("Marcelo Linck" -> "ML"). Sem login: ícone.
  const iniciais = user?.displayName
    ?.split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const titulo = cidade
    ? `${cidade}${uf ? `, ${uf}` : ""}`
    : status === "carregando"
      ? "Localizando..."
      : "Sua cidade";

  const semLocalizacao = status === "negado" || status === "erro";

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

      <BuscaFiltros busca={busca} aoMudarBusca={setBusca} filtro={filtro} aoMudarFiltro={setFiltro} />

      <View style={styles.mapaBox}>
        {status === "carregando" ? (
          <ActivityIndicator size="large" color={cores.verde} />
        ) : (
          // `key` recria o mapa quando a posição chega, para ele abrir centralizado
          <MapaView
            key={coordenadas ? "com-gps" : "sem-gps"}
            coordenadas={coordenadas}
            ocorrencias={visiveis}
            style={styles.mapa}
          />
        )}

        {ocorrencias.length > 0 && visiveis.length === 0 && (
          <View style={styles.vazio}>
            <Text style={styles.avisoTexto}>Nenhuma ocorrência encontrada.</Text>
          </View>
        )}

        {ocorrencias.length > 0 && (
          <View style={styles.legenda}>
            {Object.values(STATUS).map(({ rotulo, cor }) => (
              <View key={rotulo} style={styles.legendaItem}>
                <View style={[styles.legendaPonto, { backgroundColor: cor }]} />
                <Text style={styles.legendaTexto}>{rotulo}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Botão "+" (novo reporte). Sobe um pouco quando o aviso de localização está na tela */}
        <Pressable
          onPress={() => router.push("/novo-reporte")}
          accessibilityLabel="Novo reporte"
          style={({ pressed }) => [
            styles.botaoNovo,
            { bottom: semLocalizacao ? 112 : 12 },
            pressed && { backgroundColor: cores.verdeEscuro },
          ]}
        >
          <Feather name="plus" size={28} color={cores.branco} />
        </Pressable>

        {semLocalizacao && (
          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>
              {status === "negado"
                ? "Permita a localização para ver os buracos perto de você."
                : "Não foi possível obter sua localização."}
            </Text>
            <Pressable onPress={status === "negado" ? Linking.openSettings : atualizar}>
              <Text style={styles.avisoLink}>
                {status === "negado" ? "Abrir ajustes" : "Tentar de novo"}
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
  botaoNovo: {
    position: "absolute",
    right: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: cores.verde,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  vazio: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: cores.branco,
  },
  legenda: {
    position: "absolute",
    top: 12,
    left: 12,
    padding: 10,
    gap: 6,
    borderRadius: 12,
    backgroundColor: cores.branco,
  },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendaPonto: { width: 10, height: 10, borderRadius: 5 },
  legendaTexto: { fontSize: 12, color: cores.preto },
  avisoTexto: { color: cores.preto },
  avisoLink: { color: cores.verde, fontWeight: "700" },
});