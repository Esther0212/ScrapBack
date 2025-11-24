import React, { useState, useRef } from "react";
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

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");

  const inputs = useRef([]);

  const isLoginFlow = params?.fromLogin === "true" || params?.fromLogin === true;

  const confirmation = isLoginFlow
    ? getTempLoginConfirmation()
    : getTempConfirmation();

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text.slice(-1);
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const fullCode = code.join("");

  const handleVerify = async () => {
    if (fullCode.length < 6) {
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

      const userCredential = await confirmation.confirm(fullCode);
      const user = userCredential.user;
      const userData = params?.userData
        ? JSON.parse(params.userData)
        : {};

      if (isLoginFlow) {
        const userRef = doc(db, "user", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          ToastAndroid.show(
            "Account not found in database.",
            ToastAndroid.LONG
          );
          router.push("/signup");
          return;
        }

        ToastAndroid.show("Welcome back!", ToastAndroid.SHORT);
        router.replace("/Main");
      } else {
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
      if (err.code === "auth/invalid-verification-code")
        msg = "Invalid code.";
      if (err.code === "auth/code-expired")
        msg = "Code expired. Please resend.";

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
              {isLoginFlow
                ? "Login Verification"
                : "Phone Verification"}
            </Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{" "}
              {params.contact || params.phone || "your phone"}
            </Text>

            {/* OTP BOXES */}
            <View style={styles.otpContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputs.current[index] = el)}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) =>
                    handleChange(text, index)
                  }
                />
              ))}
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            {/* RESEND - More visible but balanced */}
            <TouchableOpacity
              style={styles.resendContainer}
              onPress={() =>
                router.push(
                  isLoginFlow ? "/login" : "/signup"
                )
              }
            >
              <Text style={styles.resendText}>
                Didn’t receive the code?
              </Text>
              <Text style={styles.resendAction}>
                Tap here to resend
              </Text>
            </TouchableOpacity>
          </View>

          {/* SUCCESS MODAL */}
          <Modal
            visible={showSuccessModal}
            transparent
            animationType="fade"
            onRequestClose={() =>
              setShowSuccessModal(false)
            }
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  Phone Verified
                </Text>

                <ScrollView style={styles.modalContent}>
                  <Text style={styles.modalText}>
                    Your phone number has been verified and
                    your account is ready.
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
                  <Text
                    style={styles.closeButtonText}
                  >
                    OK
                  </Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
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
    marginBottom: 26,
  },

  /* OTP BOX STYLE */
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0D4C3",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#3A2E2E",
  },

  verifyButton: {
    backgroundColor: "#008243",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  /* RESEND */
  resendContainer: {
    marginTop: 22,
    alignItems: "center",
  },
  resendText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 2,
  },
  resendAction: {
    fontSize: 14,
    color: "#008243",
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  errorText: {
    color: "red",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },

  /* MODAL */
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
  modalText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: "#008243",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default OtpVerification;
