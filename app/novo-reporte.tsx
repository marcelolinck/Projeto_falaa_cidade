import { MapaView } from "@/components/mapa-view";
import { TIPOS } from "@/constants/tipos";
import { useCidade } from "@/hooks/use-cidade";
import { cores } from "@/styles";
import { TipoOcorrencia } from "@/types/ocorrencia";
import { Feather } from "@react-native-vector-icons/feather";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Severidade = "leve" | "moderado" | "grave";

const SEVERIDADES: { valor: Severidade; rotulo: string }[] = [
  { valor: "leve", rotulo: "Leve" },
  { valor: "moderado", rotulo: "Moderado" },
  { valor: "grave", rotulo: "Grave" },
];

const TOTAL_ETAPAS = 4;
const ETAPA_ATUAL = 2;

/** Barra de progresso: etapas concluídas (check), atual (verde) e futuras (cinza). */
function Etapas() {
  return (
    <View style={styles.etapas}>
      {Array.from({ length: TOTAL_ETAPAS }, (_, i) => {
        const numero = i + 1;
        const concluida = numero < ETAPA_ATUAL;
        const atual = numero === ETAPA_ATUAL;
        return (
          <View key={numero} style={styles.etapaItem}>
            {i > 0 && (
              <View
                style={[
                  styles.etapaLinha,
                  numero <= ETAPA_ATUAL && { backgroundColor: cores.azul },
                ]}
              />
            )}
            <View
              style={[
                styles.etapaBola,
                concluida && { backgroundColor: cores.azul },
                atual && { backgroundColor: cores.verde },
              ]}
            >
              {concluida ? (
                <Feather name="check" size={12} color={cores.branco} />
              ) : (
                <Text style={[styles.etapaNumero, atual && { color: cores.branco }]}>
                  {numero}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const MAX_FOTOS = 5;
const MAX_FOTOS_REFERENCIA = 2;

/**
 * Lista de fotos: miniaturas (com botão de remover) e, enquanto não chegou
 * no limite, um quadro para tirar mais uma foto.
 */
function ListaFotos({
  uris,
  max,
  textoVazio,
  tracejado,
  onAdicionar,
  onRemover,
}: {
  uris: string[];
  max: number;
  textoVazio: string;
  tracejado?: boolean;
  onAdicionar: () => void;
  onRemover: (indice: number) => void;
}) {
  const altura = tracejado ? 70 : 100;
  const cheio = uris.length >= max;

  function confirmarRemocao(indice: number) {
    Alert.alert("Excluir foto", "Deseja excluir esta foto?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => onRemover(indice) },
    ]);
  }

  return (
    <View>
      {/* Quadro para tirar foto: some só quando chega no limite. */}
      {!cheio && (
        <Pressable
          onPress={onAdicionar}
          style={[
            styles.foto,
            tracejado ? styles.fotoTracejada : styles.fotoPreenchida,
            { height: uris.length > 0 ? 56 : altura },
          ]}
        >
          <View style={styles.fotoConteudo}>
            <Feather name="camera" size={22} color={cores.cinzaEscuro} />
            <Text style={styles.fotoTexto}>
              {uris.length > 0 ? "Toque para adicionar outra foto" : textoVazio}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Fotos já tiradas, logo abaixo, com a opção de excluir. */}
      {uris.length > 0 && (
        <View style={styles.adicionadas}>
          <View style={styles.adicionadasTitulo}>
            <Feather name="check-circle" size={14} color={cores.verde} />
            <Text style={styles.adicionadasTexto}>
              {uris.length === 1
                ? "1 foto adicionada"
                : `${uris.length} fotos adicionadas`}
              {cheio ? " (limite atingido)" : ""}
            </Text>
          </View>
          <View style={styles.miniaturas}>
            {uris.map((uri, i) => (
              <View key={uri} style={styles.miniatura}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} />
                <Pressable
                  onPress={() => confirmarRemocao(i)}
                  hitSlop={8}
                  style={styles.remover}
                  accessibilityLabel="Excluir foto"
                >
                  <Feather name="trash-2" size={14} color={cores.branco} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function NovoReporte() {
  const router = useRouter();
  const { coordenadas } = useCidade();

  const [tipo, setTipo] = useState<TipoOcorrencia>("buraco");
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotosReferencia, setFotosReferencia] = useState<string[]>([]);
  const [endereco, setEndereco] = useState("Buscando endereço...");
  const [severidade, setSeveridade] = useState<Severidade>("moderado");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Converte as coordenadas do usuário em "Rua, número — Bairro".
  useEffect(() => {
    if (!coordenadas) return;
    let ativo = true;
    Location.reverseGeocodeAsync(coordenadas)
      .then(([lugar]) => {
        if (!ativo) return;
        const rua = [lugar?.street, lugar?.streetNumber].filter(Boolean).join(", ");
        const bairro = lugar?.district ?? lugar?.subregion;
        const texto = [rua, bairro].filter(Boolean).join(" — ");
        setEndereco(texto || "Endereço não encontrado");
      })
      .catch(() => ativo && setEndereco("Endereço não encontrado"));
    return () => {
      ativo = false;
    };
  }, [coordenadas]);

  async function tirarFoto(definir: Dispatch<SetStateAction<string[]>>) {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("Permissão negada", "Libere o acesso à câmera nas configurações.");
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!resultado.canceled) {
      const uri = resultado.assets[0].uri;
      definir((atuais) => [...atuais, uri]);
    }
  }

  async function enviar() {
    if (fotos.length === 0) {
      Alert.alert("Foto obrigatória", "Adicione a foto do problema para continuar.");
      return;
    }
    if (tipo === "outro" && !descricao.trim()) {
      Alert.alert("Descrição obrigatória", "Descreva o problema que você encontrou.");
      return;
    }
    setEnviando(true);
    // TODO: enviar para a API quando ela existir (tipo, fotos, fotosReferencia,
    // coordenadas, endereco, severidade, descricao).
    await new Promise((resolve) => setTimeout(resolve, 600));
    setEnviando(false);
    Alert.alert("Reporte enviado", "Obrigado por ajudar sua cidade!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.cabecalho}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.fechar}
          accessibilityLabel="Fechar"
        >
          <Feather name="x" size={22} color={cores.preto} />
        </Pressable>
        <Text style={styles.titulo}>Novo reporte</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <Etapas />

          <Text style={styles.rotulo}>1. Tipo de ocorrência *</Text>
          <View style={styles.chips}>
            {(Object.keys(TIPOS) as TipoOcorrencia[]).map((valor) => {
              const ativo = tipo === valor;
              return (
                <Pressable
                  key={valor}
                  onPress={() => setTipo(valor)}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                >
                  <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                    {TIPOS[valor].rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.rotulo}>
            {tipo === "outro" ? "2. Descrição *" : "2. Descrição (opcional)"}
          </Text>
          <TextInput
            style={styles.descricao}
            value={descricao}
            onChangeText={setDescricao}
            placeholder={
              tipo === "outro"
                ? "Descreva o problema..."
                : "Conte mais detalhes sobre o problema..."
            }
            placeholderTextColor={cores.cinzaEscuro}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.rotulo}>
            3. Fotos do problema * ({fotos.length}/{MAX_FOTOS})
          </Text>
          <ListaFotos
            uris={fotos}
            max={MAX_FOTOS}
            textoVazio="Toque para tirar a foto"
            onAdicionar={() => tirarFoto(setFotos)}
            onRemover={(i) => setFotos((f) => f.filter((_, j) => j !== i))}
          />

          <Text style={styles.rotulo}>
            4. Fotos de referência (opcional) ({fotosReferencia.length}/
            {MAX_FOTOS_REFERENCIA})
          </Text>
          <ListaFotos
            uris={fotosReferencia}
            max={MAX_FOTOS_REFERENCIA}
            tracejado
            textoVazio="Ponto próximo para localizar o problema"
            onAdicionar={() => tirarFoto(setFotosReferencia)}
            onRemover={(i) =>
              setFotosReferencia((f) => f.filter((_, j) => j !== i))
            }
          />

          <Text style={styles.rotulo}>5. Localização</Text>
          <View style={styles.mapa}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <MapaView coordenadas={coordenadas} style={StyleSheet.absoluteFill} />
            </View>
            <View style={styles.pino} pointerEvents="none">
              <Feather name="map-pin" size={32} color="#dc2626" />
            </View>
          </View>
          <View style={styles.endereco}>
            <Feather name="map-pin" size={18} color={cores.cinzaEscuro} />
            <Text style={styles.enderecoTexto} numberOfLines={1}>
              {endereco}
            </Text>
          </View>

          <Text style={styles.rotulo}>Severidade</Text>
          <View style={styles.chips}>
            {SEVERIDADES.map(({ valor, rotulo }) => {
              const ativa = severidade === valor;
              return (
                <Pressable
                  key={valor}
                  onPress={() => setSeveridade(valor)}
                  style={[styles.chip, ativa && styles.chipAtivo]}
                >
                  <Text style={[styles.chipTexto, ativa && styles.chipTextoAtivo]}>
                    {rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={enviar}
            disabled={enviando}
            style={({ pressed }) => [
              styles.botao,
              (pressed || enviando) && { backgroundColor: cores.verdeEscuro },
            ]}
          >
            <Text style={styles.botaoTexto}>
              {enviando ? "Enviando..." : "Enviar reporte"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BORDA = "#dfe4ea";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.bgBrancoGelo },
  cabecalho: {
    height: 56,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: cores.branco,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  fechar: { position: "absolute", left: 20 },
  titulo: { fontSize: 17, fontWeight: "700", color: cores.preto },
  conteudo: { padding: 16, paddingBottom: 32 },

  etapas: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  etapaItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  etapaLinha: { flex: 1, height: 2, backgroundColor: BORDA, marginHorizontal: 4 },
  etapaBola: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BORDA,
    alignItems: "center",
    justifyContent: "center",
  },
  etapaNumero: { fontSize: 10, fontWeight: "700", color: cores.cinzaEscuro },

  rotulo: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: cores.cinzaEscuro,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
  },

  foto: { borderRadius: 18, overflow: "hidden" },
  fotoPreenchida: { height: 100, backgroundColor: "#b6c1d1" },
  fotoTracejada: {
    backgroundColor: "#e8ecf3",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#c3cbd8",
  },
  adicionadas: { marginTop: 10 },
  adicionadasTitulo: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  adicionadasTexto: { fontSize: 12, fontWeight: "700", color: cores.verde },
  miniaturas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  miniatura: {
    width: 84,
    height: 84,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#b6c1d1",
  },
  remover: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(220,38,38,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoConteudo: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  fotoTexto: { fontSize: 11, color: cores.cinzaEscuro },

  mapa: {
    height: 72,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#dfe8d8",
  },
  pino: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  endereco: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: cores.branco,
  },
  enderecoTexto: { flex: 1, fontSize: 14, color: cores.preto },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: cores.branco,
  },
  chipAtivo: { borderColor: cores.verde, backgroundColor: "#dcf3e5" },
  chipTexto: { fontSize: 12, fontWeight: "600", color: cores.cinzaEscuro },
  chipTextoAtivo: { color: cores.verde },

  descricao: {
    minHeight: 72,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDA,
    backgroundColor: cores.branco,
    fontSize: 14,
    color: cores.preto,
  },

  botao: {
    marginTop: 20,
    height: 50,
    borderRadius: 16,
    backgroundColor: cores.verde,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: cores.verde,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  botaoTexto: { color: cores.branco, fontSize: 16, fontWeight: "700" },
});
