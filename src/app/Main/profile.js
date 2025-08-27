import React, { useState } from "react";

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../components/customBgColor";
import { Ionicons, Feather, Entypo } from "@expo/vector-icons";

const Profile = () => {
  // States for user info
  const [name, setName] = useState("Cha Lusterio");
  const [birthdate, setBirthdate] = useState("2000-01-01");
  const [address, setAddress] = useState("#108, Nazareth");

  const [email, setEmail] = useState("cha@email.com");
  const [phone, setPhone] = useState("0912 345 6789");

  // Password-related states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  

  const [editingSection, setEditingSection] = useState(null);

  const handleSave = () => {
    setEditingSection(null);
  };

  // 🔧 Inserted functions to handle send logic
  const handleSendCurrent = (password) => {
    console.log("Sending current password:", password);
  };

  const handleSendNew = (password) => {
    console.log("Sending new password:", password);
  };

  const handleSendRetype = (password) => {
    console.log("Sending retype password:", password);
  };

  return (
    <CustomBgColor>
      <SafeAreaProvider>
        <SafeAreaView style={styles.SafeAreaView}>
          <View style={styles.container}>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.userInfo}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.points}>
                  Your Total Points: <Text style={styles.bold}>500</Text>
                </Text>
              </View>
            </View>

            {editingSection ? (
              <View style={styles.editForm}>
                {editingSection === "General info" && (
                  <>
                     <Text style={styles.label}>Full Name</Text>
    <View style={styles.infoRow}>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
    </View>

    <Text style={styles.label}>Birthday</Text>
    <View style={styles.infoRow}>
      <TextInput
        value={birthdate}
        onChangeText={setBirthdate}
        style={styles.input}
        placeholder="YYYY-MM-DD"
      />
    </View>
    <Text style={styles.label}>Address</Text>
    <View style={styles.infoRow}>
      <TextInput
        value={address}
        onChangeText={setAddress}
        style={styles.input}
        placeholder="Enter your address"
      />
    </View>
  </>
)}
                {editingSection === "Password" && (
                  <>
          
          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
  value={currentPassword}
  onChangeText={setCurrentPassword}
  onBlur={() => handleSendCurrent(currentPassword)}
  style={styles.input}
  secureTextEntry={!showCurrentPassword}
  autoComplete="current-password"      // <--- ADD THIS

/>
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showCurrentPassword ? "eye-off" : "eye"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>New Password</Text>
<View style={styles.passwordRow}>
  <TextInput
  style={styles.input}
  secureTextEntry={!showNewPassword}
  value={newPassword}
  onChangeText={setNewPassword}
  placeholder=""
  onBlur={() => handleSendNew(newPassword)}
  autoComplete="new-password"          // <--- ADD THIS
  textContentType="newPassword"        // <--- ADD THIS
/>
  <TouchableOpacity
    onPress={() => setShowNewPassword(!showNewPassword)}
    style={styles.eyeIcon}
  >
    <Ionicons
      name={showNewPassword ? "eye" : "eye-off"}
      size={20}
      color="gray"
    />
  </TouchableOpacity>
</View>



          <Text style={styles.label}>Retype New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
  value={retypePassword}
  onChangeText={setRetypePassword}
  onBlur={() => handleSendRetype(retypePassword)}
  style={styles.input}
  secureTextEntry={!showRetypePassword}
  autoComplete="new-password"          // <--- ADD THIS
  textContentType="newPassword"        // <--- ADD THIS
/>
            <TouchableOpacity
              onPress={() => setShowRetypePassword(!showRetypePassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showRetypePassword ? "eye" : "eye-off"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>

                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </>
                )}

{editingSection === "Contact info" && (
  <>
    <Text style={styles.label}>Phone</Text>
    <View style={styles.infoRow}>
      <Feather name="phone" size={20} style={styles.icon} />
      <TextInput
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
        placeholder=""
      />
    </View>

    <Text style={styles.label}>Email</Text>
    <View style={styles.infoRow}>
      <Entypo name="email" size={20} style={styles.icon} />
      <TextInput
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
        placeholder="email address"
      />
    </View>
  </>
)}

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Account Details</Text>

                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => setEditingSection("General info")}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    style={styles.icon}
                  />
                  <Text style={styles.itemText}>General info</Text>
                  <Feather name="chevron-right" size={20} style={styles.arrow} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => setEditingSection("Password")}
                >
                  <Feather name="lock" size={20} style={styles.icon} />
                  <Text style={styles.itemText}>Password</Text>
                  <Feather name="chevron-right" size={20} style={styles.arrow} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => setEditingSection("Contact info")}
                >
                  <Entypo name="email" size={20} style={styles.icon} />
                  <Text style={styles.itemText}>Contact info</Text>
                  <Feather name="chevron-right" size={20} style={styles.arrow} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: "#A6D97B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  points: {
    fontSize: 14,
    color: "#000",
  },
  bold: {
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  icon: {
    marginRight: 15,
    color: "#333",
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  arrow: {
    color: "#888",
  },
  editForm: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    width: "90%",
    alignSelf: "center",
    maxWidth: 400,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 5,
    fontSize: 14,
  },
  input: {
  flex: 1,
  padding: 10,
  outlineWidth: 0,
},
  saveBtn: {
    backgroundColor: "#A6D97B",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: {
    fontWeight: "bold",
    color: "#000",
  },
  // ...existing styles...
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
// ...existing styles...
  passwordRow: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ccc',
  paddingHorizontal: 10,
  borderRadius: 8,
  marginBottom: 15,
},

eyeIcon: {
  padding: 8,
},

  forgotText: {
    color: "gray",
    fontSize: 15,
    marginTop: -10,
    marginBottom: 20,
    alignSelf: "flex-end",
  },
});

export default Profile;
