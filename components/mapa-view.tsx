import { Coordenadas } from "@/context/cidade-context";
import { STATUS } from "@/constants/status";
import { Ocorrencia } from "@/types/ocorrencia";
import { StyleProp, ViewStyle } from "react-native";
import MapView, { Marker } from "react-native-maps";

// Centro do Brasil: usado só quando não temos a localização do usuário.
const BRASIL = {
  latitude: -14.235,
  longitude: -51.925,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

type Props = {
  coordenadas: Coordenadas | null;
  ocorrencias?: Ocorrencia[];
  style?: StyleProp<ViewStyle>;
};

/** Mapa nativo (Android/iOS). Na web existe o arquivo mapa-view.web.tsx. */
export function MapaView({ coordenadas, ocorrencias = [], style }: Props) {
  return (
    <MapView
      style={style}
      showsUserLocation
      showsMyLocationButton
      initialRegion={
        coordenadas ? { ...coordenadas, latitudeDelta: 0.02, longitudeDelta: 0.02 } : BRASIL
      }
    >
      {ocorrencias.map((o) => (
        <Marker
          key={o.id}
          coordinate={{ latitude: o.latitude, longitude: o.longitude }}
          title={o.titulo}
          description={STATUS[o.status].rotulo}
          pinColor={STATUS[o.status].cor}
        />
      ))}
    </MapView>
  );
}
