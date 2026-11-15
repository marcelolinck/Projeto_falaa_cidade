import { MapaView } from "@/components/mapa-view";
import { TIPOS } from "@/constants/tipos";
import { useAuth } from "@/hooks/use-auth";
import { useCidade } from "@/hooks/use-cidade";
import { enviarReporte, ResultadoDoReporte } from "@/services/reportes";
import { cores } from "@/styles";
import { Severidade, TipoOcorrencia } from "@/types/ocorrencia";
import { comprimirFoto } from "@/utils/imagem";
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
    <View style={estilos.etapas}>
      {Array.from({ length: TOTAL_ETAPAS }, (_, i) => {
        const numero = i + 1;
        const concluida = numero < ETAPA_ATUAL;
        const atual = numero === ETAPA_ATUAL;
        return (
          <View key={numero} style={estilos.etapaItem}>
            {i > 0 && (
              <View
                style={[
                  estilos.etapaLinha,
                  numero <= ETAPA_ATUAL && { backgroundColor: cores.azul },
                ]}
              />
            )}
            <View
              style={[
                estilos.etapaBola,
                concluida && { backgroundColor: cores.azul },
                atual && { backgroundColor: cores.verde },
              ]}
            >
              {concluida ? (
                <Feather name="check" size={12} color={cores.branco} />
              ) : (
                <Text style={[estilos.etapaNumero, atual && { color: cores.branco }]}>
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

const ENDERECO_BUSCANDO = "Buscando endereço...";
const ENDERECO_NAO_ENCONTRADO = "Endereço não encontrado";

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
            estilos.foto,
            tracejado ? estilos.fotoTracejada : estilos.fotoPreenchida,
            { height: uris.length > 0 ? 56 : altura },
          ]}
        >
          <View style={estilos.fotoConteudo}>
            <Feather name="camera" size={22} color={cores.cinzaEscuro} />
            <Text style={estilos.fotoTexto}>
              {uris.length > 0 ? "Toque para adicionar outra foto" : textoVazio}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Fotos já tiradas, logo abaixo, com a opção de excluir. */}
      {uris.length > 0 && (
        <View style={estilos.adicionadas}>
          <View style={estilos.adicionadasTitulo}>
            <Feather name="check-circle" size={14} color={cores.verde} />
            <Text style={estilos.adicionadasTexto}>
              {uris.length === 1
                ? "1 foto adicionada"
                : `${uris.length} fotos adicionadas`}
              {cheio ? " (limite atingido)" : ""}
            </Text>
          </View>
          <View style={estilos.miniaturas}>
            {uris.map((uri, i) => (
              <View key={uri} style={estilos.miniatura}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} />
                <Pressable
                  onPress={() => confirmarRemocao(i)}
                  hitSlop={8}
                  style={estilos.remover}
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

/** Texto do aviso exibido depois que o reporte foi gravado. */
function montarMensagemDeSucesso(resultado: ResultadoDoReporte): string {
  const agradecimento = "Obrigado por ajudar sua cidade!";

  if (!resultado.armazenamentoAtivo) {
    return `${agradecimento}\n\nAs fotos ainda não foram enviadas porque o armazenamento não está configurado.`;
  }
  if (resultado.quantidadeDeFotosComFalha > 0) {
    return `${agradecimento}\n\n${resultado.quantidadeDeFotosComFalha} foto(s) não puderam ser enviadas.`;
  }
  return agradecimento;
}

/** Texto do aviso exibido quando a gravação falhou. */
function montarMensagemDeErro(erro: unknown): string {
  const codigoDoErro = (erro as { code?: string }).code;

  if (codigoDoErro === "permission-denied") {
    return "Sem permissão para gravar. Confira se as regras de segurança do Firestore foram publicadas.";
  }
  return "Verifique sua conexão e tente novamente.";
}

export default function NovoReporte() {
  const router = useRouter();
  const { user: usuarioLogado } = useAuth();
  const { coordenadas, codigoIbge, atualizar } = useCidade();

  const [tipo, setTipo] = useState<TipoOcorrencia>("buraco");
  const [fotosDoProblema, setFotosDoProblema] = useState<string[]>([]);
  const [fotosDeReferencia, setFotosDeReferencia] = useState<string[]>([]);
  const [endereco, setEndereco] = useState(ENDERECO_BUSCANDO);
  const [severidade, setSeveridade] = useState<Severidade>("moderado");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);

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
        setEndereco(texto || ENDERECO_NAO_ENCONTRADO);
      })
      .catch(() => ativo && setEndereco(ENDERECO_NAO_ENCONTRADO));
    return () => {
      ativo = false;
    };
  }, [coordenadas]);

  async function tirarFoto(definir: Dispatch<SetStateAction<string[]>>) {
    if (processandoFoto) return;
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("Permissão negada", "Libere o acesso à câmera nas configurações.");
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (resultado.canceled) return;

    // Cada câmera gera uma foto de tamanho diferente. Aqui ela é reduzida para
    // no máximo 1 MB antes de aparecer na tela e de ser enviada.
    setProcessandoFoto(true);
    try {
      const foto = await comprimirFoto(resultado.assets[0].uri);
      definir((atuais) => [...atuais, foto.uri]);
    } catch (erro) {
      console.warn("Falha ao comprimir a foto", erro);
      Alert.alert("Não foi possível usar a foto", "Tente tirar a foto novamente.");
    } finally {
      setProcessandoFoto(false);
    }
  }

  async function enviar() {
    // 1. Confere se o formulário e o usuário estão prontos para o envio.
    if (fotosDoProblema.length === 0) {
      Alert.alert("Foto obrigatória", "Adicione a foto do problema para continuar.");
      return;
    }
    if (tipo === "outro" && !descricao.trim()) {
      Alert.alert("Descrição obrigatória", "Descreva o problema que você encontrou.");
      return;
    }
    if (!usuarioLogado) {
      Alert.alert("Login necessário", "Entre com a sua conta para reportar um problema.");
      return;
    }
    if (!coordenadas) {
      Alert.alert(
        "Localização indisponível",
        "Ative a localização para registrar onde está o problema."
      );
      return;
    }
    if (!codigoIbge) {
      Alert.alert(
        "Cidade não identificada",
        "Não conseguimos identificar sua cidade. Confira se a localização está ativa e tente novamente.",
        [
          { text: "Tentar de novo", onPress: atualizar },
          { text: "Cancelar", style: "cancel" },
        ]
      );
      return;
    }

    // 2. Grava o reporte no Firebase.
    setEnviando(true);
    try {
      // O endereço só é gravado se foi realmente encontrado (e não o texto de aviso).
      const enderecoFoiEncontrado =
        endereco !== ENDERECO_BUSCANDO && endereco !== ENDERECO_NAO_ENCONTRADO;

      const resultado = await enviarReporte({
        usuarioLogado,
        tipo,
        descricao,
        severidade,
        coordenadas,
        endereco: enderecoFoiEncontrado ? endereco : null,
        codigoIbge,
        fotosDoProblema,
        fotosDeReferencia,
      });

      Alert.alert("Reporte enviado", montarMensagemDeSucesso(resultado), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (erro) {
      console.error("Falha ao gravar o reporte", erro);
      Alert.alert("Não foi possível enviar", montarMensagemDeErro(erro));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.container} edges={["top", "bottom"]}>
      <View style={estilos.cabecalho}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={estilos.fechar}
          accessibilityLabel="Fechar"
        >
          <Feather name="x" size={22} color={cores.preto} />
        </Pressable>
        <Text style={estilos.titulo}>Novo reporte</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={estilos.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <Etapas />

          <Text style={estilos.rotulo}>1. Tipo de ocorrência *</Text>
          <View style={estilos.chips}>
            {(Object.keys(TIPOS) as TipoOcorrencia[]).map((valor) => {
              const ativo = tipo === valor;
              return (
                <Pressable
                  key={valor}
                  onPress={() => setTipo(valor)}
                  style={[estilos.chip, ativo && estilos.chipAtivo]}
                >
                  <Text style={[estilos.chipTexto, ativo && estilos.chipTextoAtivo]}>
                    {TIPOS[valor].rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={estilos.rotulo}>
            {tipo === "outro" ? "2. Descrição *" : "2. Descrição (opcional)"}
          </Text>
          <TextInput
            style={estilos.descricao}
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

          <Text style={estilos.rotulo}>
            3. Fotos do problema * ({fotosDoProblema.length}/{MAX_FOTOS})
          </Text>
          <ListaFotos
            uris={fotosDoProblema}
            max={MAX_FOTOS}
            textoVazio="Toque para tirar a foto"
            onAdicionar={() => tirarFoto(setFotosDoProblema)}
            onRemover={(i) => setFotosDoProblema((f) => f.filter((_, j) => j !== i))}
          />

          <Text style={estilos.rotulo}>
            4. Fotos de referência (opcional) ({fotosDeReferencia.length}/
            {MAX_FOTOS_REFERENCIA})
          </Text>
          <ListaFotos
            uris={fotosDeReferencia}
            max={MAX_FOTOS_REFERENCIA}
            tracejado
            textoVazio="Ponto próximo para localizar o problema"
            onAdicionar={() => tirarFoto(setFotosDeReferencia)}
            onRemover={(i) =>
              setFotosDeReferencia((f) => f.filter((_, j) => j !== i))
            }
          />

          <Text style={estilos.rotulo}>5. Localização</Text>
          <View style={estilos.mapa}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <MapaView coordenadas={coordenadas} style={StyleSheet.absoluteFill} />
            </View>
            <View style={estilos.pino} pointerEvents="none">
              <Feather name="map-pin" size={32} color="#dc2626" />
            </View>
          </View>
          <View style={estilos.endereco}>
            <Feather name="map-pin" size={18} color={cores.cinzaEscuro} />
            <Text style={estilos.enderecoTexto} numberOfLines={1}>
              {endereco}
            </Text>
          </View>

          <Text style={estilos.rotulo}>Severidade</Text>
          <View style={estilos.chips}>
            {SEVERIDADES.map(({ valor, rotulo }) => {
              const ativa = severidade === valor;
              return (
                <Pressable
                  key={valor}
                  onPress={() => setSeveridade(valor)}
                  style={[estilos.chip, ativa && estilos.chipAtivo]}
                >
                  <Text style={[estilos.chipTexto, ativa && estilos.chipTextoAtivo]}>
                    {rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={enviar}
            disabled={enviando || processandoFoto}
            style={({ pressed }) => [
              estilos.botao,
              (pressed || enviando) && { backgroundColor: cores.verdeEscuro },
            ]}
          >
            <Text style={estilos.botaoTexto}>
              {enviando ? "Enviando..." : processandoFoto ? "Processando foto..." : "Enviar reporte"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BORDA = "#dfe4ea";

const estilos = StyleSheet.create({
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
