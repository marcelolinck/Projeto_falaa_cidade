import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";

const cores = {
  verde: "#108245", // verde de marca — botão primário, logo
  verdeEscuro: "#0c6b38", // verde mais escuro — usado em estado "pressed"
  preto: "#161a20", // cor do texto principal (títulos)
  cinzaEscuro: "#5b6472", // cor do texto secundário (subtítulo)
  cinzaClaro: "#8a93a1", // cor do texto mais apagado (texto legal/LGPD)
  bgBrancoGelo: "#f6f8fa", // fundo geral da tela
  branco: "#ffffff",
};

export default function Perfil() {
  const { logado } = useLocalSearchParams<{ logado?: string }>();
  const estaLogado = logado === "true" ? true : false;

  return (
    <>
      {/* tags Fragment para envolver o conteúdo do componente */}
      {estaLogado ? (
        <Text style={styles.perfilTexto}>Perfil carregado</Text>
      ) : (
        <Text
          style={{
            color: "yellow",
            fontSize: 30,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          NAo to logado
        </Text>
      )}
      <Text style={{ alignItems: "center", justifyContent: "center" }}>
        Perfil do usuario
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  perfilTexto: {
    color: cores.verde,
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
    fontWeight: 800,
  },
});
