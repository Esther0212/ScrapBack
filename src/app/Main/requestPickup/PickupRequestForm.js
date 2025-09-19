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
} from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";

export default function PickupRequestForm() {
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

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const fetchAddressName = async (coords) => {
    try {
      // Always try Google Geocoding API first
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=YOUR_API_KEY`
      );
      const data = await resp.json();

      let formatted = "";
      if (data.results && data.results.length > 0) {
        formatted = data.results[0].formatted_address;
      }

      // If Google failed, fallback to expo-location
      if (!formatted) {
        const [address] = await Location.reverseGeocodeAsync(coords);
        if (address) {
          const parts = [
            address.name,
            address.street,
            address.district,
            address.city,
            address.region,
            address.country,
          ].filter(Boolean);
          formatted = parts.join(", ");
        }
      }

      setAddressName(formatted || "Unknown location");
    } catch (err) {
      console.error("Geocoding failed:", err);
      setAddressName("Unknown location");
    }
  };

  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
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
      setLoadingLocation(false);
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
        setShowTimeOnlyPicker(true); // show time picker after date
      }
    } else if (showTimeOnlyPicker) {
      setShowTimeOnlyPicker(false);
      if (selectedDate) {
        const updatedDate = new Date(date);
        updatedDate.setHours(selectedDate.getHours());
        updatedDate.setMinutes(selectedDate.getMinutes());
        setDate(updatedDate);
        const formatted = updatedDate.toLocaleString("en-US", {
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

  return (
    <CustomBgColor>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>

          <Text style={styles.label}>Type of recyclable</Text>
          <View style={styles.card}>
            <Text style={styles.selectLabel}>Select all that applies</Text>
            {["Plastic", "Paper", "Metal", "Glass"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => toggleType(type)}
                style={[
                  styles.option,
                  selectedTypes.includes(type) && styles.optionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedTypes.includes(type) && styles.optionTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Estimated weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Value"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />

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

          <TouchableOpacity
            style={styles.requestButton}
            onPress={() => {
              // Do validation here if needed
              Alert.alert(
                "Request Submitted",
                "Your pickup request has been sent."
              );
              router.back(); // This will navigate back to the index/root screen
            }}
          >
            <FontAwesome name="truck" size={30} color="#fff" />
            <Text style={styles.requestButtonText}>Request Pickup</Text>
          </TouchableOpacity>

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
              {/* Floating header search */}
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
                    fetchAddressName(coords); // ✅ improved geocoding
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
                        fetchAddressName(coords); // ✅ improved geocoding
                      }}
                    >
                      <FontAwesome name="map-marker" size={38} color="red" />
                    </Marker>
                  )}
                </MapView>
              )}

              {/* Floating footer buttons */}
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
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 10, 
    flexGrow: 1,
  },

  /* Labels */
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3a3a3a",
    marginBottom: 8,
    marginTop: 6,
  },

  /* Recyclable card w/ green header */
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    // subtle shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectLabel: {
    backgroundColor: "#7DBF61", // green header band
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 12,
    fontSize: 15,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
  },

  /* Option rows */
  option: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  optionSelected: {
    backgroundColor: "#F2FAF1", // subtle selected tint
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  optionTextSelected: {
    fontWeight: "600",
    color: "#2F6C31",
  },

  /* weight input */
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.02,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  /* date/address info boxes */
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconWrapper: {
    width: 36, // fixed width to align text consistently
    alignItems: "center",
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  infoSub: {
    color: "#6b6b6b",
    fontSize: 13,
    marginTop: 4,
  },

  /* Request button (truck + text) */
  requestButton: {
    flexDirection: "row",
    backgroundColor: "#0E9247", // brighter green like screenshot
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  requestButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 10, // spacing between icon and text
  },

  /* Modal / map */
  modalHeader: {
    fontSize: 16,
    fontWeight: "700",
    padding: 16,
    textAlign: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
  },
  cancelBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  confirmBtn: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#0E9247",
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#333",
    fontWeight: "700",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  /* address input in modal */
  addressInput: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    padding: 12,
    borderColor: "#eee",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginHorizontal: 16,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  searchInput: { flex: 1, fontSize: 16 },

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
    backgroundColor: "rgba(0,0,0,0.6)", // dark translucent
    alignItems: "center",
  },
  confirmBtnOverlay: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#7EBF62", // green confirm
    alignItems: "center",
  },
  footerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
