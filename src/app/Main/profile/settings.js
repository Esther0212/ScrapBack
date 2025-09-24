import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import CustomBgColor from "../../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, signOut } from "firebase/auth"; 
import { useRouter } from "expo-router";

const Settings = () => {
  const router = useRouter();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login"); 
    } catch (error) {
      Alert.alert("Logout Failed", error.message);
    }
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
            onPress={() => router.push("/Main/profile/accountInfo")} // ✅ Navigate to Edit Profile
          />
          <SettingsItem
            icon={<Ionicons name="lock-closed-outline" size={22} color="#333" />}
            label="Password"
          />
          <SettingsItem
            icon={<Ionicons name="notifications-outline" size={22} color="#333" />}
            label="Notifications"
          />
        </View>

        {/* Support & About Section */}
        <Text style={styles.sectionTitle}>Support & About</Text>
        <View style={styles.card}>
          <SettingsItem
            icon={<Ionicons name="help-circle-outline" size={22} color="#333" />}
            label="Contact Support"
          />
          <SettingsItem
            icon={<Ionicons name="information-circle-outline" size={22} color="#333" />}
            label="About PACAFACO"
          />
        </View>

        {/* Login Section */}
        <Text style={styles.sectionTitle}>Login</Text>
        <View style={styles.card}>
          <SettingsItem
            icon={<Ionicons name="swap-horizontal-outline" size={22} color="#333" />}
            label="Switch account"
          />
          <SettingsItem
            icon={<Ionicons name="log-out-outline" size={22} color="#333" />}
            label="Logout"
            onPress={handleLogout} // ✅ Logout handler
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>v.1 (2025)</Text>
      </ScrollView>
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
  container: {
    padding: 16,
  },
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    marginLeft: 12,
    color: "#333",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#555",
    marginVertical: 30,
  },
});

export default Settings;
