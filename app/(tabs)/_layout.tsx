import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Feather } from '@react-native-vector-icons/feather';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#108245',
        tabBarButton: HapticTab,
      }}>

      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa da cidade',
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color }) => <Feather name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarLabel: 'Ranking',
          tabBarIcon: ({ color }) => <Feather name="award" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: 'Notificações',
          tabBarLabel: 'Notificações',
          tabBarIcon: ({ color }) => <Feather name="bell" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil do usuário',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />


    </Tabs>
  );
}
