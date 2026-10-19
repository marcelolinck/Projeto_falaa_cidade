import { useAuth, useSair } from "@/hooks/use-auth";
import { cores } from "@/styles";
import { Image } from 'expo-image';
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


// Por enquanto esta tela é uma cópia da tela Mapa (veja os comentários em mapa.tsx).
// Na próxima etapa ela vai mostrar os dados e o botão de sair do usuário.
export default function Perfil() {

  const { user, isLogin: estaLogado } = useAuth();
  // Desloga, limpa o histórico de navegação e vai para o index.
  const handleSair = useSair();

  const perfil = user ? user : 'sem informação disponivel';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.status}>
        {estaLogado ? (
          <>
            <Text style={[styles.statusTexto, { color: cores.verde }]}>
              Você está logado
            </Text>
            <Text style={styles.titulo}>User: {perfil.displayName}</Text>
            <Text style={styles.titulo}>Email: {perfil.email}</Text>
            
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

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.botaoSair}
              onPress={handleSair}
            >
              <Text style={styles.textoBotaoSair}>Sair</Text>
            </TouchableOpacity>
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
  botaoSair: {
    borderWidth: 2,
    borderColor: cores.verde,
    width: 150,
    padding: 16,
    alignItems: "center",
    borderRadius: 15,
    marginTop: 24,
  },
  textoBotaoSair: {
    color: cores.verde,
    fontSize: 18,
    fontWeight: "800",
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
