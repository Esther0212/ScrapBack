// OtpVerification.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  ToastAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import CustomBgColor from "../components/customBgColor";
import { auth, db } from "../../firebase";
import { setDoc, getDoc, doc } from "firebase/firestore";
import { getTempConfirmation } from "./signup";
import { getTempLoginConfirmation } from "./login";

const OtpVerification = () => {
  const params = useLocalSearchParams();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");

  // detect whether this OTP is for login or signup
  const isLoginFlow = params?.fromLogin === "true" || params?.fromLogin === true;

  // pick confirmation object from correct temp store
  const confirmation = isLoginFlow ? getTempLoginConfirmation() : getTempConfirmation();

  const handleVerify = async () => {
    if (!code || code.length < 4) {
      ToastAndroid.show("Enter the 6-digit code.", ToastAndroid.SHORT);
      return;
    }

    if (!confirmation) {
      ToastAndroid.show(
        "Missing OTP session. Please try again.",
        ToastAndroid.LONG
      );
      router.push(isLoginFlow ? "/login" : "/signup");
      return;
    }

    try {
      setLoading(true);

      // ✅ Verify OTP - Creates real Firebase user
      const userCredential = await confirmation.confirm(code);
      const user = userCredential.user;
      const userData = params?.userData ? JSON.parse(params.userData) : {};

      if (isLoginFlow) {
        // 🟢 LOGIN FLOW - User is already signed in by Firebase
        const userRef = doc(db, "user", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          ToastAndroid.show("Account not found in database.", ToastAndroid.LONG);
          router.push("/signup");
          return;
        }

        ToastAndroid.show("Welcome back!", ToastAndroid.SHORT);
        router.replace("/Main");
      } else {
        // 🟢 SIGNUP FLOW - Create user profile in Firestore
        // User is now authenticated with Firebase Auth
        await setDoc(doc(db, "user", user.uid), {
          ...userData,
          uid: user.uid,
          createdAt: new Date(),
          points: 0,
          online: false,
        });

        console.log("✅ User account created:", user.uid);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("OTP verify error:", err);
      let msg = "Failed to verify code. Please try again.";
      if (err.code === "auth/invalid-verification-code") msg = "Invalid code.";
      if (err.code === "auth/code-expired") msg = "Code expired. Please resend.";
      setError(msg);
      ToastAndroid.show(msg, ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.title}>
              {isLoginFlow ? "Login Verification" : "Phone Verification"}
            </Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {params.contact || params.phone || "your phone"}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>One-time code</Text>
              <TextInput
                placeholder="123456"
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ""))}
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={6}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendLink}
              onPress={() => router.push(isLoginFlow ? "/login" : "/signup")}
            >
              <Text style={styles.resendText}>Didn’t get code? Resend</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Signup Success Modal */}
          <Modal
            visible={showSuccessModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSuccessModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Phone Verified</Text>
                <ScrollView style={styles.modalContent}>
                  <Text style={styles.modalText}>
                    Your phone number has been verified and your account is ready.
                    {"\n\n"}You can now log in.
                  </Text>
                </ScrollView>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.push("/login");
                  }}
                >
                  <Text style={styles.closeButtonText}>OK</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center" },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#3A2E2E",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: "700", color: "#3A2E2E", marginBottom: 6 },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#3A2E2E",
    borderWidth: 1,
    borderColor: "#E0D4C3",
    width: "100%",
  },
  verifyButton: {
    backgroundColor: "#008243",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  resendLink: { marginTop: 18, alignItems: "center" },
  resendText: { color: "#3A2E2E", textDecorationLine: "underline" },
  errorText: { color: "red", fontSize: 13, marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#008243",
    marginBottom: 12,
    textAlign: "center",
  },
  modalContent: { marginBottom: 20 },
  modalText: { fontSize: 14, color: "#333", lineHeight: 22 },
  closeButton: {
    backgroundColor: "#008243",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default OtpVerification;
