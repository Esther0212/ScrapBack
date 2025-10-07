// _layout.js
import { Slot, useRouter } from "expo-router";
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
import * as Notifications from "expo-notifications";

// 👇 Ensure foreground shows the SMALL system banner (toast-style)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // IMPORTANT: use shouldShowAlert (correct key)
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const router = useRouter();

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

  // 🔔 Global notification listeners
  useEffect(() => {
    // (Optional) just log when a foreground notification is received
    const sub1 = Notifications.addNotificationReceivedListener(() => {
      console.log("📬 Notification received in foreground");
    });

    // Navigate when the user taps the banner / tray notification
    const sub2 = Notifications.addNotificationResponseReceivedListener(
      (resp) => {
        const screen = resp?.notification?.request?.content?.data?.screen;
        if (screen) {
          router.push(screen);
        } else {
          router.push("/Main/notifications");
        }
      }
    );

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  if (!fontsLoaded) return null;

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
