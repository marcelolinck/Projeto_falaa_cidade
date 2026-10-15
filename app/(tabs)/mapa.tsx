import { useAuth } from "@/hooks/use-auth";
// Paleta de cores única do projeto (arquivo styles/index.tsx).
// Antes cada tela tinha sua própria cópia do objeto `cores`.
import { cores } from "@/styles";
import { Image } from 'expo-image';
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Mapa() {

  // `useAuth()` lê o usuário logado do AuthContext (que conversa com o Firebase).
  // Antes a gente passava `?logado=true` pela URL; agora qualquer tela
  // consegue saber quem está logado sem receber parâmetros.
  // `isLogin: estaLogado` = pega o campo `isLogin` e renomeia para `estaLogado`.
  const { user, isLogin: estaLogado } = useAuth();

  const perfil = user ? user : 'sem informação disponivel';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.status}>
        {/* Renderização condicional: condição ? (se verdadeiro) : (se falso) */}
        {estaLogado ? (
          <>
            <Text style={[styles.statusTexto, { color: cores.verde }]}>
              Você está logado
            </Text>
            <Text style={styles.titulo}>User: {perfil.displayName}</Text>
            <Text style={styles.titulo}>Email: {perfil.email}</Text>
            
            {/* Foto da conta Google, carregada da internet pela URL (uri) */}
            <Image
              style={styles.image}
              source={{ uri: perfil.photoURL }}
             // placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
            />

            <Text style={styles.titulo}>Aqui vai o mapa</Text>
            <Link href="/perfil" asChild>
              <Pressable>
                <Text style={styles.link}>Perfil do usuário</Text>
              </Pressable>
            </Link>
          </>
        ) : (
          <Text style={[styles.statusTexto, { color: cores.alerta }]}>
            Você não está logado
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.bgBrancoGelo,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  status: {
    alignItems: "center",
    marginBottom: 16,
  },
  statusTexto: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  link: {
    color: cores.verde,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
  },
  titulo: {
    color: cores.preto,
    fontSize: 18,
    fontWeight: "600",
  },
  image: {
   // flex: 1,
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#0553',
  },
});
