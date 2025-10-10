import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  Image,
  ToastAndroid,
  Animated,
} from "react-native";
import MapView, { Marker, UrlTile, Callout } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";
import { useLocalSearchParams } from "expo-router";
import { InteractionManager } from "react-native";

// 🔥 Firebase
import { db, storage } from "../../../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function PickupRequestForm() {
  const [wasteCategories, setWasteCategories] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [weight, setWeight] = useState("");
  const [pickupDateTime, setPickupDateTime] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);
  const [markerCoords, setMarkerCoords] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [addressName, setAddressName] = useState("");

  const [showDateOnlyPicker, setShowDateOnlyPicker] = useState(false);
  const [showTimeOnlyPicker, setShowTimeOnlyPicker] = useState(false);
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [photo, setPhoto] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // waste category modal
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const { requestId } = useLocalSearchParams(); // 👈 get passed id

  // Confirmation + Toast
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // 📡 Fetch wasteConversionRates
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "wasteConversionRates"),
      (snapshot) => {
        const rawData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const grouped = rawData.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {});

        const groupedArray = Object.keys(grouped).map((cat) => ({
          category: cat,
          items: grouped[cat],
        }));

        setWasteCategories(groupedArray);
      }
    );

    return () => unsub();
  }, []);

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;

      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const response = await fetch(localUri);
        const blob = await response.blob();

        // Unique file path for this user + timestamp
        const storageRef = ref(
          storage,
          `pickupRequests/${user.uid}_${Date.now()}.jpg`
        );

        await uploadBytes(storageRef, blob);

        const downloadUrl = await getDownloadURL(storageRef);
        setPhoto(downloadUrl); // ✅ save the cloud URL, not file://
      } catch (err) {
        console.error("Image upload failed:", err);
        Alert.alert("Upload failed", "Could not upload photo.");
      }
    }
  };

  const fetchAddressName = async (coords) => {
    try {
      const apiKey = "21e4ce510e324d2c81b5caa1989a69d2";
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${coords.longitude}&apiKey=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        setAddressName("Unknown location");
        return;
      }

      const data = await res.json();
      const props = data.features[0]?.properties;

      if (props) {
        const parts = [
          props.street,
          props.suburb || props.district,
          props.city || props.county,
          props.state || props.region,
          props.postcode,
          props.country,
        ].filter(Boolean);

        const detailed = parts.join(", ");
        setAddressName(detailed || props.formatted || "Unknown location");
      } else {
        setAddressName("Unknown location");
      }
    } catch (err) {
      console.error("Reverse geocode failed:", err);
      setAddressName("Unknown location");
    }
  };
  // 👇 fetch existing request if editing
  useEffect(() => {
    const loadRequest = async () => {
      if (!requestId) return; // new request

      try {
        const docRef = doc(db, "pickupRequests", requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSelectedTypes(data.types || []);
          setWeight(data.estimatedWeight?.toString() || "");
          setPickupDateTime(data.pickupDateTime || "");
          setPickupAddress(data.pickupAddress || "");
          setMarkerCoords(data.coords || null);
          setPhoto(data.photoUrl || null);
        }
      } catch (err) {
        console.error("Failed to load request:", err);
      }
    };

    loadRequest();
  }, [requestId]);

  // 🔹 Load user default address or fallback to GPS
  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const userDoc = await getDoc(doc(db, "user", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.address) {
              const { street, barangay, city, province, region, postalCode } =
                userData.address;

              const formattedAddress = [
                street,
                barangay,
                city,
                province,
                region,
                postalCode,
              ]
                .filter(Boolean)
                .join(", ");

              setPickupAddress(formattedAddress);
              setAddressName(formattedAddress);

              if (userData.addressCoords) {
                setMarkerCoords(userData.addressCoords);
                setInitialRegion({
                  ...userData.addressCoords,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
                setLoadingLocation(false);
                return;
              }
            }
          }
        }

        // fallback to GPS if no saved address
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required.");
          setLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setInitialRegion(coords);
        setMarkerCoords({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        fetchAddressName(location.coords);
      } catch (err) {
        console.error("Error fetching user address:", err);
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const confirmLocation = () => {
    setPickupAddress(addressName || "Unknown address");
    setModalVisible(false);
  };

  const onChangeDate = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowDateOnlyPicker(false);
      setShowTimeOnlyPicker(false);
      return;
    }

    if (showDateOnlyPicker) {
      setShowDateOnlyPicker(false);
      if (selectedDate) {
        const updatedDate = new Date(date);
        updatedDate.setFullYear(selectedDate.getFullYear());
        updatedDate.setMonth(selectedDate.getMonth());
        updatedDate.setDate(selectedDate.getDate());
        setDate(updatedDate);
        setShowTimeOnlyPicker(true);
      }
    } else if (showTimeOnlyPicker) {
      setShowTimeOnlyPicker(false);
      if (selectedDate) {
        const updatedDate = new Date(date);
        updatedDate.setHours(selectedDate.getHours());
        updatedDate.setMinutes(selectedDate.getMinutes());
        setDate(updatedDate);
        const formatted = updatedDate.toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        setPickupDateTime(formatted);
      }
    }
  };

  const showToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert(msg);
    }
  };

