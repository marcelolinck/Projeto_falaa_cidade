import { cores } from "@/styles";
import { StyleProp, Text, View, ViewStyle } from "react-native";

/** O react-native-maps não funciona na web; mostra um aviso no lugar. */
export function MapaView({
  style,
}: {
  coordenadas?: unknown;
  ocorrencias?: unknown;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[style, { alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ color: cores.cinzaEscuro }}>
        O mapa está disponível no app (Android/iOS).
      </Text>
    </View>
  );
}