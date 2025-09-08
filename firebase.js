import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // optional, only if you upload images/files

// Your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCx8xp6oZDH_tojkX6TZSkDHMqRjrOBzHw",
  authDomain: "scrapback.firebaseapp.com",
  projectId: "scrapback",
  storageBucket: "scrapback.firebasestorage.app",
  messagingSenderId: "982925588158",
  appId: "1:982925588158:web:966a341afbf3d60c4110ef",
  measurementId: "G-26CLPX2974", // fine to leave, just unused
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services you’ll use
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);