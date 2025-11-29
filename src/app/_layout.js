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

// FCM utilities
import {
  registerForPushNotificationsAsync,
  listenForTokenRefresh,
  listenForForegroundMessages,
  forceRefreshToken,
} from "../utils/notifications";

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

  /* ==================================================================
     🔥 USER STATUS + FCM TOKEN HANDLING
     This runs ONLY when a user logs in
     ================================================================== */
  useEffect(() => {
    let appState = AppState.currentState;
    let stateSub = null;
    let tokenSub = null;
    let foregroundSub = null;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log("⚠️ No user logged in — skipping FCM");
        return;
      }

      console.log("👤 Logged in:", user.email);

      // ⭐ WAIT for Firebase Auth to be fully ready
      setTimeout(async () => {
        console.log("🟢 Initializing Push Notifications…");

        // DELETE OLD TOKEN FIRST
        await forceRefreshToken();

        // REQUEST + SAVE NEW TOKEN
        const newToken = await registerForPushNotificationsAsync();
        console.log("🔥 FINAL TOKEN (saved):", newToken);
      }, 500);

      // Token refreshed listener
      tokenSub = listenForTokenRefresh();

      // Foreground message listener
      foregroundSub = listenForForegroundMessages();

      // ONLINE / OFFLINE USER PRESENCE
      const userRef = doc(db, "user", user.uid);

      const setStatus = async (isOnline) => {
        try {
          await updateDoc(userRef, {
            online: isOnline,
            lastActive: serverTimestamp(),
          });
          console.log(`🟢 STATUS: ${isOnline ? "ONLINE" : "OFFLINE"}`);
        } catch (err) {
          console.log("❌ Error updating status:", err);
        }
      };

      stateSub = AppState.addEventListener("change", (next) => {
        if (appState !== next) {
          appState = next;
          setStatus(next === "active");
        }
      });

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

      <PaperProvider>
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
