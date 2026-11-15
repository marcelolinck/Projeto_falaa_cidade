import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
// @ts-ignore - tipos do firebase/auth não expõem getReactNativePersistence p/ RN, mas existe em runtime no build nativo (iOS/Android)
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Na web o bundle do firebase/auth não traz getReactNativePersistence (é só
// pra iOS/Android), então lá usamos getAuth normal — o Firebase já persiste
// a sessão no localStorage do navegador por padrão.
export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });


// Firestore: banco de dados (ocorrências, usuários...).
// `initializeFirestore` só pode ser chamado uma vez por app. No recarregamento
// rápido do Expo (Fast Refresh) este arquivo roda de novo; nesse caso o
// Firestore já existe e basta pegá-lo com `getFirestore`.
// `experimentalAutoDetectLongPolling` evita travamentos de conexão em redes
// que bloqueiam o canal padrão do Firestore.
function iniciarBancoDeDados() {
  try {
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    return getFirestore(app);
  }
}

export const bancoDeDados = iniciarBancoDeDados();

// Storage: armazenamento das fotos. Só existe se a variável
// EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET estiver preenchida no .env.
// Sem ela vale `null`: o app grava a ocorrência normalmente, só sem as fotos.
export const armazenamento = firebaseConfig.storageBucket ? getStorage(app) : null;
