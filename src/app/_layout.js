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
import { AppState } from "react-native";
import { auth, db } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";

// 👇 Make sure notifications show as toast banners (not full-screen)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Keep splash visible until fonts are ready
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

  // ✅ Track user online/offline dynamically based on login state
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      const handleOnlineStatus = async (isOnline) => {
        try {
          await updateDoc(doc(db, "user", user.uid), {
            online: isOnline,
            lastActive: serverTimestamp(),
          });
          console.log(
            `✅ ${user.email} marked as ${isOnline ? "Online" : "Offline"}`
          );
        } catch (err) {
          console.log("❌ Error updating online status:", err);
        }
      };

      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") handleOnlineStatus(true);
        else handleOnlineStatus(false);
      });

      handleOnlineStatus(true); // mark online immediately
      return () => {
        sub.remove();
        handleOnlineStatus(false);
      };
    });

    return () => unsubscribeAuth();
  }, []);

  // ✅ Global Notification Listeners (with guards)
  useEffect(() => {
    const sub1 = Notifications.addNotificationReceivedListener(() => {
      console.log("📬 Notification received in foreground");
    });

    const sub2 = Notifications.addNotificationResponseReceivedListener(
      (resp) => {
        try {
          const screen = resp?.notification?.request?.content?.data?.screen;
          const currentRoute =
            router.getState()?.routes?.at(-1)?.name?.toLowerCase() || "";

          // 🚫 Guard: Don't hijack login/signup/navigation while logging in
          if (
            currentRoute.includes("login") ||
            currentRoute.includes("signup") ||
            currentRoute.includes("forgot")
          ) {
            console.log("🛑 Ignored notification tap during login/signup.");
            return;
          }

          if (screen) router.push(screen);
          else router.push("/Main/notifications");
        } catch (err) {
          console.log("⚠️ Notification routing error:", err);
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
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <PaperProvider theme={{ dark: false }}>
        <UserProvider>
          <EducationalProvider>
            <View style={{ flex: 1, backgroundColor: "#ffffff" }} onLayout={onLayoutRootView}>
              <Slot />
            </View>
          </EducationalProvider>
        </UserProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
