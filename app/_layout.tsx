import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import "react-native-reanimated";

import { AuthProvider } from "@/context/auth-context";
import { CidadeProvider } from "@/context/cidade-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  //anchor: "(tabs)",
  initialRouteName: "login",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      {/* NOVO — envolve tudo */}
      <CidadeProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="cadastro" options={{ title: "Cadastro" }} />
            <Stack.Screen
              name="esqueci-senha"
              options={{ title: "Recuperar senha" }}
            />
            <Stack.Screen
              name="verificar-email"
              options={{ headerShown: false }}
            />
          </Stack>
        </ThemeProvider>
      </CidadeProvider>
    </AuthProvider>
  );
}
