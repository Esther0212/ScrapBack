import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth, db } from "../../firebase";
import CustomBgColor from "../components/customBgColor";

const { width } = Dimensions.get("window");

const Login = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Auto-login check on mount
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setName(parsedUser.name || "");
          router.replace("/Main");
        }
      } catch (err) {
        console.log("Auto-login error:", err);
      }
    };
    checkStoredUser();
  }, []);

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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const firstName = userData.firstName || "";
        await AsyncStorage.setItem("firstName", firstName);
      }

      // ✅ Remember Me logic
      if (rememberMe) {
        await AsyncStorage.setItem("savedEmail", email);
        await AsyncStorage.setItem("savedPassword", password);
      } else {
        await AsyncStorage.removeItem("savedEmail");
        await AsyncStorage.removeItem("savedPassword");
      }

      Alert.alert("Login Success", "You have successfully logged in!");
      router.replace("/Main");
      const userDoc = await getDoc(doc(db, "user", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setName(userData.name || ""); // <-- fetch `name` from Firestore

        // Save session if rememberMe is checked
        if (rememberMe) {
          await AsyncStorage.setItem(
            "user",
            JSON.stringify({
              uid: user.uid,
              email: user.email,
              name: userData.name || "",
            })
          );
        } else {
          await AsyncStorage.removeItem("user");
        }

        router.push("/Main");
      } else {
        Alert.alert("Error", "User data not found in Firestore.");
      }
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert("Login Failed", error.message);
    }
  };

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("savedEmail");
        const savedPassword = await AsyncStorage.getItem("savedPassword");

        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (e) {
        console.log("Error loading saved credentials:", e);
      }
    };

    loadSavedCredentials();

    const loadFirstName = async () => {
      const name = await AsyncStorage.getItem("firstName");
      if (name) {
        setFirstName(name);
      }
    };
    loadFirstName();
  }, []);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("user");
      router.replace("/login");
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

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
                setErrors({ ...errors, email: "" });
              }}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
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
                  setErrors({ ...errors, password: "" });
                }}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                <Ionicons
                  name={passwordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
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

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.8}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>

          {/* Signup Link */}
          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupTextBold}>Sign up</Text>
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
  title: { fontSize: 34, fontWeight: "800", color: "#3A2E2E", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 17, color: "#555", textAlign: "center", marginBottom: 42 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: "700", color: "#3A2E2E", marginBottom: 6 },
  input: { backgroundColor: "#F1E3D3", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, fontSize: 16, color: "#3A2E2E", borderWidth: 1, borderColor: "#E0D4C3" },
  passwordWrapper: { position: "relative" },
  eyeIcon: { position: "absolute", right: 16, top: 14, padding: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 42 },
  rememberMe: { flexDirection: "row", alignItems: "center" },
  rememberText: { marginLeft: 6, fontSize: 14, color: "#3A2E2E" },
  forgotText: { fontSize: 14, color: "#3A2E2E", textDecorationLine: "underline" },
  loginButton: { backgroundColor: "#008243", paddingVertical: 18, borderRadius: 14, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.25, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5, elevation: 4 },
  loginButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600", letterSpacing: 0.5 },
  signupLink: { marginTop: 24, alignItems: "center" },
  signupText: { fontSize: 14, color: "#3A2E2E" },
  signupTextBold: { fontWeight: "700", textDecorationLine: "underline" },
  errorText: { color: "red", fontSize: 13, marginTop: 4 },
});

export default Login;
