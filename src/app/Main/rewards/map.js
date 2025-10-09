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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import collectionPointMarker from "../../../assets/map/collectionPointMarker.png";

// 🔹 Distance calculation (Haversine)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// 🔹 Format date
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// 🔹 Status badge
const StatusBadge = ({ status }) => {
  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: status === "Open" ? "#B9F8CF" : "#FFC9C9",
        },
      ]}
    >
      <Text
        style={{
          color: status === "Open" ? "#016630" : "#9F0712",
          fontWeight: "bold",
        }}
      >
        {status}
      </Text>
    </View>
  );
};

export default function Map() {
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
  const [userMarker, setUserMarker] = useState(null);
  const [points, setPoints] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // 🔥 Load Firestore points & schedules
  useEffect(() => {
    const unsubPoints = onSnapshot(collection(db, "collectionPoint"), (snap) => {
      setPoints(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
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

  // ✅ Filter OPEN points only
  const getOpenPoints = () => {
    return points.filter((p) =>
      schedules.some(
        (s) => s.pointId === p.id && s.status === "Open"
      )
    );
  };

  // 📍 Get user location & nearest 3 open points
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setUserMarker({ latitude, longitude });

        const openPoints = getOpenPoints();
        if (openPoints.length > 0) {
          const sorted = openPoints
            .map((p) => ({
              ...p,
              distance: getDistanceKm(latitude, longitude, p.lat, p.lng),
            }))
            .sort((a, b) => a.distance - b.distance);

          const nearestThree = sorted.slice(0, 3);

          mapRef.current?.fitToCoordinates(
            [
              { latitude, longitude },
              ...nearestThree.map((p) => ({ latitude: p.lat, longitude: p.lng })),
            ],
            {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            }
          );
        }
      } catch (err) {
        console.warn("Location error:", err);
      }
    })();
  }, [points, schedules]);

  // 🔍 Search
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
        setUserMarker({ latitude, longitude });
        mapRef.current?.animateToRegion(newRegion, 1000);
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // 🔗 Google Maps directions
  const openGoogleMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url);
  };

  // ✅ Get all schedules for a point (only Open)
  const getOpenSchedules = (pointId) => {
    return schedules
      .filter((s) => s.pointId === pointId && s.status === "Open")
      .sort((a, b) => new Date(a.collectionDate) - new Date(b.collectionDate));
  };

  // 📋 Render list item
  const renderListItem = ({ item }) => {
    let distance = null;
    if (userMarker) {
      distance = getDistanceKm(
        userMarker.latitude,
        userMarker.longitude,
        item.lat,
        item.lng
      ).toFixed(2);
    }
    const pointSchedules = getOpenSchedules(item.id);

    return (
      <View style={styles.listCard}>
        <Text style={styles.listTitle}>{item.name}</Text>
        <Text style={styles.listAddress}>{item.address}</Text>
        {distance && (
          <Text style={styles.distanceText}>Distance: {distance} km</Text>
        )}
        {pointSchedules.length > 0 ? (
          pointSchedules.map((s) => (
            <View key={s.id} style={styles.scheduleRow}>
              <Text style={styles.scheduleText}>{formatDate(s.collectionDate)}</Text>
              <StatusBadge status={s.status} />
            </View>
          ))
        ) : (
          <Text style={styles.noSchedule}>No Open schedules</Text>
        )}
        <TouchableOpacity
          style={styles.directionButton}
          onPress={() => openGoogleMaps(item.lat, item.lng)}
        >
          <Text style={styles.directionButtonText}>Show Directions</Text>
          <MaterialIcons name="directions" size={28} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={{ flex: 1}}>
        <View style={styles.container}>
          {/* 🔍 Search */}
          <View style={styles.topOverlay}>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
              />
            </View>
          </View>

          {/* Toggle Map/List */}
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
              <Text style={styles.toggleLabel}>Open Drop-off stations</Text>
            </View>
          </View>

          {/* Map or List */}
          {selectedView === "map" ? (
            <MapView style={{ flex: 1 }} region={region} ref={mapRef}>
              <UrlTile
                urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
                maximumZ={19}
              />

              {/* User marker */}
              {userMarker && (
                <Marker coordinate={userMarker}>
                  <Callout>
                    <Text>Your Location</Text>
                  </Callout>
                </Marker>
              )}

              {/* Open collection points only */}
              {getOpenPoints().map((p) => {
                let distance = null;
                if (userMarker) {
                  distance = getDistanceKm(
                    userMarker.latitude,
                    userMarker.longitude,
                    p.lat,
                    p.lng
                  ).toFixed(2);
                }
                const pointSchedules = getOpenSchedules(p.id);

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
                        {distance && <Text>Distance: {distance} km</Text>}
                        {pointSchedules.length > 0 ? (
                          pointSchedules.map((s) => (
                            <View key={s.id} style={styles.scheduleRow}>
                              <Text>{formatDate(s.collectionDate)}</Text>
                              <StatusBadge status={s.status} />
                            </View>
                          ))
                        ) : (
                          <Text>No Open schedules</Text>
                        )}
                        <TouchableOpacity
                          style={[styles.directionButton, { marginTop: 8 }]}
                          onPress={() => openGoogleMaps(p.lat, p.lng)}
                        >
                          <Text style={styles.directionButtonText}>
                            Navigate
                          </Text>
                          <MaterialIcons
                            name="directions"
                            size={20}
                            color="white"
                          />
                        </TouchableOpacity>
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapView>
          ) : (
            <FlatList
              data={getOpenPoints()}
              keyExtractor={(item) => item.id}
              renderItem={renderListItem}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </SafeAreaView>
    </CustomBgColor>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  toggleContainer: {
    position: "absolute",
    top: 90,
    left: 20,
    right: 20,
    zIndex: 10,
    marginTop: 10,
  },
  toggleLabelBox: { marginBottom: 8 },
  toggleLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
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
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#ccc",
  },
  toggleSelected: { backgroundColor: "white" },
  toggleOptionText: { fontSize: 16, color: "#555" },
  toggleOptionTextSelected: { color: "#117D2E", fontWeight: "bold" },
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
    fontWeight: "bold",
    color: "#117D2E",
    marginBottom: 10,
  },
  listAddress: { fontSize: 14, color: "#555", marginBottom: 6 },
  distanceText: { fontSize: 14, color: "#333" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  scheduleText: { fontSize: 14, color: "#333" },
  noSchedule: { fontSize: 14, color: "#aaa", fontStyle: "italic" },
  directionButton: {
    marginTop: 8,
    backgroundColor: "#117D2E",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  directionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 6,
  },
});
