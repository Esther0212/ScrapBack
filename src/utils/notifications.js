import messaging from "@react-native-firebase/messaging";
import { Platform, PermissionsAndroid } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

/* =========================================================
   🗑 FORCE DELETE OLD TOKEN (ensures dead tokens are removed)
   ========================================================= */
export async function forceRefreshToken() {
  try {
    console.log("🗑 Deleting old FCM token…");
    await messaging().deleteToken();
  } catch (error) {
    console.log("⚠️ Could not delete old token:", error);
  }
}

/* =========================================================
   🔐 PERMISSION REQUEST (Android 13+ + iOS)
   ========================================================= */
async function requestUserPermission() {
  try {
    // ANDROID 13+
    if (Platform.OS === "android" && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log("❌ Android notification permission denied");
        return false;
      }

      console.log("✅ Android notification permission granted");
      return true;
    }

    // iOS
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log("❌ iOS notification permission denied");
      return false;
    }

    console.log("✅ iOS notification permission granted");
    return true;
  } catch (error) {
    console.log("❌ Error requesting permission:", error);
    return false;
  }
}

/* =========================================================
   🔥 GET + SAVE FCM TOKEN
   ========================================================= */
export async function registerForPushNotificationsAsync() {
  try {
    const permissionGranted = await requestUserPermission();
    if (!permissionGranted) {
      console.log("⚠️ Permission not granted. No FCM token.");
      return null;
    }

    // ⭐ GET TOKEN
    const fcmToken = await messaging().getToken();
    console.log("🔥 FCM Token acquired:", fcmToken);

    // ⭐ SAVE TOKEN TO FIRESTORE
    const user = auth.currentUser;
    if (user && fcmToken) {
      await setDoc(
        doc(db, "user", user.uid),
        { fcmToken },
        { merge: true }
      );
      console.log("💾 Token saved to Firestore:", user.uid);
    }

    return fcmToken;
  } catch (error) {
    console.log("❌ Error getting FCM token:", error);
    return null;
  }
}

/* =========================================================
   ♻️ LISTEN FOR TOKEN REFRESH (Firebase rotates keys often)
   ========================================================= */
export function listenForTokenRefresh() {
  return messaging().onTokenRefresh(async (newToken) => {
    try {
      console.log("♻️ Token refreshed:", newToken);

      const user = auth.currentUser;

      if (user && newToken) {
        await setDoc(
          doc(db, "user", user.uid),
          { fcmToken: newToken },
          { merge: true }
        );
        console.log("💾 Refreshed token saved to Firestore");
      }
    } catch (error) {
      console.log("❌ Error updating refreshed token:", error);
    }
  });
}

/* =========================================================
   📲 FOREGROUND MESSAGE HANDLER
   ========================================================= */
export function listenForForegroundMessages() {
  return messaging().onMessage(async (remoteMessage) => {
    console.log("📲 FOREGROUND NOTIFICATION RECEIVED:", remoteMessage);
  });
}

/* =========================================================
   🌙 BACKGROUND + QUITTED MESSAGE HANDLER
   ========================================================= */
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("🌙 BACKGROUND NOTIFICATION RECEIVED:", remoteMessage);
});

/* =========================================================
   ❌ DELETE TOKEN FOR CURRENT USER (logout / switch)
   ========================================================= */
export async function removeDeviceTokenForCurrentUser() {
  try {
    const user = auth.currentUser;
    if (!user) return;

    console.log("🗑 Removing FCM token for user:", user.uid);

    // delete device token
    await messaging().deleteToken();

    // remove from Firestore
    await setDoc(
      doc(db, "user", user.uid),
      { fcmToken: "" },
      { merge: true }
    );

  } catch (err) {
    console.log("❌ Error removing token:", err);
  }
}

