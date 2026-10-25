import { Coordenadas } from "@/context/city-context";
import { StyleProp, ViewStyle } from "react-native";
import MapView from "react-native-maps";

// Centro do Brasil: usado só quando não temos a localização do usuário.
const BRASIL = {
  latitude: -14.235,
  longitude: -51.925,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

type Props = { coords: Coordenadas | null; style?: StyleProp<ViewStyle> };

/** Mapa nativo (Android/iOS). Na web existe o arquivo mapa-view.web.tsx. */
export function MapaView({ coords, style }: Props) {
  return (
    <MapView
      style={style}
      showsUserLocation
      showsMyLocationButton
      initialRegion={
        coords ? { ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 } : BRASIL
      }
    />
  );
}
