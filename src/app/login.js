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
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../utils/notifications";

import { auth, db } from "../../firebase";
import CustomBgColor from "../components/customBgColor";
import { useUser } from "../context/userContext";

const { width } = Dimensions.get("window");

const Login = () => {
  const { setUserData } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const showToast = (message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      console.log("Toast:", message);
    }
  };

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

      // 🔐 Firebase sign-in
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Logged in:", user.uid);

      // ✅ Check if email is verified
      if (!user.emailVerified) {
        await signOut(auth); // log them out again

        showToast("Please verify your email before logging in.");
        setLoading(false);
        return;
      }

      // 🔔 Get push token
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await setDoc(
          doc(db, "user", user.uid),
          { expoPushToken: token },
          { merge: true }
        );
      }

      // 🔎 Fetch user profile
      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const profile = userDocSnap.data();

        setUserData({
          uid: user.uid,
          email: user.email,
          ...profile,
        });
      } else {
        console.warn("⚠️ No profile found for user:", user.uid);
        setUserData({ uid: user.uid, email: user.email });
      }

      // 💾 Remember credentials
      if (rememberMe) {
        await AsyncStorage.setItem("savedEmail", email);
        await AsyncStorage.setItem("savedPassword", password);
      } else {
        await AsyncStorage.removeItem("savedEmail");
        await AsyncStorage.removeItem("savedPassword");
      }

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

      showToast("❌ " + message);

    } finally {
      setLoading(false);
    }
  };

  // Auto-load saved creds
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

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          {/* Email */}
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

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#888"
                style={styles.input}
                secureTextEntry={!passwordVisible}
                value={password}
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

          {/* Remember Me + Forgot Password */}
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

          {/* Login button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Log in</Text>
            )}
          </TouchableOpacity>

          {/* Signup link */}
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
