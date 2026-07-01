import { Stack } from "expo-router";
import { ThemeProvider as ExpoThemeProvider, DefaultTheme as NavLightTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

/** expo-router Stack — _layout entry から分離して lazy load する。 */
export function AppNavigationStack() {
  return (
    <ExpoThemeProvider value={NavLightTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F0F4F8" } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="install-instructions" options={{ presentation: "card" }} />
      </Stack>
      <StatusBar style="auto" />
    </ExpoThemeProvider>
  );
}
