import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomBgColor from "../../../components/customBgColor";
import { Menu, Provider as PaperProvider } from "react-native-paper";
import axios from "axios";
import { useUser } from "../../../context/userContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

const { width } = Dimensions.get("window");

const AccountInfo = () => {
  const { userData, setUserData } = useUser(); // context
  const [editMode, setEditMode] = useState(false);

  // Editable fields
  const [profilePic, setProfilePic] = useState(userData?.profilePic || null);
  const [firstName, setFirstName] = useState(userData?.firstName || "");
  const [lastName, setLastName] = useState(userData?.lastName || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [contact, setContact] = useState(userData?.contact || "");
  const [gender, setGender] = useState(userData?.gender || "Male");
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);
  const [dob, setDob] = useState(userData?.dob || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [street, setStreet] = useState(userData?.address?.street || "");
  const [barangay, setBarangay] = useState(
    userData?.address?.barangay ? { name: userData.address.barangay } : null
  );
  const [barangays, setBarangays] = useState([]);
  const [barangayMenuVisible, setBarangayMenuVisible] = useState(false);

  // Modal state
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Load barangays from API
  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const res = await axios.get(
          "https://psgc.gitlab.io/api/cities-municipalities/104305000/barangays/"
        );
        setBarangays(res.data);
      } catch (err) {
        console.error("Error fetching barangays:", err);
      }
    };
    fetchBarangays();
  }, []);

  // Pick profile picture
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
      setProfileModalVisible(false);
    }
  };

  // Remove profile picture
  const removeImage = () => {
    setProfilePic(null);

    if (userData?.uid) {
      const userRef = doc(db, "user", userData.uid);
      updateDoc(userRef, { profilePic: "" });

      setUserData({
        ...userData,
        profilePic: "",
      });
    }

    setProfileModalVisible(false);
  };

  // Format DOB
  const formatDOB = (dobValue) => {
    if (!dobValue) return "";
    const date = new Date(dobValue);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Save updates
  const handleSave = async () => {
    try {
      if (!userData?.uid) return;

      // Default address values if missing
      const updatedAddress = {
        street,
        region: userData?.address?.region || "Northern Mindanao",
        province: userData?.address?.province || "Misamis Oriental",
        city: userData?.address?.city || "City of Cagayan De Oro",
        barangay: barangay ? barangay.name : "",
        postalCode: userData?.address?.postalCode || "9000",
      };

      const userRef = doc(db, "user", userData.uid);
      await updateDoc(userRef, {
        profilePic,
        firstName,
        lastName,
        email,
        contact,
        gender,
        dob,
        address: updatedAddress,
      });

      // Update context
      setUserData({
        ...userData,
        profilePic,
        firstName,
        lastName,
        email,
        contact,
        gender,
        dob,
        address: updatedAddress,
      });

      Alert.alert("Success", "Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  // Cancel edits
  const handleCancel = () => {
    setProfilePic(userData?.profilePic || null);
    setFirstName(userData?.firstName || "");
    setLastName(userData?.lastName || "");
    setEmail(userData?.email || "");
    setContact(userData?.contact || "");
    setGender(userData?.gender || "Male");
    setDob(userData?.dob || "");
    setStreet(userData?.address?.street || "");
    setBarangay(
      userData?.address?.barangay ? { name: userData.address.barangay } : null
    );
    setEditMode(false);
  };

  return (
    <PaperProvider>
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
              {/* Profile Image */}
              <View style={styles.imageWrapper}>
                <TouchableOpacity
                  onPress={() => editMode && setProfileModalVisible(true)}
                >
                  <Image
                    source={
                      profilePic
                        ? { uri: profilePic }
                        : require("../../../assets/profile/defaultUser.png")
                    }
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
                {editMode && (
                  <TouchableOpacity
                    style={styles.editIconWrapper}
                    onPress={() => setProfileModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Modal for profile picture */}
              <Modal
                visible={profileModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setProfileModalVisible(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  onPress={() => setProfileModalVisible(false)}
                  activeOpacity={1}
                >
                  <View style={styles.modalContent}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={pickImage}
                    >
                      <Text style={styles.modalButtonText}>
                        Choose Profile Picture
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={removeImage}
                    >
                      <Text style={styles.modalButtonText}>
                        Remove Profile Picture
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>

              {/* First & Last Name */}
              <View style={styles.row}>
                <InputField
                  label="First Name"
                  value={firstName}
                  setValue={setFirstName}
                  editable={editMode}
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <InputField
                  label="Last Name"
                  value={lastName}
                  setValue={setLastName}
                  editable={editMode}
                  containerStyle={{ flex: 1, marginLeft: 8 }}
                />
              </View>

              {/* Email & Contact */}
              <InputField
                label="Email"
                value={email}
                setValue={setEmail}
                editable={editMode}
              />
              <InputField
                label="Contact Number"
                value={contact}
                setValue={setContact}
                editable={editMode}
              />

              {/* Gender */}
              <DropdownField
                label="Gender"
                visible={genderMenuVisible}
                setVisible={setGenderMenuVisible}
                selected={gender}
                setSelected={setGender}
                options={["Male", "Female", "Other"]}
                editable={editMode}
              />

              {/* DOB */}
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => editMode && setShowDatePicker(true)}
                  disabled={!editMode} // disables all touch
                >
                  <Text
                    style={{
                      color: editMode ? "#3A2E2E" : "#777",
                      fontSize: 16,
                    }}
                  >
                    {formatDOB(dob) || "Select Date"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    mode="date"
                    display="default"
                    value={dob ? new Date(dob) : new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setDob(selectedDate.toISOString());
                    }}
                  />
                )}
              </View>

              {/* Address */}
              <Text style={styles.label}>Address</Text>
              <InputField
                label="Street, Building, House No., etc."
                value={street}
                setValue={setStreet}
                editable={editMode}
                subLabel
              />
              <InputField
                label="Region"
                value={userData?.address?.region || "Northern Mindanao"}
                editable={false}
                subLabel
              />
              <InputField
                label="Province"
                value={userData?.address?.province || "Misamis Oriental"}
                editable={false}
                subLabel
              />
              <InputField
                label="City"
                value={userData?.address?.city || "City of Cagayan De Oro"}
                editable={false}
                subLabel
              />

              {/* Barangay */}
              <DropdownField
                label="Barangay"
                visible={barangayMenuVisible}
                setVisible={setBarangayMenuVisible}
                selected={barangay ? barangay.name : ""}
                setSelected={setBarangay}
                options={barangays}
                optionKey="name"
                editable={editMode}
                subLabel
              />

              {/* Postal Code */}
              <InputField
                label="Postal Code"
                value={userData?.address?.postalCode || "9000"}
                editable={false}
                subLabel
              />

              {/* Buttons */}
              {editMode ? (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    style={[styles.cancelButton, { flex: 0.48 }]}
                    onPress={handleCancel}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { flex: 0.48 }]}
                    onPress={handleSave}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.saveText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditMode(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="pencil" size={20} color="#fff" />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </CustomBgColor>
    </PaperProvider>
  );
};

// Input Field
const InputField = ({
  label,
  value,
  setValue,
  editable = false,
  containerStyle,
  subLabel,
}) => (
  <View style={[styles.inputContainer, containerStyle]}>
    <Text style={subLabel ? styles.subLabel : styles.label}>{label}</Text>
    <TextInput
      value={value}
      editable={editable}
      onChangeText={setValue}
      style={[styles.input, { color: editable ? "#3A2E2E" : "#777" }]}
    />
  </View>
);

// Dropdown Field
const DropdownField = ({
  label,
  visible,
  setVisible,
  selected,
  setSelected,
  options,
  optionKey,
  editable = false,
  subLabel,
}) => (
  <View style={styles.inputContainer}>
    <Text style={subLabel ? styles.subLabel : styles.label}>{label}</Text>
    <Menu
      visible={visible && editable}
      onDismiss={() => setVisible(false)}
      anchor={
        <TouchableOpacity
          style={[styles.input, { alignItems: "flex-start" }]}
          onPress={editable ? () => setVisible(true) : null}
          activeOpacity={editable ? 0.7 : 1} // disables opacity change
          disabled={!editable} // disables touch entirely
        >
          <Text style={{ color: editable ? "#3A2E2E" : "#777", fontSize: 16 }}>
            {selected || `Select ${label}`}
          </Text>
        </TouchableOpacity>
      }
      contentStyle={styles.menuContent}
    >
      {options.map((o) => (
        <Menu.Item
          key={optionKey ? o.code : o}
          onPress={() => {
            setSelected(o);
            setVisible(false);
          }}
          title={optionKey ? o[optionKey] : o}
        />
      ))}
    </Menu>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20 },
  container: { flex: 1 },
  imageWrapper: {
    alignSelf: "center",
    width: width / 4,
    height: width / 4,
    borderRadius: width / 8,
    overflow: "visible",
    marginBottom: 16,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: width / 8,
    resizeMode: "cover",
  },
  editIconWrapper: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#008243",
    borderRadius: 20,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
    paddingTop: width / 4 + 80,
    alignItems: "center",
  },
  modalContent: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: { paddingVertical: 12, paddingHorizontal: 20 },
  modalButtonText: { fontSize: 16, color: "#3A2E2E" },
  row: { flexDirection: "row" },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 17, fontWeight: "700", color: "#3A2E2E", marginBottom: 6 },
  subLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#71695B",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0D4C3",
    width: "100%",
  },
  menuContent: { backgroundColor: "#F1E3D3", borderRadius: 12 },
  editButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#008243",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: "#008243",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    alignItems: "center",
    marginBottom: 30,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelButton: {
    backgroundColor: "#888",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    alignItems: "center",
    marginBottom: 30,
  },
  cancelText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

export default AccountInfo;
