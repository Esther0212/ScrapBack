import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../utils/notifications";

import { auth, db } from "../../firebase";
import CustomBgColor from "../components/customBgColor";
import { useUser } from "../context/userContext";

const { width } = Dimensions.get("window");

/////////////////////////////////////////////////////////////////
// 🟩 NEW FUNCTION — compare only DATE part (ignore time)
/////////////////////////////////////////////////////////////////
function isDateTodayOrAfter(createdAt) {
  if (!createdAt) return false;

  try {
    const created = new Date(createdAt);
    const today = new Date();

    // Strip time
    created.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // If created date is today or later → NEW USER
    return created.getTime() >= today.getTime();
  } catch (e) {
    console.log("Date compare error:", e);
    return false;
  }
}

/////////////////////////////////////////////////////////////////
// ⚠️ NOTE: createdAt must exist in Firestore user doc!
// Use this on signup:
// await setDoc(doc(db, "user", uid), { ..., createdAt: serverTimestamp() })
/////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////
// MAIN LOGIN COMPONENT
/////////////////////////////////////////////////////////////////
const Login = () => {
  const { setUserData } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  /////////////////////////////////////////////////////////////////
  // Validation helpers
  /////////////////////////////////////////////////////////////////
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const showToast = (message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      console.log("Toast:", message);
    }
  };

  /////////////////////////////////////////////////////////////////
  // 🟩 UPDATED LOGIN LOGIC — EMAIL VERIFICATION FOR NEW USERS ONLY
  /////////////////////////////////////////////////////////////////
  const handleLogin = async () => {
    let tempErrors = { email: "", password: "" };
    let isValid = true;

    if (!email) {
      tempErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      tempErrors.email = "Enter a valid email address";
      isValid = false;
    }

    if (!password) {
      tempErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(tempErrors);
    if (!isValid) return;

    try {
      setLoading(true);

      /////////////////////////////////////////////////////////////////
      // 🔐 Sign In With Firebase
      /////////////////////////////////////////////////////////////////
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      console.log("USER LOGGED IN:", user.uid);

      /////////////////////////////////////////////////////////////////
      // 🔍 FETCH USER DOCUMENT (must contain createdAt)
      /////////////////////////////////////////////////////////////////
      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let createdAt = null;
      let userDataFirestore = null;

      if (userDocSnap.exists()) {
        userDataFirestore = userDocSnap.data();
        createdAt = userDataFirestore.createdAt?.toDate
          ? userDataFirestore.createdAt.toDate()
          : userDataFirestore.createdAt;

        console.log("Firestore createdAt:", createdAt);
      }

      /////////////////////////////////////////////////////////////////
      // 🟨 CASE 1: User has NO createdAt → Old User → Allow login
      /////////////////////////////////////////////////////////////////
      if (!createdAt) {
        console.log(
          "NO createdAt → treat as OLD user (no verification needed)"
        );
      }

      /////////////////////////////////////////////////////////////////
      // 🟥 CASE 2: User is NEW (created today or after)
      /////////////////////////////////////////////////////////////////
      const isNewUser = createdAt && isDateTodayOrAfter(createdAt);

      if (isNewUser) {
        console.log("User is NEW → Must verify email");

        if (!user.emailVerified) {
          await signOut(auth);
          showToast(
            "Please verify your email before logging in. Check your inbox."
          );
          setLoading(false);
          return;
        }
      } else {
        console.log("User is OLD → email verification NOT required");
      }

      /////////////////////////////////////////////////////////////////
      // 🔔 Register for push notifications
      /////////////////////////////////////////////////////////////////
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await setDoc(userDocRef, { expoPushToken: token }, { merge: true });
      }

      /////////////////////////////////////////////////////////////////
      // Set global context user data
      /////////////////////////////////////////////////////////////////
      setUserData({
        uid: user.uid,
        email: user.email,
        ...userDataFirestore,
      });

      /////////////////////////////////////////////////////////////////
      // 💾 Handle Remember Me
      /////////////////////////////////////////////////////////////////
      if (rememberMe) {
        await AsyncStorage.setItem("savedEmail", email);
        await AsyncStorage.setItem("savedPassword", password);
      } else {
        await AsyncStorage.removeItem("savedEmail");
        await AsyncStorage.removeItem("savedPassword");
      }

      /////////////////////////////////////////////////////////////////
      // NAVIGATE
      /////////////////////////////////////////////////////////////////
      showToast("Login successful! Welcome back!");

      setTimeout(() => {
        router.replace("/Main");
      }, 1000);
    } catch (error) {
      console.error("FULL LOGIN ERROR:", error);

      let message = "Login failed. Please try again.";
      if (error.code === "auth/invalid-email")
        message = "Invalid email address.";
      else if (error.code === "auth/user-not-found")
        message = "User not found.";
      else if (error.code === "auth/wrong-password")
        message = "Incorrect password.";

      showToast(message);
    } finally {
      setLoading(false);
    }
  };

  /////////////////////////////////////////////////////////////////
  // Load saved login info
  /////////////////////////////////////////////////////////////////
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("savedEmail");
        const savedPassword = await AsyncStorage.getItem("savedPassword");

        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (e) {
        console.log("Error loading saved creds:", e);
      }
    };

    loadSaved();
  }, []);

  /////////////////////////////////////////////////////////////////
  // RETURN UI
  /////////////////////////////////////////////////////////////////
  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          {/* EMAIL FIELD */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              placeholder="Your email"
              placeholderTextColor="#888"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* PASSWORD FIELD */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#888"
                style={styles.input}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                value={password}
                contextMenuHidden={true} // hides copy/paste menu
                editable={true}
                selectTextOnFocus={false} // prevents selecting/pasting
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                <Ionicons
                  name={passwordVisible ? "eye" : "eye-off"}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>

          {/* REMEMBER ME + FORGOT PASSWORD */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Ionicons
                name={rememberMe ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={rememberMe ? "#008243" : "#555"}
              />
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/forgotpass")}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* SIGNUP LINK */}
          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.signupText}>
              Don’t have an account?{" "}
              <Text style={styles.signupTextBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </CustomBgColor>
  );
};

/////////////////////////////////////////////////////////////////
// STYLESHEET
/////////////////////////////////////////////////////////////////
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  title: {
    fontSize: 34,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    color: "#555",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 42,
  },
  inputContainer: { marginBottom: 24 },
  label: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    borderWidth: 1,
    borderColor: "#E0D4C3",
  },
  passwordWrapper: { position: "relative" },
  eyeIcon: { position: "absolute", right: 16, top: 14, padding: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 42,
  },
  rememberMe: { flexDirection: "row", alignItems: "center" },
  rememberText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    textDecorationLine: "underline",
  },
  loginButton: {
    backgroundColor: "#008243",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    elevation: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  signupLink: { marginTop: 24, alignItems: "center" },
  signupText: {
    fontSize: 14,
    color: "#3A2E2E",
    fontFamily: "Poppins_400Regular",
  },
  signupTextBold: {
    fontFamily: "Poppins_700Bold",
    textDecorationLine: "underline",
  },
  errorText: { color: "red", fontSize: 13, marginTop: 4 },
});

export default Login;