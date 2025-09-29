// _layout.js
import { Slot } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts as useGoogleFonts,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { UserProvider } from "../context/userContext";
import { EducationalProvider } from "../context/educationalContext";

SplashScreen.preventAutoHideAsync(); // keep splash until fonts are loaded

export default function Layout() {
  // Load Google Fonts
  const [googleFontsLoaded] = useGoogleFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const fontsLoaded = googleFontsLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // don't render until all fonts are loaded
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <EducationalProvider>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <Slot />
          </View>
        </EducationalProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
