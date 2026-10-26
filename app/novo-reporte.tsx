import { cores } from "@/styles";
import { StyleSheet, Text, View } from "react-native";

export default function NovoReporte() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Novo reporte</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: cores.bgBrancoGelo,
  },
  titulo: { fontSize: 22, fontWeight: "700", color: cores.preto },
});
