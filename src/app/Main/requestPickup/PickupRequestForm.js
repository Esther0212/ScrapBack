import React, { useState, useEffect, useRef } from "react";
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
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
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

  // only one estimated weight (total)
  const [weights, setWeights] = useState({});
  const totalWeight = selectedTypes.reduce(
    (sum, t) => sum + (parseFloat(weights[t]) || 0),
    0
  );

  // 💡 compute estimated points
  const totalPoints = selectedTypes.reduce((sum, t) => {
    const category = wasteCategories.find((c) =>
      c.items.some((item) => item.type === t)
    );
    const item = category?.items.find((i) => i.type === t);
    const ptsPerKg = item?.points || 0;
    return sum + (parseFloat(weights[t]) || 0) * ptsPerKg;
  }, 0);

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

  const [isSatellite, setIsSatellite] = useState(false);
  const [searchHeight, setSearchHeight] = useState(50); // default height

  const [originalAddress, setOriginalAddress] = useState("");
  const [originalCoords, setOriginalCoords] = useState(null);
  const [originalSearchHeight, setOriginalSearchHeight] = useState(50);

  const [editAddressModalVisible, setEditAddressModalVisible] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

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
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        const newTypes = prev.filter((t) => t !== type);

        setWeights((w) => {
          const updated = { ...w };
          delete updated[type];
          return updated;
        });

        return newTypes;
      } else {
        setWeights((w) => ({
          ...w,
          [type]: w[type] || "1",
        }));
        return [...prev, type];
      }
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAnimatedToast("Camera permission is required.");
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

        const storageRef = ref(
          storage,
          `pickupRequests/${user.uid}_${Date.now()}.jpg`
        );

        await uploadBytes(storageRef, blob);

        const downloadUrl = await getDownloadURL(storageRef);
        setPhoto(downloadUrl);
      } catch (err) {
        console.error("Image upload failed:", err);
        showAnimatedToast("Failed to upload photo.");
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
        setSearchHeight(50);
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
      if (!requestId) return;

      try {
        const docRef = doc(db, "pickupRequests", requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const types = data.types || [];
          const w = data.weights || {};

          const cleaned = Object.fromEntries(
            Object.entries(w).filter(([k]) => types.includes(k))
          );

          setSelectedTypes(types);
          setWeights(cleaned);
          setPickupDateTime(data.pickupDateTime || "");
          setPickupAddress(data.pickupAddress || "");

          // 🔹 coords from request (stored as { latitude, longitude })
          if (data.coords?.latitude && data.coords?.longitude) {
            setMarkerCoords(data.coords);
            setInitialRegion({
              ...data.coords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
            fetchAddressName(data.coords);
          }

          setPhoto(data.photoUrl || null);
        }
      } catch (err) {
        console.error("Failed to load request:", err);
      }
    };

    loadRequest();
  }, [requestId]);

  // 🔹 Load user default address & location (lat/lng) – same as AccountInfo
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

            // 🏠 Build human-readable address from user.profile (AccountInfo)
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

              if (formattedAddress) {
                setPickupAddress(formattedAddress);
                setAddressName(formattedAddress);
              }
            }

            // 📍 Use the same saved coords from AccountInfo: location: { lat, lng }
            if (userData.location && !requestId) {
              const { lat, lng } = userData.location;
              const coords = {
                latitude: lat,
                longitude: lng,
              };

              setMarkerCoords(coords);
              setInitialRegion({
                ...coords,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });

              // If no formatted address from profile, reverse-geocode this point
              if (!userData.address) {
                fetchAddressName(coords);
              }

              setLoadingLocation(false);
              return;
            }
          }
        }

        // fallback to GPS if no saved location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          showAnimatedToast("Location permission is required.");
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
  }, [requestId]);

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
    requestAnimationFrame(() => setToastVisible(true));
    fadeAnim.setValue(0);

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
          }).start(() => {
            requestAnimationFrame(() => setToastVisible(false));
          });
        }, 2000);
      });
    });
  };

  const handleSubmit = async () => {
    if (
      !selectedTypes.length ||
      !totalWeight ||
      !pickupDateTime ||
      !pickupAddress
    ) {
      showAnimatedToast("Please fill in all fields.");
      return false;
    }

    try {
      setSubmitting(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return false;

      let displayName = user.email;
      try {
        const userDoc = await getDoc(doc(db, "user", user.uid));
        if (userDoc.exists()) {
          const { firstName, lastName } = userDoc.data();
          displayName = `${firstName || ""} ${lastName || ""}`.trim();
        }
      } catch (err) {
        console.error("Could not fetch user profile:", err);
      }

      if (requestId) {
        await updateDoc(doc(db, "pickupRequests", requestId), {
          types: selectedTypes,
          weights: weights,
          estimatedWeight: totalWeight,
          pickupDateTime,
          pickupAddress,
          pickupDate: date,
          estimatedPoints: totalPoints,
          coords: markerCoords, // { latitude, longitude } – same as map
          photoUrl: photo || null,
          seenByAdmin: false,
          updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, "adminNotifications"), {
          title: "Pickup Request Updated",
          body: `User <b>${displayName}</b> updated a request at ${pickupAddress}. Click for more details.`,
          userId: user.uid,
          createdAt: serverTimestamp(),
          read: false,
          type: "updated",
          requestId: requestId,
        });

        showAnimatedToast("Pickup request updated!");
        setTimeout(() => router.push("/Main/requestPickup"), 2000);
      } else {
        const newDoc = await addDoc(collection(db, "pickupRequests"), {
          userId: user.uid,
          types: selectedTypes,
          weights: weights,
          estimatedWeight: totalWeight,
          pickupDateTime,
          pickupDate: date,
          estimatedPoints: totalPoints,
          pickupAddress,
          coords: markerCoords, // { latitude, longitude }
          photoUrl: photo || null,
          status: "pending",
          seenByAdmin: false,
          createdAt: serverTimestamp(),
        });

        await addDoc(collection(db, "adminNotifications"), {
          title: "New Pickup Request",
          body: `User <b>${displayName}</b> created a new request for ${pickupAddress}. Click for more details.`,
          userId: user.uid,
          createdAt: serverTimestamp(),
          type: "new",
          read: false,
          requestId: newDoc.id,
        });

        showAnimatedToast("Pickup request created!");
        setTimeout(() => router.push("/Main/requestPickup"), 2000);
      }

      return true;
    } catch (err) {
      console.error("Error saving request:", err);
      showAnimatedToast("Failed to save request.");
      return false;
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
                  selectedInCat.length > 0 && styles.categoryCardSelected,
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
                    color={selectedInCat.length > 0 ? "#008243" : "#999"}
                  />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text
                    style={[
                      styles.categoryTitle,
                      selectedInCat.length > 0 && { color: "#008243" },
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
          <Text style={styles.label}>Total Estimated Weight (kg)</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              {totalWeight % 1 === 0
                ? totalWeight
                : parseFloat(totalWeight.toFixed(2))}{" "}
              kg
            </Text>
          </View>

          <Text style={styles.label}>Estimated Points</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              {totalPoints % 1 === 0
                ? totalPoints
                : parseFloat(totalPoints.toFixed(2))}{" "}
              pts
            </Text>
          </View>

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
            onPress={() => {
              setOriginalAddress(addressName);
              setOriginalCoords(markerCoords);
              setOriginalSearchHeight(searchHeight);
              setModalVisible(true);
            }}
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
                <Text style={styles.requestButtonText}>
                  {requestId ? "Update Request" : "Request Pickup"}
                </Text>
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
                <Text style={styles.toggleLabel}>
                  Edit Address
                </Text>
                <View style={styles.searchBox}>
                  <Animated.View
                    style={{
                      borderRadius: 10,
                      padding: 2,
                      borderWidth: 2, // thickness of glow
                      paddingHorizontal: 10,
                      borderColor: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["transparent", "rgba(0,130,67,0.6)"],
                      }),
                    }}
                  >
                    <TextInput
                      style={[
                        styles.searchOverlay,
                        {
                          height: searchHeight,
                        },
                      ]}
                      placeholder="Edit or Pinpoint Location"
                      value={addressName}
                      onChangeText={setAddressName}
                      multiline={true}
                      scrollEnabled={true} // 🔥 allows scrolling when max height reached
                      onContentSizeChange={(e) => {
                        const h = e.nativeEvent.contentSize.height;

                        // Approx line height (React Native default ~20)
                        const lineHeight = 20;

                        // Maximum height for 4 lines
                        const maxHeight = lineHeight * 4;

                        const adjusted = Math.max(50, Math.min(h, maxHeight));

                        if (adjusted !== searchHeight) {
                          setSearchHeight(adjusted);
                        }
                      }}
                    />
                  </Animated.View>
                </View>
                <Text style={styles.toggleLabel}>
                  Pinpoint Location
                </Text>
              </View>

              {loadingLocation ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" />
              ) : (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  initialRegion={initialRegion}
                  mapType={isSatellite ? "hybrid" : "standard"}
                  onPress={(e) => {
                    const coords = e.nativeEvent.coordinate;
                    setMarkerCoords(coords);
                    fetchAddressName(coords);
                  }}
                >
                  {markerCoords && (
                    <Marker
                      coordinate={markerCoords}
                      draggable
                      title="Pinpointed Pickup Location"
                      description="This is your requested pickup location. Wait for confirmation from the admin."
                      onDragEnd={(e) => {
                        const coords = e.nativeEvent.coordinate;
                        setMarkerCoords(coords);
                        fetchAddressName(coords);
                      }}
                    />
                  )}
                </MapView>
              )}
              <TouchableOpacity
                style={[
                  styles.accountInfoToggle,
                  { top: searchHeight + 80 }, // 👈 dynamic offset based on search height
                ]}
                onPress={() => setIsSatellite(!isSatellite)}
                activeOpacity={0.8}
              >
                <FontAwesome
                  name={isSatellite ? "map" : "map-o"}
                  size={24}
                  color="black"
                />
              </TouchableOpacity>

              <View style={styles.footerOverlay}>
                <TouchableOpacity
                  style={styles.cancelBtnOverlay}
                  onPress={() => {
                    setAddressName(originalAddress);
                    setMarkerCoords(originalCoords);
                    setSearchHeight(originalSearchHeight);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.footerText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtnOverlay}
                  onPress={() => setEditAddressModalVisible(true)}
                >
                  <Text style={styles.footerText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Waste Category Modal */}
          <Modal visible={categoryModalVisible} animationType="slide">
            <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F1C5" }}>
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
                        isSelected && styles.wasteOptionSelected,
                      ]}
                      activeOpacity={0.9}
                    >
                      <View style={styles.wasteRow}>
                        <View style={styles.wasteInfo}>
                          <Text
                            style={[
                              styles.wasteText,
                              isSelected && styles.wasteTextSelected,
                            ]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {item.type}
                          </Text>
                          <Text
                            style={[
                              styles.wastePoints,
                              isSelected && {
                                color: "#008243",
                                fontFamily: "Poppins_400Regular",
                              },
                            ]}
                          >
                            {item.points} pts/kg
                          </Text>
                        </View>

                        {isSelected && (
                          <View style={styles.controls}>
                            <TouchableOpacity
                              style={styles.stepperBtn}
                              onPress={() => {
                                setWeights((prev) => {
                                  const newValue =
                                    (parseFloat(prev[item.type]) || 0) - 1;

                                  // 👉 If weight goes to 0 → unselect the type
                                  if (newValue <= 0) {
                                    const updated = { ...prev };
                                    delete updated[item.type];

                                    // remove from selectedTypes
                                    setSelectedTypes((types) =>
                                      types.filter((t) => t !== item.type)
                                    );

                                    return updated;
                                  }

                                  // normal decrease
                                  return {
                                    ...prev,
                                    [item.type]: newValue.toString(),
                                  };
                                });
                              }}
                            >
                              <Text style={styles.stepperText}>-</Text>
                            </TouchableOpacity>

                            <TextInput
                              style={styles.weightInput}
                              placeholder="kg"
                              keyboardType="numeric"
                              value={weights[item.type] ?? "0"}
                              onChangeText={(val) => {
                                // sanitize numbers
                                const sanitized = val
                                  .replace(/[^0-9.]/g, "")
                                  .replace(/^([^.]*\.)|\./g, "$1")
                                  .replace(/^(\d+\.?\d{0,2}).*$/, "$1");

                                const num = parseFloat(sanitized);

                                // if user enters 0 → unselect
                                if (!num || num <= 0) {
                                  setWeights((prev) => {
                                    const updated = { ...prev };
                                    delete updated[item.type];
                                    return updated;
                                  });

                                  setSelectedTypes((types) =>
                                    types.filter((t) => t !== item.type)
                                  );

                                  return;
                                }

                                // otherwise normal update
                                setSelectedTypes((types) =>
                                  types.includes(item.type)
                                    ? types
                                    : [...types, item.type]
                                );

                                setWeights((prev) => ({
                                  ...prev,
                                  [item.type]: sanitized,
                                }));
                              }}
                            />

                            <TouchableOpacity
                              style={styles.stepperBtn}
                              onPress={() => {
                                setSelectedTypes((types) =>
                                  types.includes(item.type)
                                    ? types
                                    : [...types, item.type]
                                );

                                setWeights((prev) => ({
                                  ...prev,
                                  [item.type]: (
                                    (parseFloat(prev[item.type]) || 0) + 1
                                  ).toString(),
                                }));
                              }}
                            >
                              <Text style={styles.stepperText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
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
              <Ionicons name="help-circle-outline" size={40} color="#008243" />
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
                    const success = await handleSubmit();
                    if (!success) return;

                    setToastMessage("Pickup request submitted successfully!");
                    requestAnimationFrame(() => setToastVisible(true));

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
                          }).start(() => {
                            requestAnimationFrame(() => setToastVisible(false));
                          });
                        }, 2000);
                      });
                    });
                  }}
                >
                  <Text style={styles.confirmTextWhite}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          visible={editAddressModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditAddressModalVisible(false)}
        >
          <View style={styles.overlayCenter}>
            <View style={styles.addressModal}>
              <Ionicons name="location-outline" size={40} color="#008243" />

              <Text style={styles.addressModalTitle}>
                Refine Pickup Address?
              </Text>

              <Text style={styles.addressModalText}>
                You can add more details like house number or landmarks to help
                staff locate your exact pickup point. Would you like to edit it
                first?
              </Text>

              <View style={styles.addressModalButtons}>
                <TouchableOpacity
                  style={styles.modalUseButton}
                  onPress={() => {
                    setEditAddressModalVisible(false);
                    confirmLocation();
                  }}
                >
                  <Text style={styles.modalUseText}>Use as is</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalEditButton}
                  onPress={() => {
                    setEditAddressModalVisible(false);

                    // trigger search field glow
                    Animated.sequence([
                      Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                      }),
                      Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: false,
                      }),
                      Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                      }),
                      Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: false,
                      }),
                    ]).start();
                  }}
                >
                  <Text style={styles.modalEditText}>Edit Address</Text>
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
                      outputRange: [-50, 0],
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
  categoryCardSelected: {
    borderColor: "#008243",
    backgroundColor: "#E6F4EA",
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
    backgroundColor: "#008243",
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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 10,
  },
  searchOverlay: { flex: 1, fontSize: 15, fontFamily: "Poppins_400Regular", },
  toggleLabel: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333", marginBottom: 5, },
  toggleLabel1: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333", },
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
    backgroundColor: "#888",
    alignItems: "center",
  },
  confirmBtnOverlay: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#008243",
    alignItems: "center",
  },
  footerText: { color: "#fff", fontSize: 16, fontFamily: "Poppins_700Bold" },
  modalHeader: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    padding: 16,
    textAlign: "center",
    backgroundColor: "#F0F1C5",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
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
    borderColor: "#008243",
    backgroundColor: "#E6F4EA",
  },
  wasteText: { fontSize: 15, color: "#333", fontFamily: "Poppins_700Bold" },
  wasteTextSelected: { color: "#008243", fontFamily: "Poppins_700Bold" },
  wastePoints: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
  },
  modalFooter: {
    padding: 16,
    backgroundColor: "#F0F1C5",
    alignItems: "center",
  },
  modalCloseBtn: {
    width: "100%", // ⭐ makes it full horizontal width
    backgroundColor: "#008243",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  weightInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 10,
    width: 70,
    textAlign: "center",
    fontSize: 14,
    backgroundColor: "#fff",
    marginHorizontal: 8,
    fontFamily: "Poppins_400Regular",
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  stepperText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  wasteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  wasteInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
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
    backgroundColor: "#008243",
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
  accountInfoToggle: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    zIndex: 9999, // 🔥 prevents leaking through map
  },
  addressModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    alignItems: "center",
  },
  addressModalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginVertical: 10,
  },
  addressModalText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  addressModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalEditButton: {
    flex: 0.48,
    backgroundColor: "#008243",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalEditText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  modalUseButton: {
    flex: 0.48,
    backgroundColor: "#888",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalUseText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
});
