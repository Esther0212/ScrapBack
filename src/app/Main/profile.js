import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, Feather, Entypo } from "@expo/vector-icons";
import CustomBgColor from "../../components/customBgColor";

import { auth, db, storage } from "../../../firebase"; 
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";  
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import * as FileSystem from 'expo-file-system';


const Profile = () => {
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [points, setPoints] = useState(0);
  const [profilePic, setProfilePic] = useState(require("../../assets/profile/blank-dp.png"));

  // Modal and image
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileOptionsVisible, setProfileOptionsVisible] = useState(false);
  const [tempProfile, setTempProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "user", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || "");
          setBirthdate(data.birthdate || "");
          setAddress(data.address || "");
          setEmail(data.email || user.email);
          setPhone(data.contact || "");   
          setPoints(data.points || 0);

          if (data.profilePic) {
            // Check if it's Base64 or URL
            if (data.profilePic.startsWith("data:")) {
              setProfilePic({ uri: data.profilePic });
            } else {
              setProfilePic({ uri: `data:image/jpeg;base64,${data.profilePic}` });
            }
          }
        }
      } catch (error) {
        console.log("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  // Pick image from library
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Camera roll permission is required to change profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setTempProfile(result.assets[0].uri);
        setProfileModalVisible(true);
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  // Upload profile picture to Firebase Storage
  const handleProfileSave = async () => {
    if (!tempProfile) return;
    setUploading(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Convert image to Base64
      const base64 = await FileSystem.readAsStringAsync(tempProfile, { encoding: FileSystem.EncodingType.Base64 });

      const userRef = doc(db, "user", user.uid);

      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, { profilePic: base64 });
      } else {
        await setDoc(userRef, {
          name: user.displayName || "",
          email: user.email,
          profilePic: base64,
          createdAt: new Date(),
        });
      }

      // Update local state
      setProfilePic({ uri: `data:image/jpeg;base64,${base64}` });
      setTempProfile(null);
      setProfileModalVisible(false);

      Alert.alert("Success", "Profile picture saved successfully!");
    } catch (error) {
      console.log("🔥 Profile upload error:", error);
      Alert.alert("Error", "Failed to save profile picture. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // Open edit modal
  const openEditModal = (section) => {
    setEditingSection(section);
    setModalVisible(true);
  };

  // Handle password change
  const handlePasswordChange = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      if (newPassword !== retypePassword) {
        Alert.alert("Error", "Passwords do not match!");
        return;
      }

      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password updated successfully!");
      setModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setRetypePassword("");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update password. Check current password.");
    }
  };

  // Save general/contact info
  const handleSave = async () => {
    if (editingSection === "Password") {
      await handlePasswordChange();
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "user", user.uid);
      const updateData = {};

      if (editingSection === "General info") {
        updateData.name = name;
        updateData.birthdate = birthdate;
        updateData.address = address;
      } else if (editingSection === "Contact info") {
        updateData.contact = phone;   
        updateData.email = email;

        if (!phone) delete updateData.contact;
      }


      await updateDoc(userRef, updateData);
      Alert.alert("Success", "Profile updated successfully!");
      setModalVisible(false);
      setEditingSection(null);
    } catch (error) {
      console.log("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile info.");
    }
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (date) => {
    const formatted = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    setBirthdate(formatted);
    hideDatePicker();
  };

  return (
    <CustomBgColor>
      <SafeAreaProvider>
        <SafeAreaView style={styles.SafeAreaView}>
          <ScrollView contentContainerStyle={styles.container}>
            {/* Profile Header */}
            <View style={styles.profileCard}>
              <View style={styles.userRow}>
                <TouchableOpacity onPress={pickImage}>
                  <Image source={profilePic} style={styles.profileImage} />
                  <View style={styles.editIcon}>
                    <Ionicons name="camera" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
                <View style={styles.userInfo}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.points}>
                    Total Points: <Text style={styles.bold}>{points}</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Account Details */}
            <Text style={styles.sectionTitle}>Account Details</Text>
            <TouchableOpacity style={styles.listItem} onPress={() => openEditModal("General info")}>
              <Ionicons name="person-outline" size={20} style={styles.icon} />
              <Text style={styles.itemText}>General info</Text>
              <Feather name="chevron-right" size={20} style={styles.arrow} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.listItem} onPress={() => openEditModal("Password")}>
              <Feather name="lock" size={20} style={styles.icon} />
              <Text style={styles.itemText}>Password</Text>
              <Feather name="chevron-right" size={20} style={styles.arrow} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.listItem} onPress={() => openEditModal("Contact info")}>
              <Entypo name="email" size={20} style={styles.icon} />
              <Text style={styles.itemText}>Contact info</Text>
              <Feather name="chevron-right" size={20} style={styles.arrow} />
            </TouchableOpacity>

            {/* Edit Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
              <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {editingSection === "General info" && (
                      <>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} />
                        <Text style={styles.label}>Birthday</Text>
                        <TouchableOpacity style={styles.input} onPress={showDatePicker}>
                          <Text>{birthdate || "Select date"}</Text>
                        </TouchableOpacity>
                        <Text style={styles.label}>Address</Text>
                        <TextInput style={styles.input} value={address} onChangeText={setAddress} />
                      </>
                    )}

                    {editingSection === "Password" && (
                      <>
                        <Text style={styles.label}>Current Password</Text>
                        <View style={styles.passwordRow}>
                          <TextInput
                            style={styles.passwordInput}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showCurrentPassword}
                          />
                          <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                            <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={22} color="gray" />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.passwordRow}>
                          <TextInput
                            style={styles.passwordInput}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                          />
                          <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                            <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={22} color="gray" />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Retype New Password</Text>
                        <View style={styles.passwordRow}>
                          <TextInput
                            style={styles.passwordInput}
                            value={retypePassword}
                            onChangeText={setRetypePassword}
                            secureTextEntry={!showRetypePassword}
                          />
                          <TouchableOpacity onPress={() => setShowRetypePassword(!showRetypePassword)}>
                            <Ionicons name={showRetypePassword ? "eye-off" : "eye"} size={22} color="gray" />
                          </TouchableOpacity>
                        </View>
                      </>
                    )}

                    {editingSection === "Contact info" && (
                      <>
                        <Text style={styles.label}>Phone</Text>
                        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                        <Text style={styles.label}>Email</Text>
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
                      </>
                    )}

                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: "#ccc" }]}
                        onPress={() => { setModalVisible(false); setEditingSection(null); }}
                      >
                        <Text style={styles.saveText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Profile Picture Modal */}
            <Modal visible={profileModalVisible} transparent animationType="slide">
              <View style={styles.modalBackground}>
                <View style={{ width: "90%", backgroundColor:"#fff", borderRadius: 15, padding: 20, alignItems:"center" }}>
                  
                  {/* Tap image to pick a new one */}
                  {tempProfile && (
                    <TouchableOpacity onPress={pickImage}>
                      <Image source={{ uri: tempProfile }} style={{ width: 250, height: 250, borderRadius: 125 }} />
                    </TouchableOpacity>
                  )}

                  {/* Upload indicator */}
                  {uploading && <ActivityIndicator size="large" color="#A6D97B" style={{ marginTop: 15 }} />}

                  {/* Buttons */}
                  <View style={{ flexDirection: "row", marginTop: 20, width: "100%" }}>
                    <TouchableOpacity
                      style={{ flex: 1, marginRight: 5, backgroundColor: "#ccc", padding: 12, borderRadius: 10, alignItems: "center" }}
                      onPress={() => { setProfileModalVisible(false); setTempProfile(null); }}
                      disabled={uploading}
                    >
                      <Text>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, marginLeft: 5, backgroundColor: "#A6D97B", padding: 12, borderRadius: 10, alignItems: "center" }}
                      onPress={handleProfileSave}
                      disabled={uploading}
                    >
                      <Text>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>



            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirmDate}
              onCancel={hideDatePicker}
              maximumDate={new Date()}
            />

          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  SafeAreaView: { flex: 1 },
  container: { flexGrow: 1, padding: 20, backgroundColor: "transparent" },
  profileCard: { 
    backgroundColor: "#A6D97B", 
    borderRadius: 15, 
    padding: 20, 
    marginBottom: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userRow: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 70, height: 70, borderRadius: 35, marginRight: 15 },
  userInfo: { flex: 1 },
  name: { fontWeight: "bold", fontSize: 18, marginBottom: 4, color: "#000" },
  points: { fontSize: 14, color: "#333" },
  bold: { fontWeight: "bold" },
  sectionTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 12 },
  listItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#FFF", 
    paddingVertical: 14, 
    paddingHorizontal: 12, 
    borderRadius: 10, 
    marginBottom: 12, 
    elevation: 2,
  },
  icon: { marginRight: 15, color: "#333" },
  itemText: { flex: 1, fontSize: 15, color: "#333" },
  arrow: { color: "#888" },
  input: { 
    flex: 1, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    marginBottom: 15, 
    backgroundColor: "#fff" 
  },
  passwordRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    marginBottom: 15, 
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  passwordInput: { flex: 1, paddingVertical: 10 },
  saveBtn: { 
    backgroundColor: "#A6D97B", 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: "center", 
    flex: 1, 
    marginHorizontal: 5 
  },
  saveText: { fontWeight: "bold", color: "#000" },
  label: { fontWeight: "bold", marginBottom: 6, fontSize: 14 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 10 },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 15, width: "100%", maxWidth: 420, elevation: 6 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  editIcon: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#008243", borderRadius: 12, padding: 4 },
});

export default Profile;