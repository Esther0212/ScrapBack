import messaging from "@react-native-firebase/messaging";
import { Platform, PermissionsAndroid } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

/* =========================================================
   ✅ REQUEST NOTIFICATION PERMISSION (ANDROID 13+ & IOS)
   ========================================================= */
async function requestUserPermission() {
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
}

/* =========================================================
   ✅ GET AND STORE FCM TOKEN
   ========================================================= */
export async function registerForPushNotificationsAsync() {
  try {
    const permissionGranted = await requestUserPermission();
    if (!permissionGranted) return null;

    const fcmToken = await messaging().getToken();
    console.log("✅ FCM TOKEN:", fcmToken);

    const user = auth.currentUser;
    if (user && fcmToken) {
      await setDoc(
        doc(db, "user", user.uid),
        { fcmToken },
        { merge: true }
      );
    }

    return fcmToken;
  } catch (err) {
    console.log("❌ Error getting FCM token:", err);
    return null;
  }
}

/* =========================================================
   ✅ TOKEN REFRESH
   ========================================================= */
export function listenForTokenRefresh() {
  return messaging().onTokenRefresh(async (newToken) => {
    try {
      const user = auth.currentUser;

      if (user && newToken) {
        await setDoc(
          doc(db, "user", user.uid),
          { fcmToken: newToken },
          { merge: true }
        );
      }

      console.log("🔄 Token refreshed:", newToken);
    } catch (err) {
      console.log("❌ Error updating refreshed token:", err);
    }
  });
}

/* =========================================================
   ✅ FOREGROUND NOTIFICATIONS
   ========================================================= */
export function listenForForegroundMessages() {
  return messaging().onMessage(async (remoteMessage) => {
    console.log("📲 FOREGROUND NOTIFICATION:", remoteMessage);
  });
}

/* =========================================================
   ✅ BACKGROUND + QUIT NOTIFICATIONS
   ========================================================= */
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("📨 BACKGROUND NOTIFICATION:", remoteMessage);
});
