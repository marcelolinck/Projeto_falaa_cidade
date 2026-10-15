import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather } from '@react-native-vector-icons/feather';
import { Tabs } from 'expo-router';

/**
 * Layout das abas (barra inferior do app).
 *
 * A pasta `(tabs)` é um "grupo de rotas" do Expo Router: os parênteses
 * organizam os arquivos, mas NÃO entram na URL. Por isso o arquivo
 * `app/(tabs)/mapa.tsx` continua sendo acessado pela rota `/mapa`.
 *
 * Cada <Tabs.Screen> abaixo vira um botão na barra de abas. O `name`
 * precisa ser exatamente o nome do arquivo da tela (sem o `.tsx`).
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      // `screenOptions` vale para TODAS as abas de uma vez
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint, // cor da aba selecionada (claro/escuro)
        headerShown: false, // esconde o cabeçalho padrão no topo da tela
        tabBarButton: HapticTab, // botão que vibra levemente ao ser tocado
      }}>
      <Tabs.Screen
        name="mapa" // -> app/(tabs)/mapa.tsx
        options={{
          title: 'Mapa', // texto que aparece embaixo do ícone
          // `tabBarIcon` recebe a cor certa (ativa/inativa) e desenha o ícone.
          // Os nomes dos ícones Feather estão em https://feathericons.com
          tabBarIcon: ({ color }) => <Feather name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
           tabBarIcon: ({ color }) => <Feather name="award" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ color }) => <Feather name="bell" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
