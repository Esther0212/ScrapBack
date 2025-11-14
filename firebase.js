// firebase.js

// --- Core Firebase SDKs ---
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- Auth setup with AsyncStorage persistence ---
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Optional Analytics (web-only, wrapped to avoid Expo errors) ---
import { getAnalytics, isSupported } from "firebase/analytics";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCx8xp6oZDH_tojkX6TZSkDHMqRjrOBzHw",
  authDomain: "scrapback.firebaseapp.com",
  projectId: "scrapback",
  storageBucket: "scrapback.appspot.com", // ✅ correct bucket
  messagingSenderId: "982925588158",
  appId: "1:982925588158:web:966a341afbf3d60c4110ef",
  measurementId: "G-26CLPX2974",
};

// --- Initialize Firebase App ---
const app = initializeApp(firebaseConfig);

// --- Safe Analytics (won’t crash in Expo/React Native) ---
let analytics;
isSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});

// --- Auth with AsyncStorage persistence ---
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// --- Firestore + Storage ---
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Export everything
export { app, auth, db, storage, analytics, firebaseConfig };
