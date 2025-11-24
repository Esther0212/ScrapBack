// app/_layout.js

import { Slot } from "expo-router";
import { View, AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts as useGoogleFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { UserProvider } from "../context/userContext";
import { EducationalProvider } from "../context/educationalContext";
import { auth, db } from "../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";

// ✅ FCM FUNCTIONS
import {
  registerForPushNotificationsAsync,
  listenForTokenRefresh,
  listenForForegroundMessages,
} from "../utils/notifications";

// Keep splash visible until fonts load
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  // Load fonts
  const [fontsLoaded] = useGoogleFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [fontsLoaded]);

  // ------------------------------------------------------------
  // ✅ USER STATUS + FCM (ONLY RUNS IF LOGGED IN)
  // ------------------------------------------------------------
  useEffect(() => {
    let appState = AppState.currentState;
    let stateSub = null;
    let tokenSub = null;
    let foregroundSub = null;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log("⚠️ No user logged in — skipping FCM + status");
        return;
      }

      console.log("✅ User detected:", user.email);

      // ✅ Register FCM token
      await registerForPushNotificationsAsync();

      // ✅ Listen for token refresh
      tokenSub = listenForTokenRefresh();

      // ✅ Listen for foreground messages
      foregroundSub = listenForForegroundMessages();

      const userRef = doc(db, "user", user.uid);

      const setStatus = async (isOnline) => {
        try {
          await updateDoc(userRef, {
            online: isOnline,
            lastActive: serverTimestamp(),
          });

          console.log(
            `✅ ${user.email} set to ${isOnline ? "ONLINE" : "OFFLINE"}`
          );
        } catch (err) {
          console.log("❌ Error updating status:", err);
        }
      };

      // Listen to app background / active state
      stateSub = AppState.addEventListener("change", (next) => {
        if (appState !== next) {
          appState = next;
          setStatus(next === "active");
        }
      });

      // Initial status
      setStatus(true);

      return () => {
        stateSub?.remove?.();
        tokenSub?.();
        foregroundSub?.();
        setStatus(false);
      };
    });

    return () => unsubscribe();
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
