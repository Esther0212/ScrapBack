// ✅ Import Firebase JS SDK (Web SDK compatible with React Native)
import { initializeApp } from "firebase/app";
import { 
  initializeAuth,
  getReactNativePersistence 
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Your Firebase Web App config (this works in both Expo and APK)
const firebaseConfig = {
  apiKey: "AIzaSyCx8xp6oZDH_tojkX6TZSkDHMqRjrOBzHw",
  authDomain: "scrapback.firebaseapp.com",
  projectId: "scrapback",
  storageBucket: "scrapback.firebasestorage.app",
  messagingSenderId: "982925588158",
  appId: "1:982925588158:web:966a341afbf3d60c4110ef",
};

// ✅ Initialize Firebase (only once)
const app = initializeApp(firebaseConfig);

// 🚨 IMPORTANT: Use initializeAuth() for persistent login on APK
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Export services for use in your components
export { auth, db, storage };
