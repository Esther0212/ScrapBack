import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  FlatList,
  Linking,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import MapView, { UrlTile, Marker, Callout } from "react-native-maps";
import CustomBgColor from "../../../components/customBgColor";
import Feather from "@expo/vector-icons/Feather";

// Firebase
import { db } from "../../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

// Custom marker
import collectionPointMarker from "../../../assets/map/collectionPointMarker.png";

// 🔹 Convert 24-hour to 12-hour format
const formatTime12h = (time24) => {
  if (!time24) return "";
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
};

// 🔹 Convert date to full form
const formatFullDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString(undefined, options);
};

// 🔹 Distance calculation (Haversine)
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// 🔹 Status component
const StatusBadge = ({ status }) => {
  const isOpen = status === "Open";
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: isOpen ? "#B9F8CF" : "#FFC9C9",
        },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          { color: isOpen ? "#016630" : "#9F0712" },
        ]}
      >
        {status}
      </Text>
    </View>
  );
};

export default function MapSelector() {
  const router = useRouter();
  const mapRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [selectedView, setSelectedView] = useState("map");
  const [region, setRegion] = useState({
    latitude: 8.4542,
    longitude: 124.6319,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [marker, setMarker] = useState(null); // user location
  const [points, setPoints] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // 🔥 Load Firestore points + schedules
  useEffect(() => {
    const unsubPoints = onSnapshot(
      collection(db, "collectionPoint"),
      (snap) => {
        setPoints(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubSchedules = onSnapshot(
      collection(db, "collectionSchedule"),
      (snap) => {
        setSchedules(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      unsubPoints();
      unsubSchedules();
    };
  }, []);

  // 📍 Get user location + compute distances
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        setMarker({ latitude, longitude });

        if (points.length > 0) {
          const withDistance = points.map((p) => ({
            ...p,
            distance: getDistanceKm(latitude, longitude, p.lat, p.lng),
          }));
          withDistance.sort((a, b) => a.distance - b.distance); // nearest → farthest
          setPoints(withDistance);
        }
      } catch (error) {
        console.warn("Location error:", error);
      }
    })();
  }, [points.length]);

  // 🔍 Search bar
  const handleSearch = async () => {
    if (!searchText) return;

    try {
      const results = await Location.geocodeAsync(searchText);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        setMarker({ latitude, longitude });
        mapRef.current?.animateToRegion(newRegion, 1000);
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // Sort schedules by time AM → PM
  const sortSchedules = (scheds) => {
    return scheds
      .slice()
      .sort(
        (a, b) =>
          parseInt(a.collectionTime.replace(":", ""), 10) -
          parseInt(b.collectionTime.replace(":", ""), 10)
      );
  };

  // 🔗 Open Google Maps with origin + destination
  const openGoogleMaps = (destLat, destLng, label) => {
    if (!marker) return; // make sure we have user location
    const { latitude, longitude } = marker;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${destLat},${destLng}&travelmode=driving`;
    Linking.openURL(url);
  };

  // 📋 Render list item
  const renderListItem = ({ item }) => {
    let pointSchedules = schedules.filter((s) => s.pointId === item.id);
    pointSchedules = sortSchedules(pointSchedules);

    return (
      <View style={styles.listCard}>
        <Text style={styles.listTitle}>{item.name}</Text>
        <Text style={styles.listAddress}>{item.address}</Text>
        {item.distance && (
          <Text style={styles.distanceText}>
            Distance: {item.distance.toFixed(2)} km
          </Text>
        )}
        {pointSchedules.length > 0 ? (
          pointSchedules.map((s, idx) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.scheduleRow,
                { backgroundColor: idx % 2 === 0 ? "#E3F6E3" : "#FFFFFF" },
              ]}
              onPress={() => openGoogleMaps(item.lat, item.lng, item.name)}
            >
              <Text style={styles.scheduleText}>
                {formatFullDate(s.collectionDate)},{" "}
                {formatTime12h(s.collectionTime)}
              </Text>
              <StatusBadge status={s.status} />
              <Feather
                name="arrow-up-right"
                size={20}
                color="black"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noSchedule}>No schedules</Text>
        )}
      </View>
    );
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={{ flex: 1, paddingTop: 25, flexGrow: 1 }}>
        <View style={styles.container}>
          {/* Top Overlay: Search, Map/List Tabs, and Drop-off Stations */}
          <View
            style={[
              styles.topOverlayContainer,
              selectedView === "list" && styles.listTabBackground, // Apply background only in List tab
            ]}
          >
            {/* Search Box */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
              />
            </View>
  
            {/* Toggle Buttons */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleButtons}>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    selectedView === "map" && styles.toggleSelected,
                  ]}
                  onPress={() => setSelectedView("map")}
                >
                  <Text
                    style={[
                      styles.toggleOptionText,
                      selectedView === "map" && styles.toggleOptionTextSelected,
                    ]}
                  >
                    Map
                  </Text>
                </TouchableOpacity>
  
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    selectedView === "list" && styles.toggleSelected,
                  ]}
                  onPress={() => setSelectedView("list")}
                >
                  <Text
                    style={[
                      styles.toggleOptionText,
                      selectedView === "list" && styles.toggleOptionTextSelected,
                    ]}
                  >
                    List
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.toggleLabelBox}>
                <Text style={styles.toggleLabel}>Drop-off stations</Text>
              </View>
            </View>
          </View>
  
          {/* Map or List */}
          {selectedView === "map" ? (
            <MapView
              style={{ flex: 1 }}
              region={region}
              ref={mapRef}
              onLongPress={(e) => setMarker(e.nativeEvent.coordinate)}
            >
              <UrlTile
                urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                maximumZ={19}
              />
  
              {/* User marker */}
              {marker && (
                <Marker coordinate={marker}>
                  <Callout>
                    <Text>Your Location</Text>
                  </Callout>
                </Marker>
              )}
  
              {/* Collection Points */}
              {points.map((p) => {
                let pointSchedules = schedules.filter((s) => s.pointId === p.id);
                pointSchedules = sortSchedules(pointSchedules);
                return (
                  <Marker
                    key={p.id}
                    coordinate={{ latitude: p.lat, longitude: p.lng }}
                    title={p.name}
                    description={p.address}
                    image={collectionPointMarker}
                  >
                    <Callout>
                      <View style={{ width: 200 }}>
                        <Text style={{ fontWeight: "bold" }}>{p.name}</Text>
                        <Text>{p.address}</Text>
                        {pointSchedules.length > 0 ? (
                          pointSchedules.map((s, idx) => (
                            <TouchableOpacity
                              key={s.id}
                              style={[
                                styles.scheduleRow,
                                {
                                  backgroundColor:
                                    idx % 2 === 0 ? "#FFFFFF" : "#E3F6E3",
                                },
                              ]}
                              onPress={() =>
                                openGoogleMaps(p.lat, p.lng, p.name)
                              }
                            >
                              <Text>
                                {formatFullDate(s.collectionDate)},{" "}
                                {formatTime12h(s.collectionTime)}
                              </Text>
                              <StatusBadge status={s.status} />
                              <Feather
                                name="arrow-up-right"
                                size={20}
                                color="black"
                                style={{ marginLeft: "auto" }}
                              />
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text>No schedules</Text>
                        )}
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapView>
          ) : (
            <FlatList
              data={points}
              keyExtractor={(item) => item.id}
              renderItem={renderListItem}
              contentContainerStyle={{
                paddingTop: 200,
                paddingHorizontal: 16,
                paddingBottom: 16,
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </CustomBgColor>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Ensures it stays above the FlatList
    paddingBottom: 0, // Adds spacing below the overlay
  },
  listTabBackground: {
    backgroundColor: "#F0F1C5", // Background color for the List tab
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
    marginHorizontal: 20,
    marginTop: 30,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Poppins_400Regular" },
  toggleContainer: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  toggleButtons: {
    flexDirection: "row",
    backgroundColor: "#ccc",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toggleLabelBox: { marginVertical: 10, },
  toggleLabel: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333" },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#ccc",
  },
  toggleSelected: { backgroundColor: "white" },
  toggleOptionText: {
    fontSize: 16,
    color: "#555",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  toggleOptionTextSelected: {
    color: "#117D2E",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },
  listContainer: { paddingTop: 180, paddingHorizontal: 16, paddingBottom: 16 },
  listCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    color: "#117D2E",
    marginBottom: 10,
  },
  listAddress: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 6,
  },
  distanceText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 6,
  },
  scheduleText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  noSchedule: { fontSize: 15, fontFamily: "Poppins_400Regular", color: "#333" },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
    alignSelf: "flex-start", // keeps it snug to the content
  },
  statusBadgeText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    textAlign: "center", // horizontal centering
    textAlignVertical: "center", // vertical centering (Android only)
  },
});
