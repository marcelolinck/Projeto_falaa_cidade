import { STATUS } from "@/constants/status";
import { cores } from "@/styles";
import { StatusOcorrencia } from "@/types/ocorrencia";
import { Feather } from "@react-native-vector-icons/feather";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export type Filtro = "todos" | StatusOcorrencia;

// Ordem e rótulo dos botões. Os status vêm de constants/status.ts.
const OPCOES: { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aberto", rotulo: STATUS.aberto.rotulo + "s" },
  { valor: "em_execucao", rotulo: STATUS.em_execucao.rotulo },
  { valor: "resolvido", rotulo: STATUS.resolvido.rotulo + "s" },
];

type Props = {
  busca: string;
  aoMudarBusca: (texto: string) => void;
  filtro: Filtro;
  aoMudarFiltro: (filtro: Filtro) => void;
};

/** Campo de pesquisa + botões de filtro por status. */
export function BuscaFiltros({ busca, aoMudarBusca, filtro, aoMudarFiltro }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.campo}>
        <Feather name="search" size={18} color={cores.cinzaClaro} />
        <TextInput
          style={styles.input}
          value={busca}
          onChangeText={aoMudarBusca}
          placeholder="Buscar ocorrência"
          placeholderTextColor={cores.cinzaClaro}
          returnKeyType="search"
          autoCorrect={false}
        />
        {busca.length > 0 && (
          <Pressable onPress={() => aoMudarBusca("")} hitSlop={8}>
            <Feather name="x" size={18} color={cores.cinzaEscuro} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {OPCOES.map(({ valor, rotulo }) => {
          const ativo = filtro === valor;
          return (
            <Pressable
              key={valor}
              onPress={() => aoMudarFiltro(valor)}
              style={[styles.chip, ativo && styles.chipAtivo]}
            >
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{rotulo}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 12, gap: 10 },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: cores.branco,
  },
  input: { flex: 1, fontSize: 15, color: cores.preto },
  chips: { gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.googleBorda,
  },
  chipAtivo: { backgroundColor: cores.verde, borderColor: cores.verde },
  chipTexto: { fontWeight: "600", color: cores.cinzaEscuro },
  chipTextoAtivo: { color: cores.branco },
});