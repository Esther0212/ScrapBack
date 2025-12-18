// src/app/Main/profile/ChangePassword.js
import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomBgColor from "../../../components/customBgColor";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { useUser } from "../../../context/userContext";
import { KeyboardAvoidingView } from "react-native";
import { useNavigation } from "@react-navigation/native";

const ChangePassword = () => {
  const { userData } = useUser();
  const auth = getAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [checkingPass, setCheckingPass] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null); // ✅ "correct" | "wrong" | null
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ✅ Toast Animation
  const showToast = (msg, duration = 2000) => {
    setToastMessage(msg);
    setToastVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setToastVisible(false));
      }, duration);
    });
  };

  // ✅ Reauthenticate user
  const reauthenticate = async (password) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("No active user session");
    const credential = EmailAuthProvider.credential(user.email, password);
    return reauthenticateWithCredential(user, credential);
  };

  // ✅ Check current password validity
  const handleCheckPassword = async () => {
    if (!currentPassword) return;
    try {
      setCheckingPass(true);
      await reauthenticate(currentPassword);
      setPasswordStatus("correct");
    } catch (err) {
      setPasswordStatus("wrong");
    } finally {
      setCheckingPass(false);
    }
  };

  // ✅ Handle change password
  const handleChangePassword = async () => {
    try {
      setIsSaving(true);
      const user = auth.currentUser;
      if (!user) throw new Error("User not found");

      if (!currentPassword || !newPassword || !confirmPassword) {
        showToast("Please fill in all fields");
        return;
      }
      if (passwordStatus !== "correct") {
        showToast("Please verify your current password first");
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast("Passwords do not match");
        return;
      }
      const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!strongPass.test(newPassword)) {
        showToast(
          "Password must be at least 8 characters, include uppercase, lowercase, and number."
        );
        return;
      }

      await updatePassword(user, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus(null);
      showToast("Password updated successfully!");
      setConfirmModalVisible(false);
      setTimeout(() => {
        navigation.goBack(); // or navigation.navigate("Settings")
      }, 800);
    } catch (err) {
      console.error("Error changing password:", err);
      let msg = "Failed to change password.";
      if (err.code === "auth/requires-recent-login")
        msg = "Session expired. Please log in again.";
      showToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              {/* Current Password */}
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  autoCapitalize="none"
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    setPasswordStatus(null);
                  }}
                  onBlur={handleCheckPassword}
                  placeholderTextColor="#777"
                  contextMenuHidden={true}
                  selectTextOnFocus={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrent(!showCurrent)}
                >
                  <Ionicons
                    name={showCurrent ? "eye" : "eye-off"}
                    size={22}
                    color="#3A2E2E"
                  />
                </TouchableOpacity>
              </View>

              {/* ✅ Status Feedback */}
              {checkingPass ? (
                <Text style={styles.checkingText}>Checking password...</Text>
              ) : passwordStatus === "correct" ? (
                <Text style={styles.correctText}>
                  ✓ Current password verified
                </Text>
              ) : passwordStatus === "wrong" ? (
                <Text style={styles.errorText}>✗ Incorrect password</Text>
              ) : null}

              {/* New Password */}
              <Text style={[styles.label, { marginTop: 10 }]}>
                New Password
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  secureTextEntry={!showNew}
                  value={newPassword}
                  autoCapitalize="none"
                  onChangeText={(text) => setNewPassword(text)}
                  placeholderTextColor="#777"
                  contextMenuHidden={true}
                  selectTextOnFocus={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNew(!showNew)}
                >
                  <Ionicons
                    name={showNew ? "eye" : "eye-off"}
                    size={22}
                    color="#3A2E2E"
                  />
                </TouchableOpacity>
              </View>

              {/* ✅ live feedback for password strength */}
              {newPassword.length > 0 &&
              !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword) ? (
                <Text style={styles.errorText}>
                  Password must be at least 8 characters, include uppercase,
                  lowercase, and number.
                </Text>
              ) : null}

              {/* Confirm Password */}
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholderTextColor="#777"
                  contextMenuHidden={true}
                  selectTextOnFocus={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirm(!showConfirm)}
                >
                  <Ionicons
                    name={showConfirm ? "eye" : "eye-off"}
                    size={22}
                    color="#3A2E2E"
                  />
                </TouchableOpacity>
              </View>

              {/* Immediate warning if mismatch */}
              {confirmPassword && newPassword !== confirmPassword && (
                <Text style={styles.errorText}>⚠️ Passwords do not match</Text>
              )}

              {/* Button */}
              <TouchableOpacity
                style={[styles.saveButton, { opacity: isSaving ? 0.8 : 1 }]}
                onPress={() => setConfirmModalVisible(true)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.saveText, { marginLeft: 8 }]}>
                      Saving...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.saveText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Confirm Modal */}
          <Modal
            visible={confirmModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setConfirmModalVisible(false)}
          >
            <View style={styles.modalOverlayCenter}>
              <View style={styles.confirmModal}>
                <Text style={styles.confirmTitle}>Confirm Change</Text>
                <Text style={styles.confirmText}>
                  Are you sure you want to update your password?
                </Text>

                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.noButton}
                    onPress={() => setConfirmModalVisible(false)}
                  >
                    <Text style={styles.noText}>No</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleChangePassword}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmTextBtn}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Toast */}
          {toastVisible && (
            <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 30 },
  container: { flex: 1, alignItems: "stretch", justifyContent: "center" },
  header: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 6,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    borderWidth: 1,
    borderColor: "#E0D4C3",
  },
  eyeIcon: { position: "absolute", right: 16, top: 14 },
  saveButton: {
    backgroundColor: "#008243",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  saveText: { color: "#fff", fontSize: 16, fontFamily: "Poppins_700Bold" },
  checkingText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#71695B",
    marginLeft: 4,
    marginBottom: 8,
  },
  correctText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#2ECC71",
    marginLeft: 4,
    marginBottom: 8,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    marginLeft: 4,
    marginBottom: 8,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 22,
    width: "88%",
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    textAlign: "center",
    marginBottom: 18,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  noButton: {
    flex: 0.45,
    backgroundColor: "#888",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  noText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  confirmButton: {
    flex: 0.45,
    backgroundColor: "#008243",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmTextBtn: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  toast: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: "6%",
    right: "6%",
    backgroundColor: "rgba(14,146,71,0.95)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    elevation: 8,
  },
  toastText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    textAlign: "center",
  },
});

export default ChangePassword;
