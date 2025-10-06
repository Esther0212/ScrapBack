// _layout.js
import { Slot, useRouter } from "expo-router";
import { View, Alert } from "react-native";
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

// 🔔 Notifications
import * as Notifications from "expo-notifications";

SplashScreen.preventAutoHideAsync(); // keep splash until fonts are loaded

export default function Layout() {
  const router = useRouter();

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

  // 🔔 Global Notification Listeners
  useEffect(() => {
    // Foreground listener → show alert when a notification arrives while app is open
    const sub1 = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      Alert.alert(title || "Notification", body || "");
    });

    // Tap listener → navigate when user taps the notification
    const sub2 = Notifications.addNotificationResponseReceivedListener((resp) => {
      const screen = resp.notification.request.content.data?.screen;
      if (screen) {
        router.push(screen);
      }
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

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
