// _layout.js
import { Slot, useRouter } from "expo-router";
import { View, AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts as useGoogleFonts,
  Poppins_400Regular,
  Poppins_500Medium, // ✅ ADD THIS
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { UserProvider } from "../context/userContext";
import { EducationalProvider } from "../context/educationalContext";
import * as Notifications from "expo-notifications";
import { auth, db } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";

// 👇 Notification appearance settings
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Keep splash visible until fonts load
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const router = useRouter();

  // Load fonts
  const [googleFontsLoaded] = useGoogleFonts({
    Poppins_400Regular,
    Poppins_500Medium, // ✅ added
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

  // ------------------------------------------------------------
  // ✅ USER ONLINE STATUS TRACKING
  // ------------------------------------------------------------
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

      handleOnlineStatus(true);

      return () => {
        sub.remove();
        handleOnlineStatus(false);
      };
    });

    return () => unsubscribeAuth();
  }, []);

  // ------------------------------------------------------------
  // ✅ SAFE NOTIFICATION LISTENERS (NO CRASHING)
  // ------------------------------------------------------------
  useEffect(() => {
    let sub1, sub2;

    try {
      // When notification arrives
      sub1 = Notifications.addNotificationReceivedListener(() => {
        console.log("📬 Notification received (foreground)");
      });

      // When user taps a notification
      sub2 = Notifications.addNotificationResponseReceivedListener((resp) => {
        try {
          const screen = resp?.notification?.request?.content?.data?.screen;

          const currentRoute =
            router.getState()?.routes?.at(-1)?.name?.toLowerCase() || "";

          // 🚫 Prevent routing during login/signup screens
          if (
            currentRoute.includes("login") ||
            currentRoute.includes("signup") ||
            currentRoute.includes("forgot")
          ) {
            console.log("🛑 Ignored notification tap during login/signup");
            return;
          }

          if (screen) router.push(screen);
          else router.push("/Main/notifications");
        } catch (err) {
          console.log("⚠️ Error handling notification tap:", err);
        }
      });
    } catch (err) {
      // 👇 THIS PREVENTS CRASHES WHEN FIREBASEAPP IS NOT INITIALIZED
      console.log("⚠️ Notifications not initialized yet:", err);
    }

    return () => {
      sub1?.remove?.();
      sub2?.remove?.();
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <PaperProvider theme={{ dark: false }}>
        <UserProvider>
          <EducationalProvider>
            <View
              style={{ flex: 1, backgroundColor: "#ffffff" }}
              onLayout={onLayoutRootView}
            >
              <Slot />
            </View>
          </EducationalProvider>
        </UserProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
