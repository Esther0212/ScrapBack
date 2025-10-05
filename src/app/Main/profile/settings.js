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

const Settings = () => {
  const router = useRouter();
  const auth = getAuth();
  const { userData } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [savedUsers, setSavedUsers] = useState([]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
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
            onPress={handleLogout}
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
});

export default Settings;
