// src/app/Main/map/MapSelector.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
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
import MapView, { Marker, Callout } from "react-native-maps";
import CustomBgColor from "../../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import { db } from "../../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import collectionPointMarker from "../../../assets/map/collectionPointMarker.png";
import closedCollectionPointMarker from "../../../assets/map/closedCollectionPointMarker.png";
import { useUser } from "../../../context/userContext";

// 🔹 Convert 24-hour to 12-hour format
const formatTime12h = (time24) => {
  if (!time24) return "";
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
};

// 🔹 Convert date to readable form
const formatFullDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString(undefined, options);
};

// 🔹 Distance (Haversine)
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

// 🔹 Badge component
const StatusBadge = ({ status }) => {
  const isOpen = status === "Open";
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: isOpen ? "#B9F8CF" : "#FFC9C9" },
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
  const { userData } = useUser();

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
  const [marker, setMarker] = useState(null);
  const [points, setPoints] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [flattenedData, setFlattenedData] = useState([]);

  // 🔥 Load Firestore data
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

  // 📍 User location + distances
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
      } catch (error) {
        console.warn("Location error:", error);
      }
    })();
  }, []);

  // Combine schedules with their corresponding point data
  useEffect(() => {
    if (!points.length || !schedules.length) return;

    const flattened = schedules.map((s) => {
      const point = points.find((p) => p.id === s.pointId);
      if (!point) return null;

      const dist =
        marker && point.lat && point.lng
          ? getDistanceKm(
              marker.latitude,
              marker.longitude,
              point.lat,
              point.lng
            )
          : null;

      return {
        id: s.id,
        pointId: s.pointId,
        name: point.name,
        address: point.address,
        lat: point.lat,
        lng: point.lng,
        collectionDate: s.collectionDate,
        collectionTime: s.collectionTime,
        status: s.status,
        distance: dist,
      };
    });

    const filtered = flattened.filter(Boolean);
    filtered.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
    setFlattenedData(filtered);
  }, [points, schedules, marker]);

  // 🔹 Alternate color but group by pointId
  const getGroupedColors = useMemo(() => {
    const colors = {};
    let lastColor = "#8CA34A";
    let lastPointId = null;

    flattenedData.forEach((item) => {
      if (item.pointId !== lastPointId) {
        // Alternate color when new pointId appears
        lastColor = lastColor === "#8CA34A" ? "#C79E4B" : "#8CA34A";
      }
      colors[item.pointId] = lastColor;
      lastPointId = item.pointId;
    });

    return colors;
  }, [flattenedData]);

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

  // Open Google Maps navigation
  const openGoogleMaps = (lat, lng) => {
    if (!marker) return;
    const { latitude, longitude } = marker;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url);
  };

  // 🔹 Render each schedule card (with consistent color per collectionPoint)
  const renderScheduleCard = ({ item }) => {
    const borderColor = getGroupedColors[item.pointId] || "#8CA34A";

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.scheduleCard, { borderLeftColor: borderColor }]}
        onPress={() => openGoogleMaps(item.lat, item.lng)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.cardAddress}>{item.address}</Text>

        {/* Lat/Lng */}
        <View style={styles.iconRow}>
          <Ionicons
            name="pin"
            size={20}
            color="#008243"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.cardLatLng}>
            {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
          </Text>
        </View>

        {/* Schedule */}
        <View style={styles.cardScheduleBox}>
          <View style={styles.iconRow}>
            <Ionicons
              name="today"
              size={20}
              color="#008243"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.cardSchedule}>
              {formatFullDate(item.collectionDate)}
            </Text>
          </View>

          <View style={styles.iconRow}>
            <Ionicons
              name="time"
              size={20}
              color="#008243"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.cardSchedule}>
              {formatTime12h(item.collectionTime)}
            </Text>
          </View>
        </View>

        {item.distance && (
          <View style={styles.iconRow}>
            <Entypo
              name="ruler"
              size={20}
              color="#008243"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.cardDistance}>
              Distance: {item.distance.toFixed(2)} km
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={{ flex: 1, paddingTop: 25 }}>
        <View style={styles.container}>
          {/* Top Controls */}
          <View
            style={[
              styles.topOverlayContainer,
              selectedView === "list" && styles.listTabBackground,
            ]}
          >
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
              />
            </View>

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
                      selectedView === "list" &&
                        styles.toggleOptionTextSelected,
                    ]}
                  >
                    List
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.toggleLabelBox}>
                <Text style={styles.toggleLabel}>View Collection Points Around You</Text>
              </View>
            </View>
          </View>

          {/* Map or List */}
          {selectedView === "map" ? (
            <MapView style={{ flex: 1 }} region={region} ref={mapRef}>
              {marker && (
                <Marker
                  coordinate={marker}
                  title={`${
                    userData?.firstName ? userData.firstName : "Guest"
                  }'s Location`}
                  description="This is where you are."
                />
              )}

              {/* ✅ Updated Marker Mapping with Status-Based Icon */}
              {points.map((p) => {
                // find the latest schedule for this point
                const sched = schedules.find((s) => s.pointId === p.id);

                // if schedule found, use its status
                const isClosed = sched?.status?.toLowerCase() === "closed";

                return (
                  <Marker
                    key={p.id}
                    coordinate={{ latitude: p.lat, longitude: p.lng }}
                    title={p.name}
                    description={
                      sched
                        ? `${p.address}\nStatus: ${sched.status}\nDate: ${sched.collectionDate} ${sched.collectionTime}`
                        : p.address
                    }
                    image={
                      isClosed
                        ? closedCollectionPointMarker
                        : collectionPointMarker
                    } // ✅ dynamic icon
                  />
                );
              })}
            </MapView>
          ) : (
            <FlatList
              data={flattenedData}
              keyExtractor={(item) => item.id}
              renderItem={renderScheduleCard}
              contentContainerStyle={{
                paddingTop: 200,
                paddingHorizontal: 16,
                paddingBottom: 20,
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </CustomBgColor>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  container: { flex: 1 },
  topOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  listTabBackground: { backgroundColor: "#F0F1C5" },
  searchBox: {
    backgroundColor: "white",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 3,
    marginHorizontal: 20,
    marginTop: 30,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Poppins_400Regular" },
  toggleContainer: { marginHorizontal: 20, marginTop: 10 },
  toggleButtons: {
    flexDirection: "row",
    backgroundColor: "#ccc",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  toggleLabelBox: { marginVertical: 10 },
  toggleLabel: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333" },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#ccc",
  },
  toggleSelected: { backgroundColor: "white" },
  toggleOptionText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#555",
  },
  toggleOptionTextSelected: {
    color: "#117D2E",
    fontFamily: "Poppins_700Bold",
  },

  scheduleCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#117D2E",
  },
  cardAddress: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginTop: 4,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardLatLng: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#555",
  },
  cardScheduleBox: {
    marginTop: 10,
    backgroundColor: "#E6F4EA",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  cardSchedule: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#333",
  },
  cardDistance: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
});
