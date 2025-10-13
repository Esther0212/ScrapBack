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
      // 👇 Mark user offline in Firestore before logging out
      await updateDoc(doc(db, "user", user.uid), {
        online: false,
        lastActive: serverTimestamp(),
      });
      console.log("✅ Marked user offline before logout");
    }

    // 🔐 Now sign them out from Firebase
    await signOut(auth);

    // 🧹 Optional: clear any locally stored session
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

  const handleSwitch = async (user) => {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );

      await AsyncStorage.setItem("lastUsedUser", JSON.stringify(user));

      Alert.alert(
        "Switch Account",
        `Now logged in as ${user.firstName} ${user.lastName}`
      );

      setModalVisible(false);
      router.replace("/Main");
    } catch (error) {
      Alert.alert("Switch Failed", error.message);
    }
  };

  const handleRemoveAccount = async (uid) => {
    try {
      const users = JSON.parse(await AsyncStorage.getItem("savedUsers")) || [];
      const updatedUsers = users.filter((u) => u.uid !== uid);
      await AsyncStorage.setItem("savedUsers", JSON.stringify(updatedUsers));
      setSavedUsers(updatedUsers);
      Alert.alert("Removed", "Account has been removed from switch list.");
    } catch (err) {
      console.error("Error removing user:", err);
      Alert.alert("Error", "Failed to remove account. Please try again.");
    }
  };

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
          <SettingsItem
            icon={
              <Ionicons name="notifications-outline" size={22} color="#333" />
            }
            label="Notifications"
          />
        </View>

        {/* Support & About Section */}
        <Text style={styles.sectionTitle}>Support & About</Text>
        <View style={styles.card}>
          <SettingsItem
            icon={
              <Ionicons name="help-circle-outline" size={22} color="#333" />
            }
            label="Contact Support"
          />
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
          {/* Switch Account */}
          <TouchableOpacity
            style={styles.item}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.itemLeft}>
              <Ionicons name="swap-horizontal-outline" size={22} color="#333" />
              <Text style={styles.itemText}>Switch account</Text>
            </View>
            <View style={styles.itemRight}>
              <Image
                source={getProfileImageSource(userData?.profilePic)}
                style={styles.profileImage}
              />
              <Ionicons name="chevron-forward-outline" size={20} color="#555" />
            </View>
          </TouchableOpacity>

          {/* Logout */}
          <SettingsItem
            icon={<Ionicons name="log-out-outline" size={22} color="#333" />}
            label="Logout"
            onPress={() => setLogoutModalVisible(true)}
          />
        </View>

        <Text style={styles.footer}>v.1 (2025)</Text>
      </ScrollView>

      {/* Bottom Modal for Switch Account */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.bottomModalOverlay}>
          <View style={styles.bottomModalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch account</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalList}>
              {/* Current User */}
              {userData && (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSwitch(userData)}
                >
                  <View style={styles.modalItemLeft}>
                    <Image
                      source={getProfileImageSource(userData.profilePic)}
                      style={styles.modalProfileImage}
                    />
                    <Text style={styles.modalItemText}>
                      {userData.firstName} {userData.lastName}
                    </Text>
                  </View>
                  <Feather name="check" size={22} color="green" />
                </TouchableOpacity>
              )}

              {/* Other Saved Users */}
              {savedUsers
                .filter((u) => u.uid !== userData?.uid)
                .map((user, i) => (
                  <View key={i} style={styles.modalItem}>
                    <TouchableOpacity
                      style={styles.modalItemLeft}
                      onPress={() => handleSwitch(user)}
                    >
                      <Image
                        source={getProfileImageSource(user.profilePic)}
                        style={styles.modalProfileImage}
                      />
                      <Text style={styles.modalItemText}>
                        {user.firstName} {user.lastName}
                      </Text>
                    </TouchableOpacity>

                    {/* 🗑 Remove Button */}
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          "Remove Account",
                          `Remove ${user.firstName} ${user.lastName} from list?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Remove",
                              style: "destructive",
                              onPress: () => handleRemoveAccount(user.uid),
                            },
                          ]
                        )
                      }
                    >
                      <Feather name="trash-2" size={20} color="#b00020" />
                    </TouchableOpacity>
                  </View>
                ))}

              {/* Add Account */}
              <TouchableOpacity
                style={styles.addAccount}
                onPress={() => {
                  setModalVisible(false);
                  router.push("/Main/profile/switchAccount");
                }}
              >
                <View style={styles.addCircle}>
                  <Feather name="plus" size={24} color="white" />
                </View>
                <Text style={styles.addAccountText}>Add account</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
