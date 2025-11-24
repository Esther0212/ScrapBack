import React, { useState, useEffect, useRef } from "react";
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
import { signInWithEmailAndPassword, signInWithPhoneNumber } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../utils/notifications";

import { auth, db, firebaseConfig } from "../../firebase";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import CustomBgColor from "../components/customBgColor";
import { useUser } from "../context/userContext";

const { width } = Dimensions.get("window");

/* ------------------------------------------------
  TEMP OTP STORAGE (for OTP verification screen)
-------------------------------------------------- */
let tempLoginConfirmation = null;
export const getTempLoginConfirmation = () => tempLoginConfirmation;

const Login = () => {
  const { setUserData } = useUser();

  /* ----------------------------
    EMAIL / PHONE TOGGLE STATE
  ----------------------------- */
  const [useEmail, setUseEmail] = useState(true);
  // true = Email/password login
  // false = Phone (OTP) login

  /* ----------------------------
    RECAPTCHA VERIFIER
  ----------------------------- */
  const recaptchaVerifier = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState("");

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

        // ✅ Update context
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

      // ✅ Success toast
      showToast("Login successful! Welcome back!");

      // Small delay for a smooth transition
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

      // ⚠️ Error toast
      showToast("❌ " + message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------
     PHONE OTP SEND (login)
  ----------------------------- */
  const handleSendOtp = async () => {
    if (!contact) {
      showToast("Please enter your contact number.");
      return;
    }

    // Remove dashes
    const digitsOnly = contact.replace(/\D/g, "");

    // Must be exactly 11 digits
    if (digitsOnly.length !== 11) {
      showToast("Contact number must be 11 digits.");
      return;
    }

    // Must start with 09
    if (!digitsOnly.startsWith("09")) {
      showToast("Number must start with 09.");
      return;
    }

    // Convert to +639XXXXXXXXX
    const formattedPhone = "+63" + digitsOnly.slice(1);

    if (!recaptchaVerifier.current) {
      showToast("Recaptcha not ready. Try again.");
      return;
    }

    try {
      setLoading(true);

      // 🔎 CHECK DATABASE FIRST
      const snapshot = await getDocs(collection(db, "user"));
      const userExists = snapshot.docs.some(
        (d) => d.data().contact === formattedPhone
      );

      if (!userExists) {
        setLoading(false);
        showToast("❌ No account found using this phone number.");
        return;
      }

      // 📱 Send OTP
      showToast("Sending OTP...");

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier.current
      );

      tempLoginConfirmation = confirmation;

      router.push({
        pathname: "/OtpVerification",
        params: {
          fromLogin: true,
          contact: formattedPhone,
        },
      });

    } catch (err) {
      console.error("Send OTP error:", err);

      let msg = "Failed to send OTP.";
      if (err.code === "auth/too-many-requests")
        msg = "Too many attempts. Try later.";

      showToast(msg);
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
        {/* RECAPTCHA VERIFIER */}
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification={true}
        />
        <View style={styles.container}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>
          {/* Email / Phone Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, useEmail && styles.toggleButtonActive]}
              onPress={() => {
                setUseEmail(true);
                setContact("");
              }}
            >
              <Text style={[styles.toggleButtonText, useEmail && styles.toggleButtonTextActive]}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, !useEmail && styles.toggleButtonActive]}
              onPress={() => {
                setUseEmail(false);
                setEmail("");
                setPassword("");
              }}
            >
              <Text style={[styles.toggleButtonText, !useEmail && styles.toggleButtonTextActive]}>Phone (OTP)</Text>
            </TouchableOpacity>
          </View>

          {useEmail ? (
            <>
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
            </>
          ) : (
            /* Phone (OTP) input */
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                placeholder="0912-345-6789"
                placeholderTextColor="#888"
                style={styles.input}
                keyboardType="phone-pad"
                value={contact}
                maxLength={13} // 0000-000-0000 = 13 chars
                onChangeText={(text) => {
                  // Remove non-digits
                  let digits = text.replace(/\D/g, "");

                  // Limit to 11 digits max
                  if (digits.length > 11) {
                    digits = digits.slice(0, 11);
                  }

                  // Format: 0000-000-0000
                  let formatted = digits;

                  if (digits.length > 4 && digits.length <= 7) {
                    formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
                  } 
                  else if (digits.length > 7) {
                    formatted = `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
                  }

                  setContact(formatted);
                }}
              />
            </View>
          )}

          {useEmail ? (
            <>
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
                activeOpacity={0.8}
                onPress={handleLogin}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Log in</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={handleSendOtp}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          )}

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
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#008243",
  },
  toggleButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#3A2E2E",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
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
    shadowColor: "rgba(0, 0, 0, 1)",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
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
