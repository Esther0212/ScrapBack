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
  FlatList,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome, AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomBgColor from "../../../components/customBgColor";
import { Menu } from "react-native-paper";
import axios from "axios";
import { useUser } from "../../../context/userContext";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Animated, Easing } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");

const AccountInfo = () => {
  const { userData, setUserData } = useUser();
  const [editMode, setEditMode] = useState(false);

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

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Toast + Confirmation modal states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [isSaving, setIsSaving] = useState(false);

  const [mapRegion, setMapRegion] = useState(null);
  const [marker, setMarker] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [initialCoordsSet, setInitialCoordsSet] = useState(false);
  const [prevStreet, setPrevStreet] = useState(userData?.address?.street || "");
  const [prevBarangay, setPrevBarangay] = useState(userData?.address?.barangay || "");

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

  const uploadImageToStorage = async (uri, uid) => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(storage, `profilePictures/${uid}.jpg`);
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      setUploading(false);
      return downloadURL;
    } catch (err) {
      setUploading(false);
      console.error("Error uploading image:", err);
      return null;
    }
  };

  const removeImage = async () => {
    if (!userData?.uid) return;
    const userRef = doc(db, "user", userData.uid);

    // ✅ set profilePic to null instead of ""
    await updateDoc(userRef, { profilePic: null });

    setUserData({ ...userData, profilePic: null });
    setProfilePic(null);
    setProfileModalVisible(false);
  };

  const formatDOB = (dobValue) => {
    if (!dobValue) return "";
    const date = new Date(dobValue);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const handleSave = async () => {
    try {
      if (!userData?.uid) return;

      setIsSaving(true); // ✅ start loading spinner

      let finalProfilePic = profilePic;

      // if new local image, upload to Firebase Storage
      if (profilePic && profilePic.startsWith("file://")) {
        const uploadedUrl = await uploadImageToStorage(
          profilePic,
          userData.uid
        );
        if (uploadedUrl) finalProfilePic = uploadedUrl;
      }

      const updatedAddress = {
        street,
        region: userData?.address?.region || "Northern Mindanao",
        province: userData?.address?.province || "Misamis Oriental",
        city: userData?.address?.city || "City of Cagayan De Oro",
        barangay: barangay ? barangay.name : "",
        postalCode: userData?.address?.postalCode || "9000",
      };

      const userRef = doc(db, "user", userData.uid);
      const userLocation = marker
        ? { lat: marker.latitude, lng: marker.longitude }
        : userData?.location || null;

      await updateDoc(userRef, {
        profilePic: finalProfilePic || null,
        firstName,
        lastName,
        email,
        contact,
        gender,
        dob,
        address: updatedAddress,
        location: userLocation, // ✅ save pinpointed lat/lng
      });

      setUserData({
        ...userData,
        profilePic: finalProfilePic || "",
        firstName,
        lastName,
        email,
        contact,
        gender,
        dob,
        address: updatedAddress,
        location: userLocation,
      });

      // keep internal tracking in sync to avoid stale geocoding/initial coords
      setPrevStreet(street);
      setPrevBarangay(barangay?.name || "");
      setInitialCoordsSet(true);

      // ✅ Success toast animation
      setToastMessage("Profile updated successfully!");
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

      setEditMode(false);
    } catch (err) {
      console.error(err);
      setToastMessage("Failed to update profile.");
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2500);
    } finally {
      setIsSaving(false); // ✅ stop spinner
    }
  };

  useEffect(() => {
    const fetchInitialCoords = async () => {
      try {
        // 🧭 1️⃣ Use saved coordinates if available (and not yet set)
        if (userData?.location && !initialCoordsSet) {
          const { lat, lng } = userData.location;
          setMapRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setMarker({ latitude: lat, longitude: lng });
          setInitialCoordsSet(true);
          console.log("📍 Loaded saved coordinates from Firestore");
          return; // ✅ Exit early, don’t geocode automatically
        }

        // 🧭 2️⃣ Only run geocode if the user *really* changed address fields
        const barangayChanged = barangay?.name !== prevBarangay;
        const streetChanged = street !== prevStreet;

        if (!barangayChanged && !streetChanged) return; // ⛔ no changes, do nothing
        if (!street && !barangay?.name) return; // ⛔ invalid address fields

        let geocode = [];
        let tried = "";

        // 3️⃣ Try Street + Barangay first
        if (street && barangay?.name) {
          const address = `${street}, ${barangay.name}, ${userData?.address?.city || "City of Cagayan De Oro"
            }, ${userData?.address?.province || "Misamis Oriental"}, ${userData?.address?.region || "Northern Mindanao"
            }, Philippines`;
          geocode = await Location.geocodeAsync(address);
          tried = "Street + Barangay";
        }

        // 4️⃣ Try Street only
        if ((!geocode || geocode.length === 0) && street) {
          const address = `${street}, ${userData?.address?.city || "City of Cagayan De Oro"
            }, ${userData?.address?.province || "Misamis Oriental"}, ${userData?.address?.region || "Northern Mindanao"
            }, Philippines`;
          geocode = await Location.geocodeAsync(address);
          tried = "Street only";
        }

        // 5️⃣ Try Barangay only
        if ((!geocode || geocode.length === 0) && barangay?.name) {
          const address = `${barangay.name}, ${userData?.address?.city || "City of Cagayan De Oro"
            }, ${userData?.address?.province || "Misamis Oriental"}, ${userData?.address?.region || "Northern Mindanao"
            }, Philippines`;
          geocode = await Location.geocodeAsync(address);
          tried = "Barangay only";
        }

        // ✅ Update only if we got coordinates
        if (geocode.length > 0) {
          const { latitude, longitude } = geocode[0];
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setMarker({ latitude, longitude });
          setPrevStreet(street);
          setPrevBarangay(barangay?.name || "");
          console.log(`📍 Updated via geocoding (${tried})`);
        }
      } catch (err) {
        console.error("Error fetching geocode:", err);
      }
    };

    fetchInitialCoords();
  }, [barangay, street]);

  // Ensure map centers / focuses on the current user's saved pinpoint when entering edit mode
  useEffect(() => {
    if (!editMode) return;
    if (userData?.location) {
      const { lat, lng } = userData.location;
      // avoid unnecessary updates/flicker
      if (!marker || marker.latitude !== lat || marker.longitude !== lng) {
        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setMarker({ latitude: lat, longitude: lng });
        setInitialCoordsSet(true);
        console.log("📍 Focused map on saved user location");
      }
    }
  }, [editMode, userData?.location]);

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
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <View style={styles.imageWrapper}>
              <TouchableOpacity
                disabled={!editMode}
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
                >
                  <Ionicons name="pencil" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Profile Modal */}
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

            {uploading && (
              <ActivityIndicator
                size="large"
                color="#008243"
                style={{ marginBottom: 10 }}
              />
            )}
            {/* Confirmation Modal */}
            <Modal
              visible={confirmModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setConfirmModalVisible(false)}
            >
              <View style={styles.modalOverlayCenter}>
                <View style={styles.confirmModal}>
                  <Text style={styles.confirmTitle}>Confirm Changes</Text>
                  <Text style={styles.confirmText}>
                    Are you sure you want to save these changes to your profile?
                  </Text>

                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={[styles.cancelButton, { flex: 0.45 }]}
                      onPress={() => setConfirmModalVisible(false)}
                    >
                      <Text style={styles.cancelText}>No</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        { flex: 0.45, opacity: isSaving ? 0.7 : 1 },
                      ]}
                      onPress={async () => {
                        if (isSaving) return;
                        setIsSaving(true); // show spinner right away
                        await handleSave();
                        setConfirmModalVisible(false); // close AFTER save
                      }}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <ActivityIndicator
                            size="small"
                            color="#fff"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.saveText}>Saving...</Text>
                        </View>
                      ) : (
                        <Text style={styles.saveText}>Yes, Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Fields */}
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
            <InputField
              label="Email"
              value={email}
              setValue={setEmail}
              editable={editMode}
            />