const showAnimatedToast = (msg) => {
  setToastMessage(msg);
  setToastVisible(true);
  fadeAnim.setValue(0);

  // ✅ Defer animation until after UI commit to avoid "useInsertionEffect" error
  InteractionManager.runAfterInteractions(() => {
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
  });
};
  const handleSubmit = async () => {
    if (!selectedTypes.length || !weight || !pickupDateTime || !pickupAddress) {
      showAnimatedToast("Please fill in all fields.");
      return false; // ❗ return false so caller knows it failed
    }

    try {
      setSubmitting(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return false;

      if (requestId) {
        await updateDoc(doc(db, "pickupRequests", requestId), {
          types: selectedTypes,
          estimatedWeight: weight,
          pickupDateTime,
          pickupAddress,
          pickupDate: date,
          coords: markerCoords,
          photoUrl: photo || null,
          updatedAt: serverTimestamp(),
        });
        showAnimatedToast("Pickup request updated!");
      } else {
        await addDoc(collection(db, "pickupRequests"), {
          userId: user.uid,
          types: selectedTypes,
          estimatedWeight: weight,
          pickupDateTime,
          pickupDate: date,
          pickupAddress,
          coords: markerCoords,
          photoUrl: photo || null,
          status: "pending",
          createdAt: serverTimestamp(),
        });
        showAnimatedToast("Pickup request created!");
      }

      return true; // ✅ success
    } catch (err) {
      console.error("Error saving request:", err);
      showAnimatedToast("Failed to save request.");
      return false; // ❌ failed
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Waste Categories */}
          <Text style={styles.label}>Select Waste Category</Text>
          {wasteCategories.map((cat) => {
            const selectedInCat = selectedTypes.filter((t) =>
              cat.items.some((item) => item.type === t)
            );

            return (
              <TouchableOpacity
                key={cat.category}
                style={[
                  styles.categoryCard,
                  selectedInCat.length > 0 && styles.categoryCardSelected, // ✅ highlight selected category
                ]}
                onPress={() => {
                  setSelectedCategory(cat);
                  setCategoryModalVisible(true);
                }}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome
                    name="recycle"
                    size={28}
                    color={selectedInCat.length > 0 ? "#0E9247" : "#999"} // ✅ icon turns green if selected
                  />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text
                    style={[
                      styles.categoryTitle,
                      selectedInCat.length > 0 && { color: "#0E9247" }, // ✅ category text green if selected
                    ]}
                  >
                    {cat.category}
                  </Text>
                  <Text style={styles.categorySub}>
                    {selectedInCat.length > 0
                      ? `${selectedInCat.length} selected`
                      : `${cat.items.length} types available`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Weight */}
          <Text style={styles.label}>Estimated weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Value"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />

          {/* Waste photo */}
          <Text style={styles.label}>Waste Picture</Text>
          <TouchableOpacity style={styles.infoBox} onPress={pickImage}>
            <View style={styles.iconWrapper}>
              <Ionicons name="camera" size={30} color="green" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Add a Photo</Text>
              <Text style={styles.infoSub}>
                {photo ? "Photo added" : "Take a photo of your waste"}
              </Text>
            </View>
          </TouchableOpacity>

          {photo && (
            <Image
              source={{ uri: photo }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 12,
                marginBottom: 16,
              }}
            />
          )}

          {/* Date */}
          <TouchableOpacity
            style={styles.infoBox}
            onPress={() => setShowDateOnlyPicker(true)}
          >
            <View style={styles.iconWrapper}>
              <MaterialIcons name="date-range" size={30} color="green" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Pickup Date & Time</Text>
              <Text style={styles.infoSub}>
                {pickupDateTime || "Select Date & Time"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Address */}
          <TouchableOpacity
            style={styles.infoBox}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.iconWrapper}>
              <FontAwesome name="map-marker" size={32} color="red" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Pickup Address</Text>
              <Text style={styles.infoSub}>
                {pickupAddress || "Select Location on Map"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.requestButton, submitting && { opacity: 0.6 }]}
            onPress={() => setConfirmModalVisible(true)}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="truck" size={30} color="#fff" />
                <Text style={styles.requestButtonText}>Request Pickup</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Date Pickers */}
          {showDateOnlyPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeDate}
            />
          )}
          {showTimeOnlyPicker && (
            <DateTimePicker
              value={date}
              mode="time"
              is24Hour={false}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeDate}
            />
          )}

          {/* Map Modal */}
          <Modal visible={modalVisible} animationType="slide">
            <View style={{ flex: 1 }}>
              <View style={styles.topOverlay}>
                <View style={styles.searchBox}>
                  <TextInput
                    style={styles.searchOverlay}
                    placeholder="Search"
                    value={addressName}
                    onChangeText={setAddressName}
                  />
                </View>
              </View>

              {loadingLocation ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" />
              ) : (
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={initialRegion}
                  onPress={(e) => {
                    const coords = e.nativeEvent.coordinate;
                    setMarkerCoords(coords);
                    fetchAddressName(coords);
                  }}
                >
                  <UrlTile
                    urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                    maximumZ={19}
                  />
                  {markerCoords && (
                    <Marker
                      coordinate={markerCoords}
                      draggable
                      onDragEnd={(e) => {
                        const coords = e.nativeEvent.coordinate;
                        setMarkerCoords(coords);
                        fetchAddressName(coords);
                      }}
                    >
                      <FontAwesome name="map-marker" size={38} color="red" />
                      <Callout>
                        <View style={{ width: 200 }}>
                          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                            Selected Location
                          </Text>
                          <Text>{addressName || "Fetching address..."}</Text>
                        </View>
                      </Callout>
                    </Marker>
                  )}
                </MapView>
              )}

              <View style={styles.footerOverlay}>
                <TouchableOpacity
                  style={styles.cancelBtnOverlay}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.footerText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtnOverlay}
                  onPress={confirmLocation}
                >
                  <Text style={styles.footerText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Waste Category Modal */}
          <Modal visible={categoryModalVisible} animationType="slide">
            <SafeAreaView style={{ flex: 1 }}>
              <Text style={styles.modalHeader}>
                {selectedCategory?.category}
              </Text>
              <ScrollView contentContainerStyle={styles.modalList}>
                {selectedCategory?.items.map((item) => {
                  const isSelected = selectedTypes.includes(item.type);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => toggleType(item.type)}
                      style={[
                        styles.wasteOption,
                        isSelected && styles.wasteOptionSelected, // ✅ background/border change
                      ]}
                    >
                      <Text
                        style={[
                          styles.wasteText,
                          isSelected && styles.wasteTextSelected, // ✅ text change
                        ]}
                      >
                        {item.type}
                      </Text>
                      <Text
                        style={[
                          styles.wastePoints,
                          isSelected && { color: "#0E9247", fontWeight: "700" }, // ✅ points color change too
                        ]}
                      >
                        {item.points} pts/kg
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setCategoryModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>
        </ScrollView>
        {/* ✅ Confirmation Modal before submitting */}
        <Modal
          visible={confirmModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <View style={styles.overlayCenter}>
            <View style={styles.confirmModal}>
              <Ionicons name="help-circle-outline" size={40} color="#0E9247" />
              <Text style={styles.confirmTitle}>Confirm Request</Text>
              <Text style={styles.confirmText}>
                Are you sure all details are correct for your pickup request?
              </Text>

              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { flex: 0.45 }]}
                  onPress={() => setConfirmModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, { flex: 0.45 }]}
                  onPress={async () => {
                    setConfirmModalVisible(false);
                    const success = await handleSubmit(); // ✅ check return value
                    if (!success) return; // ❌ stop if failed

                    setToastMessage("Pickup request submitted successfully!");
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
                  }}
                >
                  <Text style={styles.confirmTextWhite}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {toastVisible && (
          <Animated.View
            style={[
              styles.toast,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0], // ✅ slide down from top
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}
      </SafeAreaView>
    </CustomBgColor>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 10, flexGrow: 1 },
  label: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 8,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 2,
  },
  categoryTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333" },
  categorySub: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#777",
    marginTop: 2,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  iconWrapper: { width: 36, alignItems: "center" },
  infoTextContainer: { marginLeft: 12, flex: 1 },
  infoTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333" },
  infoSub: {
    color: "#6b6b6b",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
  },
  requestButton: {
    flexDirection: "row",
    backgroundColor: "#0E9247",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  requestButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginLeft: 10,
  },
  topOverlay: {
    position: "absolute",
    top: 30,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchBox: {
    backgroundColor: "white",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchOverlay: { flex: 1, fontSize: 15, fontFamily: "Poppins_400Regular" },
  footerOverlay: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  cancelBtnOverlay: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
  },
  confirmBtnOverlay: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#7EBF62",
    alignItems: "center",
  },
  footerText: { color: "#fff", fontSize: 16, fontFamily: "Poppins_700Bold" },
  modalHeader: {
    fontSize: 16,
    fontWeight: "700",
    padding: 16,
    textAlign: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalList: { padding: 16 },
  wasteOption: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  wasteOptionSelected: {
    borderColor: "#0E9247",
    backgroundColor: "#E6F4EA", // lighter green background when selected
  },
  wasteText: { fontSize: 15, color: "#333", fontWeight: "500" },
  wasteTextSelected: { color: "#0E9247", fontWeight: "700" },
  wastePoints: { fontSize: 13, color: "#666", marginTop: 4 },
  modalFooter: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  modalCloseBtn: {
    backgroundColor: "#0E9247",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  overlayCenter: {
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
    alignItems: "center",
    width: "90%",
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginTop: 10,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    textAlign: "center",
    marginVertical: 10,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#888",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#0E9247",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  confirmTextWhite: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
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
