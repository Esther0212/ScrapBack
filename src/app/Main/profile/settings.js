import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
} from "react-native";
import CustomBgColor from "../../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { useUser } from "../../../context/userContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db } from "../../../../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import messaging from "@react-native-firebase/messaging"; // ← ADD THIS

const Settings = () => {
  const router = useRouter();
  const auth = getAuth();
  const { userData } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [savedUsers, setSavedUsers] = useState([]);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    try {
      const user = auth.currentUser;

      if (user) {
        // Mark user offline
        await updateDoc(doc(db, "user", user.uid), {
          online: false,
          lastActive: serverTimestamp(),
          fcmToken: "", // remove token in Firestore
        });

        console.log("🔻 User offline + token removed in Firestore");
      }

      // 🔥 Remove FCM token from device + Firestore
      await messaging().deleteToken();
      console.log("🗑 Device FCM token deleted");

      // Sign out from Firebase
      await signOut(auth);

      // Clear local data if needed
      await AsyncStorage.removeItem("lastUsedUser");

      router.replace("/login");
    } catch (error) {
      console.error("Logout Failed:", error);
      Alert.alert("Logout Failed", error.message);
    }
  };

  // Load saved accounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await AsyncStorage.getItem("savedUsers");
        if (users) {
          setSavedUsers(JSON.parse(users));
        }
      } catch (err) {
        console.error("Error loading saved users:", err);
      }
    };
    fetchUsers();
  }, []);


  // helper: profile image fallback
  const getProfileImageSource = (profilePic) => {
    if (profilePic) {
      return { uri: profilePic };
    }
    return require("../../../assets/profile/defaultUser.png");
  };

  return (
    <CustomBgColor>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingsItem
            icon={<Ionicons name="person-outline" size={22} color="#333" />}
            label="Account information"
            onPress={() => router.push("/Main/profile/accountInfo")}
          />
          <SettingsItem
            icon={
              <Ionicons name="lock-closed-outline" size={22} color="#333" />
            }
            label="Password"
            onPress={() => router.push("/Main/profile/changePassword")}
          />
        </View>

        {/* Support & About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <SettingsItem
            icon={
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#333"
              />
            }
            label="About PACAFACO"
          />
        </View>

        {/* Login Section */}
        <Text style={styles.sectionTitle}>Login</Text>
        <View style={styles.card}>
          {/* Logout */}
          <SettingsItem
            icon={<Ionicons name="log-out-outline" size={22} color="#333" />}
            label="Logout"
            onPress={() => setLogoutModalVisible(true)}
          />
        </View>

        <Text style={styles.footer}>v.1 (2025)</Text>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.logoutOverlay}>
          <View style={styles.logoutModal}>
            <Ionicons
              name="log-out-outline"
              size={40}
              color="#008243"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.logoutTitle}>Logout</Text>
            <Text style={styles.logoutText}>
              Are you sure you want to log out?
            </Text>

            <View style={styles.logoutButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 0.45 }]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, { flex: 0.45 }]}
                onPress={async () => {
                  setLogoutModalVisible(false);
                  await handleLogout();
                }}
              >
                <Text style={styles.confirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CustomBgColor>
  );
};

// Reusable list item
const SettingsItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <View style={styles.itemLeft}>
      {icon}
      <Text style={styles.itemText}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward-outline" size={20} color="#555" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#555",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 4,
    marginBottom: 20,
    elevation: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  itemText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    marginLeft: 12,
    color: "#333",
  },
  itemRight: { flexDirection: "row", alignItems: "center", gap: 10 },

  // ✅ Bigger profile image in Settings list
  profileImage: { width: 36, height: 36, borderRadius: 18 },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#555",
    marginVertical: 30,
  },

  // Bottom Modal Styles
  bottomModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#333",
  },
  modalList: { paddingBottom: 20 },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  modalItemLeft: { flexDirection: "row", alignItems: "center" },
  modalItemText: {
    marginLeft: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#333",
  },

  modalProfileImage: { width: 40, height: 40, borderRadius: 20 },
  addAccount: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#008243",
    justifyContent: "center",
    alignItems: "center",
  },
  addAccountText: {
    marginLeft: 12,
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#008243",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  logoutOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoutModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "90%",
    elevation: 10,
  },
  logoutTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 6,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    textAlign: "center",
    marginBottom: 20,
  },
  logoutButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#888",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#008243",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  confirmText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
});

export default Settings;