<InputField
  label="Contact Number"
  value={contact}
  setValue={(text) => {
    // allow only numbers and "+"
    let cleaned = text.replace(/[^0-9+]/g, "");

    // allow "+" only at the start
    if (cleaned.includes("+") && !cleaned.startsWith("+")) {
      cleaned = cleaned.replace("+", "");
    }

    // limit length: 11 for 09..., 13 for +639...
    if (cleaned.startsWith("+")) {
      if (cleaned.length <= 13) setContact(cleaned);
    } else {
      if (cleaned.length <= 11) setContact(cleaned);
    }
  }}
  keyboardType="phone-pad"
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
                disabled={!editMode}
              >
                <Text
                  style={{
                    color: editMode ? "#3A2E2E" : "#777",
                    fontSize: 15,
                    fontFamily: "Poppins_400Regular",
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
              label="Street Name, Building, House No., etc."
              value={street}
              setValue={setStreet}
              editable={editMode}
              subLabel
            />
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
            <InputField
              label="City"
              value={userData?.address?.city || "City of Cagayan De Oro"}
              editable={false}
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
              label="Postal Code"
              value={userData?.address?.postalCode || "9000"}
              editable={false}
              subLabel
            />
            {/* Map Input Field */}
            {editMode && (
              <>
                <Text style={styles.subLabel}>Pinpoint Location</Text>

                <View style={styles.mapContainer}>
                  {mapRegion && (
                    <>
                      <MapView
                        style={isMapExpanded ? styles.fullMap : styles.map}
                        region={mapRegion}
                        mapType={isSatellite ? "hybrid" : "standard"}
                        onPress={(e) => {
                          const { latitude, longitude } = e.nativeEvent.coordinate;
                          setMarker({ latitude, longitude });
                        }}
                      >
                        {marker && (
                          <Marker
                            coordinate={marker}
                            draggable
                            onDragEnd={(e) => {
                              const { latitude, longitude } = e.nativeEvent.coordinate;
                              setMarker({ latitude, longitude });
                              setMapRegion((prev) => ({
                                ...prev,
                                latitude,
                                longitude,
                              }));

                              // Optional feedback toast
                              setToastMessage("📍 Pin moved to new location");
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
                                }, 1500);
                              });
                            }}
                          />
                        )}
                      </MapView>

                      {/* 🛰 Map Type Toggle Button */}
                      <TouchableOpacity
                        style={styles.mapToggleButton}
                        onPress={() => setIsSatellite(!isSatellite)}
                      >
                        <FontAwesome
                          name={isSatellite ? "map" : "map-o"}
                          size={24}
                          color="black"
                        />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}



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
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { flex: 0.48 }]}
                  onPress={() => setConfirmModalVisible(true)}
                >
                  <Text style={styles.saveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        {toastVisible && (
          <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </CustomBgColor>
  );
};

// InputField
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

// DropdownField
const DropdownField = ({
  label,
  selected,
  setSelected,
  options,
  optionKey,
  editable = false,
  subLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // ✅ state for search

  // ✅ Filtered list (only for Barangay)
  const filteredOptions =
    label === "Barangay" && searchQuery
      ? options.filter((item) =>
        (optionKey ? item[optionKey] : item.name || item)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
      : options;

  return (
    <View style={[styles.inputContainer, { zIndex: 1000 }]}>
      <Text style={subLabel ? styles.subLabel : styles.label}>{label}</Text>

      {/* Dropdown Button */}
      <TouchableOpacity
        style={[
          styles.input,
          { flexDirection: "row", justifyContent: "space-between" },
        ]}
        onPress={() => editable && setIsOpen(!isOpen)}
        disabled={!editable}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: editable ? (selected ? "#3A2E2E" : "#777") : "#777",
            fontSize: 15,
            fontFamily: "Poppins_400Regular",
          }}
        >
          {selected || `Select ${label}`}
        </Text>
        {editable && (
          <Text style={{ color: "#3A2E2E", fontSize: 16 }}>
            {isOpen ? "▲" : "▼"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Dropdown List */}
      {isOpen && editable && (
        <View style={styles.dropdownContainer}>
          {/* ✅ Only show search bar if Barangay */}
          {label === "Barangay" && (
            <TextInput
              placeholder="Search barangay..."
              placeholderTextColor="#3A2E2E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          )}

          <ScrollView
            style={styles.dropdownList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    index !== filteredOptions.length - 1 &&
                    styles.dropdownItemBorder,
                  ]}
                  onPress={() => {
                    setSelected(optionKey ? item : item.name || item);
                    setIsOpen(false);
                    setSearchQuery(""); // ✅ clear after select
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {optionKey ? item[optionKey] : item.name || item}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noResultText}>No results found</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

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
    borderWidth: 2,
    borderColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: width / 4 + 80,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10, // ✅ Add horizontal padding instead of fixed width
    elevation: 5,
    alignSelf: "center", // ✅ Center horizontally without stretching
  },
  modalButton: { paddingVertical: 12, paddingHorizontal: 20 },
  modalButtonText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
  },
  row: { flexDirection: "row" },
  inputContainer: { marginBottom: 16 },
  label: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#71695B",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    borderWidth: 1,
    borderColor: "#E0D4C3",
    width: "100%",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0D4C3",
    zIndex: 1000,
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 10,
    maxHeight: 230, // scrollable height
    zIndex: 1000,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5D6C7", // soft beige tone to match your ScrapBack palette
  },
  searchInput: {
    backgroundColor: "#F6F6E9",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    margin: 8,
    borderWidth: 1,
    borderColor: "#E0D4C3",
  },

  noResultText: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    paddingVertical: 10,
  },

  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  dropdownItemText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
  },
  mapContainer: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0D4C3",
    height: 300,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  fullMap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  mapToggleButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    zIndex: 5,
  },

  expandButton: {
    position: "absolute",
    top: 10,
    right: 50,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    zIndex: 5,
  },

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
    fontFamily: "Poppins_700Bold",
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
  saveText: { color: "#fff", fontSize: 16, fontFamily: "Poppins_700Bold" },
  cancelButton: {
    backgroundColor: "#888",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    alignItems: "center",
    marginBottom: 30,
  },
  cancelText: { color: "#fff", fontSize: 16, fontFamily: "Poppins_700Bold" },
  dropdownText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
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
    paddingLeft: 20,
    paddingTop: 20,
    paddingRight: 20,
    width: "90%",
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 10,
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
    top: Platform.OS === "ios" ? 60 : 40, // ✅ appear near top of screen
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
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },

  toastText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    textAlign: "center",
  },
});

export default AccountInfo;
