// _layout.js or App.js
import { Slot } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { Provider as PaperProvider } from "react-native-paper";

SplashScreen.preventAutoHideAsync(); // ← important to place at the top level

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    "Poppins-Black": require("../../src/assets/fonts/Poppins-Black.ttf"),
    "Poppins-BlackItalic": require("../../src/assets/fonts/Poppins-BlackItalic.ttf"),
    "Poppins-Bold": require("../../src/assets/fonts/Poppins-Bold.ttf"),
    "Poppins-BoldItalic": require("../../src/assets/fonts/Poppins-BoldItalic.ttf"),
    "Poppins-ExtraBold": require("../../src/assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraBoldItalic": require("../../src/assets/fonts/Poppins-ExtraBoldItalic.ttf"),
    "Poppins-ExtraLight": require("../../src/assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-ExtraLightItalic": require("../../src/assets/fonts/Poppins-ExtraLightItalic.ttf"),
    "Poppins-Italic": require("../../src/assets/fonts/Poppins-Italic.ttf"),
    "Poppins-Light": require("../../src/assets/fonts/Poppins-Light.ttf"),
    "Poppins-LightItalic": require("../../src/assets/fonts/Poppins-LightItalic.ttf"),
    "Poppins-Medium": require("../../src/assets/fonts/Poppins-Medium.ttf"),
    "Poppins-MediumItalic": require("../../src/assets/fonts/Poppins-MediumItalic.ttf"),
    "Poppins-Regular": require("../../src/assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../../src/assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-SemiBoldItalic": require("../../src/assets/fonts/Poppins-SemiBoldItalic.ttf"),
    "Poppins-Thin": require("../../src/assets/fonts/Poppins-Thin.ttf"),
    "Poppins-ThinItalic": require("../../src/assets/fonts/Poppins-ThinItalic.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <Slot />
        </View>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
