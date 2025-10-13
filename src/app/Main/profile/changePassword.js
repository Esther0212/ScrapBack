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

const ChangePassword = () => {
  const { userData } = useUser();
  const auth = getAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ✅ Handle password change securely
  const handleChangePassword = async () => {
    try {
      setIsSaving(true);
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in.");

      if (!currentPassword || !newPassword) {
        throw new Error("Please fill in all fields.");
      }
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }

      // Reauthenticate
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);

      // Update password
      await updatePassword(user, newPassword);

      setToastMessage("Password updated successfully!");
      showToast();
      setConfirmModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        setToastMessage("Incorrect current password.");
      } else if (error.code === "auth/weak-password") {
        setToastMessage("Password must be at least 6 characters.");
      } else {
        setToastMessage(error.message || "Failed to update password.");
      }
      showToast();
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Toast animation
  const showToast = () => {
    setToastVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setToastVisible(false));
      }, 2000);
    });
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.header}>Change Password</Text>

          <PasswordField
            label="Current Password"
            value={currentPassword}
            setValue={setCurrentPassword}
            visible={showCurrent}
            toggleVisible={() => setShowCurrent(!showCurrent)}
          />
          <PasswordField
            label="New Password"
            value={newPassword}
            setValue={setNewPassword}
            visible={showNew}
            toggleVisible={() => setShowNew(!showNew)}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            visible={showConfirm}
            toggleVisible={() => setShowConfirm(!showConfirm)}
          />

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                opacity:
                  !currentPassword || !newPassword || !confirmPassword
                    ? 0.6
                    : 1,
              },
            ]}
            onPress={() => setConfirmModalVisible(true)}
            disabled={
              !currentPassword || !newPassword || !confirmPassword || isSaving
            }
          >
            <Text style={styles.saveText}>Update Password</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ✅ Confirm Modal */}
        <Modal
          visible={confirmModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <View style={styles.modalOverlayCenter}>
            <View style={styles.confirmModal}>
              <Text style={styles.confirmTitle}>Confirm Password Change</Text>
              <Text style={styles.confirmText}>
                Are you sure you want to update your password?
              </Text>

              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setConfirmModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { opacity: isSaving ? 0.7 : 1 },
                  ]}
                  onPress={handleChangePassword}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.saveText}>Saving...</Text>
                    </View>
                  ) : (
                    <Text style={styles.saveText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ✅ Toast */}
        {toastVisible && (
          <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </CustomBgColor>
  );
};

// ✅ Password input field with eye toggle
const PasswordField = ({ label, value, setValue, visible, toggleVisible }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.passwordWrapper}>
      <TextInput
        value={value}
        onChangeText={setValue}
        secureTextEntry={!visible}
        style={styles.input}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#777"
      />
      <TouchableOpacity onPress={toggleVisible} style={styles.eyeIcon}>
        <Ionicons
          name={visible ? "eye" : "eye-off"} // 👁 shows password | 👁‍🗨 hides password
          size={22}
          color="#3A2E2E"
        />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20 },
  header: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: { marginBottom: 16 },
  label: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 6,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0D4C3",
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
  },
  eyeIcon: { paddingHorizontal: 8 },
  saveButton: {
    backgroundColor: "#008243",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  confirmButton: {
    backgroundColor: "#008243",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  cancelButton: {
    backgroundColor: "#888",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
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
    padding: 20,
    width: "90%",
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
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
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
