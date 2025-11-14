import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomBgColor from "../../../components/customBgColor";
import axios from "axios";
import { useUser } from "../../../context/userContext";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "../../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Animated } from "react-native";
import MapView, { Marker, Polygon, Polyline } from "react-native-maps";
import * as Location from "expo-location";

// 🟢 Turf for point-in-polygon
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

// 🟢 NAMRIA CDO barangay polygons (your extracted file)
import cdoGeoJSON from "../../../utils/cdo_barangays.json";

const { width } = Dimensions.get("window");

// 🗺️ Geoapify API key (for street geocoding)
const GEOAPIFY_API_KEY = "21e4ce510e324d2c81b5caa1989a69d2";

// 🔧 Helper: normalize barangay names so PSGC & NAMRIA match
const normalizeBrgyName = (name) =>
  name
    ?.toLowerCase()
    .replace(/\s*\(.*?\)/g, "") // remove parentheses e.g. (Pob.)
    .replace(/\s+/g, " ")
    .trim() || "";

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isSaving, setIsSaving] = useState(false);

  const [mapRegion, setMapRegion] = useState(null);
  const [marker, setMarker] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [initialCoordsSet, setInitialCoordsSet] = useState(false);
  const [prevStreet, setPrevStreet] = useState(userData?.address?.street || "");
  const [prevBarangay, setPrevBarangay] = useState(
    userData?.address?.barangay || ""
  );

  // 🟢 NAMRIA barangay feature + polygon + center
  const [selectedBarangayFeature, setSelectedBarangayFeature] = useState(null);
  const [barangayPolygonCoords, setBarangayPolygonCoords] = useState([]);
  const [barangayCenter, setBarangayCenter] = useState(null);
  const [lastGeocodeKey, setLastGeocodeKey] = useState(null);

  // 🔐 Only validate street-inside-barangay when barangay selection happens
  const [validationTriggered, setValidationTriggered] = useState(false);

  const [streetDebounceTimer, setStreetDebounceTimer] = useState(null);
  const [streetReady, setStreetReady] = useState(false);

  // Debounce street input
  useEffect(() => {
    if (!editMode) return;

    // Reset ready flag whenever street changes
    setStreetReady(false);

    // If there is no barangay yet → do nothing
    if (!barangay?.name) return;

    // If user clears street → do nothing
    if (!street.trim()) return;

    // Clear previous timer
    if (streetDebounceTimer) clearTimeout(streetDebounceTimer);

    // Start debounce timer
    const t = setTimeout(() => {
      setStreetReady(true);
      setValidationTriggered(true); // ⭐ automatically allow revalidation
    }, 700);

    setStreetDebounceTimer(t);

    return () => clearTimeout(t);
  }, [street]);

  // 🔔 Helper to show toast
  const showToast = (message, duration = 2000) => {
    setToastMessage(message);
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
      }, duration);
    });
  };

  // 🟢 Load barangays list from your NAMRIA GeoJSON (no more PSGC HTTP)
  useEffect(() => {
    if (cdoGeoJSON?.features?.length) {
      const uniqueNames = Array.from(
        new Set(
          cdoGeoJSON.features.map((f) => f.properties?.barangay).filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      const list = uniqueNames.map((name) => ({ name }));
      setBarangays(list);
    }
  }, []);

  useEffect(() => {
    const applyBarangaySelection = async () => {
      if (!barangay?.name || !cdoGeoJSON?.features?.length) {
        setSelectedBarangayFeature(null);
        setBarangayPolygonCoords([]);
        return;
      }

      const selectedNameNorm = normalizeBrgyName(barangay.name);

      // 1️⃣ Find NAMRIA polygon (same as before)
      const feature = cdoGeoJSON.features.find((f) => {
        const n = normalizeBrgyName(f.properties?.barangay || "");
        return n === selectedNameNorm;
      });

      setSelectedBarangayFeature(feature || null);

      // Extract polygon normally
      if (feature?.geometry?.coordinates) {
        let ring = [];

        if (feature.geometry.type === "Polygon") {
          ring = feature.geometry.coordinates[0] || [];
        } else if (feature.geometry.type === "MultiPolygon") {
          let maxLen = 0;
          feature.geometry.coordinates.forEach((poly) => {
            if (poly[0]?.length > maxLen) {
              maxLen = poly[0].length;
              ring = poly[0];
            }
          });
        }

        let closedRing = [...ring];
        if (
          closedRing.length > 0 &&
          (closedRing[0][0] !== closedRing[closedRing.length - 1][0] ||
            closedRing[0][1] !== closedRing[closedRing.length - 1][1])
        ) {
          closedRing.push(closedRing[0]);
        }

        const coords = closedRing.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));

        setBarangayPolygonCoords(coords);
      } else {
        setBarangayPolygonCoords([]);
      }

      // 2️⃣ ALWAYS GEOCODE BARANGAY NAME (map should center here)
      try {
        const brgyAddress = `${barangay.name}, Cagayan de Oro City, Philippines`;
        const brgyGeo = await Location.geocodeAsync(brgyAddress);

        if (brgyGeo && brgyGeo.length > 0) {
          const { latitude, longitude } = brgyGeo[0];

          // Center map on this barangay name (no marker)
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.0025,
            longitudeDelta: 0.0025,
          });

          // Optionally remember this as barangayCenter for later fallback
          setBarangayCenter({
            latitude,
            longitude,
          });
        }
      } catch (err) {
        console.log("Barangay geocode error:", err);
      }
    };

    applyBarangaySelection();
  }, [barangay]);

  // 🧮 Check if a point is inside selected barangay polygon
  const isInsideSelectedBarangay = (latitude, longitude, featureOverride) => {
    const feat = featureOverride || selectedBarangayFeature;
    if (!feat || !feat.geometry) return true; // if no polygon, don't block

    const pt = point([longitude, latitude]);
    try {
      return booleanPointInPolygon(pt, feat);
    } catch (e) {
      console.warn("booleanPointInPolygon error:", e);
      return true;
    }
  };

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

  // 🧭 Initial load: if user has saved coords, use them once
  useEffect(() => {
    const fetchInitialCoords = async () => {
      try {
        if (userData?.location && !initialCoordsSet) {
          const { lat, lng } = userData.location;
          setMapRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0025,
            longitudeDelta: 0.0025,
          });
          setMarker({ latitude: lat, longitude: lng });
          setInitialCoordsSet(true);
          console.log("📍 Loaded saved coordinates from Firestore");
          return; // stop here; polygon/streets handled by other effects
        }
      } catch (err) {
        console.error("Error fetching geocode:", err);
      }
    };

    fetchInitialCoords();
  }, [userData?.location, initialCoordsSet]);

  // Ensure map centers / focuses on saved pinpoint when entering edit mode
  useEffect(() => {
    if (!editMode) return;

    const centerMapOnLocation = async () => {
      if (userData?.location) {
        // Center on saved coordinates if they exist
        const { lat, lng } = userData.location;
        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.0025,
          longitudeDelta: 0.0025,
        });
        setMarker({ latitude: lat, longitude: lng });
        setInitialCoordsSet(true);
        console.log("📍 Centered map on saved user location (enter edit mode)");
      } else if (street || barangay?.name) {
        // If no saved coordinates, center on street + barangay (no marker)
        try {
          const address = `${street || ""}, ${barangay?.name || ""}, Cagayan de Oro City, Philippines`;
          const geocode = await Location.geocodeAsync(address);

          if (geocode && geocode.length > 0) {
            const { latitude, longitude } = geocode[0];
            setMapRegion({
              latitude,
              longitude,
              latitudeDelta: 0.0025,
              longitudeDelta: 0.0025,
            });
            setMarker(null); // still no marker
            console.log(
              "📍 Centered map on street and barangay inputs (no saved coords)"
            );
          } else {
            console.warn("⚠️ Unable to geocode address:", address);
          }
        } catch (err) {
          console.error("Geocoding error:", err);
        }
      } else {
        console.warn("⚠️ No saved location or address to center the map.");
      }
    };

    centerMapOnLocation();
  }, [editMode]); // ⬅️ only depends on editMode now

  // 🗺️ Street geocoding using Location.geocodeAsync ONLY when:
  //  - editMode is true
  //  - street has value
  //  - barangay is selected
  //  - barangay polygon is loaded
  //  - validationTriggered === true (street was typed BEFORE barangay was chosen)
  useEffect(() => {
    const runStreetGeocode = async () => {
      if (
        !editMode ||
        !selectedBarangayFeature ||
        !barangay?.name ||
        !street?.trim() ||
        !validationTriggered ||
        !streetReady
      ) {
        return;
      }

      try {
        let geocode = [];
        let tried = "";

        // 1️⃣ Try Street + Barangay (most accurate)
        let address = `${street}, ${barangay.name}, Cagayan de Oro City, Philippines`;
        geocode = await Location.geocodeAsync(address);
        tried = "Street + Barangay";

        // 2️⃣ Try Street only if the first failed
        if (!geocode || geocode.length === 0) {
          address = `${street}, Cagayan de Oro City, Philippines`;
          geocode = await Location.geocodeAsync(address);
          tried = "Street only";
        }

        // 3️⃣ Try Barangay only (fallback to barangay center)
        if (!geocode || geocode.length === 0) {
          if (barangayCenter) {
            setMapRegion((prev) => ({
              ...(prev || {}),
              latitude: barangayCenter.latitude,
              longitude: barangayCenter.longitude,
              latitudeDelta: prev?.latitudeDelta || 0.0025,
              longitudeDelta: prev?.longitudeDelta || 0.0025,
            }));
          }
          return;
        }

        // We got coordinates
        const { latitude, longitude } = geocode[0];

        // 4️⃣ Polygon check — make sure street is inside the selected barangay
        const inside = isInsideSelectedBarangay(latitude, longitude);

        if (!inside) {
          // ❌ outside ➜ fallback to barangay center
          if (barangayCenter) {
            setMapRegion((prev) => ({
              ...(prev || {}),
              latitude: barangayCenter.latitude,
              longitude: barangayCenter.longitude,
              latitudeDelta: prev?.latitudeDelta || 0.0025,
              longitudeDelta: prev?.longitudeDelta || 0.0025,
            }));
          }
          return;
        }

        // 5️⃣ Valid street inside barangay polygon ➜ center to street coords (no marker)
        setMapRegion((prev) => ({
          ...(prev || {}),
          latitude,
          longitude,
          latitudeDelta: prev?.latitudeDelta ?? 0.0025,
          longitudeDelta: prev?.longitudeDelta ?? 0.0025,
        }));

        console.log("📍 Geocode success via:", tried);
      } catch (err) {
        console.error("Geocode error:", err);

        // On error → fall back to barangay
        if (barangayCenter) {
          setMapRegion((prev) => ({
            ...(prev || {}),
            latitude: barangayCenter.latitude,
            longitude: barangayCenter.longitude,
            latitudeDelta: prev?.latitudeDelta || 0.0025,
            longitudeDelta: prev?.longitudeDelta || 0.0025,
          }));
        }
      }
    };

    runStreetGeocode();
  }, [
    editMode,
    street,
    barangay,
    selectedBarangayFeature,
    barangayCenter,
    validationTriggered,
    streetReady,
  ]);

  const handleSave = async () => {
    try {
      if (!userData?.uid) return;
  
      // 🚫 Require pinpointed location before saving
      if (!marker) {
        showToast("Please tap the map to pinpoint your exact location.", 2500);
        return;
      }
  
      setIsSaving(true);
  
      let finalProfilePic = profilePic;
  
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
      const userLocation = { lat: marker.latitude, lng: marker.longitude };
  
      await updateDoc(userRef, {
        profilePic: finalProfilePic || null,
        firstName,
        lastName,
        email,
        contact,
        gender,
        dob,
        address: updatedAddress,
        location: userLocation,
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
  
      setPrevStreet(street);
      setPrevBarangay(barangay?.name || "");
      setInitialCoordsSet(true);
  
      setValidationTriggered(false);
  
      showToast("Profile updated successfully!", 2000);
      setEditMode(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to update profile.", 2500);
    } finally {
      setIsSaving(false);
    }
  };  

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

    // Reset validation + marker + region back to saved
    setValidationTriggered(false);
    if (userData?.location) {
      const { lat, lng } = userData.location;
      setMarker({ latitude: lat, longitude: lng });
      setMapRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      setMarker(null);
      setMapRegion(null);
    }

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
                        setIsSaving(true);
                        await handleSave();
                        setConfirmModalVisible(false);
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
                let cleaned = text.replace(/[^0-9+]/g, "");

                if (cleaned.includes("+") && !cleaned.startsWith("+")) {
                  cleaned = cleaned.replace("+", "");
                }

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
              setValue={(value) => {
                // First input: STREET
                setStreet(value);
                // Changing street invalidates previous validation
                setLastGeocodeKey(null);
                setValidationTriggered(false);

                // 🔥 User changed address → hide marker until they tap map again
                setMarker(null);
              }}
              editable={editMode}
              subLabel
            />
            <DropdownField
              label="Barangay"
              visible={barangayMenuVisible}
              setVisible={setBarangayMenuVisible}
              selected={barangay ? barangay.name : ""}
              setSelected={(item) => {
                setBarangay(item);
                setLastGeocodeKey(null);

                // 🔥 User changed barangay → hide marker until they tap map again
                setMarker(null);

                if (street.trim()) {
                  // Street already exists → auto validate on barangay change
                  setValidationTriggered(true);
                  setStreetReady(true);
                } else {
                  setValidationTriggered(false);
                  setStreetReady(false);
                }
              }}
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
                <Text style={styles.subLabel}>Pinpoint Specific Location</Text>

                <View style={styles.mapContainer}>
                  {mapRegion && (
                    <>
                      <MapView
                        style={isMapExpanded ? styles.fullMap : styles.map}
                        region={mapRegion}
                        mapType={isSatellite ? "hybrid" : "standard"}
                        onPress={(e) => {
                          const { latitude, longitude } =
                            e.nativeEvent.coordinate;

                          if (
                            selectedBarangayFeature &&
                            !isInsideSelectedBarangay(latitude, longitude)
                          ) {
                            showToast(
                              "Location must be inside selected barangay.",
                              2200
                            );
                            if (barangayCenter) {
                              setMarker(null);
                              setMapRegion((prev) => ({
                                ...(prev || {}),
                                latitudeDelta: prev?.latitudeDelta ?? 0.03,
                                longitudeDelta: prev?.longitudeDelta ?? 0.03,
                              }));
                            }
                            return;
                          }

                          setMarker({ latitude, longitude });
                          setMapRegion((prev) => ({
                            ...(prev || {}),
                            latitudeDelta: prev?.latitudeDelta ?? 0.03,
                            longitudeDelta: prev?.longitudeDelta ?? 0.03,
                          }));
                        }}
                      >
                        {/* Barangay polygon from NAMRIA */}
                        {/* Hidden polygon used only for geometry */}
                        {barangayPolygonCoords.length > 0 && (
                          <Polygon
                            coordinates={barangayPolygonCoords}
                            strokeColor="transparent"
                            fillColor="transparent"
                            strokeWidth={0}
                          />
                        )}

                        {/* Visible dotted outline like Google Maps */}
                        {barangayPolygonCoords.length > 0 && (
                          <Polyline
                            coordinates={barangayPolygonCoords}
                            strokeColor="#E85C4F" // boundary color
                            strokeWidth={2}
                            lineDashPattern={[1, 1]} // dotted/dashed effect
                          />
                        )}

                        {marker && (
                          <Marker
                            coordinate={marker}
                            draggable
                            onDragEnd={(e) => {
                              const { latitude, longitude } =
                                e.nativeEvent.coordinate;

                              if (
                                selectedBarangayFeature &&
                                !isInsideSelectedBarangay(latitude, longitude)
                              ) {
                                showToast(
                                  "Pin must stay inside the selected barangay.",
                                  2400
                                );
                                if (barangayCenter) {
                                  setMarker(barangayCenter);
                                  setMapRegion((prev) => ({
                                    ...(prev || {}),
                                    latitudeDelta: prev?.latitudeDelta ?? 0.03,
                                    longitudeDelta:
                                      prev?.longitudeDelta ?? 0.03,
                                  }));
                                }
                                return;
                              }

                              setMarker({ latitude, longitude });
                              setMapRegion((prev) => ({
                                ...(prev || {}),
                                latitudeDelta: prev?.latitudeDelta ?? 0.03,
                                longitudeDelta: prev?.longitudeDelta ?? 0.03,
                              }));
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
  keyboardType,
}) => (
  <View style={[styles.inputContainer, containerStyle]}>
    <Text style={subLabel ? styles.subLabel : styles.label}>{label}</Text>
    <TextInput
      value={value}
      editable={editable}
      onChangeText={setValue}
      style={[styles.input, { color: editable ? "#3A2E2E" : "#777" }]}
      keyboardType={keyboardType}
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
  visible,
  setVisible,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const actualOpen = visible ?? isOpen;
  const setActualOpen = setVisible || setIsOpen;

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
        onPress={() => editable && setActualOpen(!actualOpen)}
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
            {actualOpen ? "▲" : "▼"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Dropdown List */}
      {actualOpen && editable && (
        <View style={styles.dropdownContainer}>
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
                    setActualOpen(false);
                    setSearchQuery("");
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
    paddingHorizontal: 10,
    elevation: 5,
    alignSelf: "center",
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
    maxHeight: 230,
    zIndex: 1000,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5D6C7",
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
