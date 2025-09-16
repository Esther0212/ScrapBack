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
} from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import * as Location from "expo-location";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";

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
    const [address] = await Location.reverseGeocodeAsync(coords);
    if (address) {
      const name = `${address.name || ""} ${address.street || ""}, ${
        address.city || ""
      }`.trim();
      setAddressName(name);
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
        <MaterialIcons name="date-range" size={24} color="green" />
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
        <FontAwesome name="map-marker" size={26} color="red" />
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
    Alert.alert("Request Submitted", "Your pickup request has been sent.");
    router.push("/Main/requestPickup"); // This will navigate back to the index/root screen
  }}
>
  <FontAwesome name="truck" size={18} color="#fff" />
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
          <Text style={styles.modalHeader}>Select Pickup Location</Text>
          {loadingLocation ? (
            <ActivityIndicator style={{ marginTop: 20 }} size="large" />
          ) : (
            <>
              <MapView
                style={{ flex: 1 }}
                initialRegion={initialRegion}
                onPress={(e) => setMarkerCoords(e.nativeEvent.coordinate)}
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
                  />
                )}
              </MapView>
              <TextInput
                style={styles.addressInput}
                value={addressName}
                onChangeText={setAddressName}
                placeholder="Fetching address..."
                multiline
              />
            </>
          )}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={confirmLocation}
            >
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40, 
    backgroundColor: "#F0F0C0",
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  card: {
    backgroundColor: "#E2F2D6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  selectLabel: {
    color: "#4C8055",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  option: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: "#DFF6DD",
  },
  optionText: {
    fontSize: 16,
  },
  optionTextSelected: {
    fontWeight: "bold",
    color: "#3B7437",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoSub: {
    color: "#555",
    fontSize: 13,
  },
  requestButton: {
    flexDirection: "row",
    backgroundColor: "#117D2E",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  requestButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
    backgroundColor: "#f0f0f0",
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  cancelBtn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#ccc",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  confirmBtn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#117D2E",
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#333",
    fontWeight: "bold",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  addressInput: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
});