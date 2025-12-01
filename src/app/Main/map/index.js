// src/app/Main/map/MapSelector.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
  useColorScheme,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import CustomBgColor from "../../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { db } from "../../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import collectionPointMarker from "../../../assets/map/collectionPointMarker.png";
import closedCollectionPointMarker from "../../../assets/map/closedCollectionPointMarker.png";
import { useUser } from "../../../context/userContext";

/* =========================
   CONSTANTS
========================= */

const ORIGINAL_REGION = {
  latitude: 8.4542,
  longitude: 124.6319,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

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
  const params = useLocalSearchParams();

  const systemTheme = useColorScheme(); // "light" | "dark"

  const mapRef = useRef(null);
  const userRegionRef = useRef(null);

  // ✅ Prevent infinite zoom
  const hasAnimatedRef = useRef(false);

  const [searchText, setSearchText] = useState("");
  const [selectedView, setSelectedView] = useState("map");

  const [region, setRegion] = useState(ORIGINAL_REGION);
  const [marker, setMarker] = useState(null); // user location
  const [searchMarker, setSearchMarker] = useState(null); // searched location
  const [pickupFocusMarker, setPickupFocusMarker] = useState(null); // scheduled pickup marker (state kept, but no purple pin rendered)

  const [points, setPoints] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [flattenedData, setFlattenedData] = useState([]);

  /* ====================================
     FOCUS HANDLING (ENTER / LEAVE MAP)
  ===================================== */
  useFocusEffect(
    useCallback(() => {
      hasAnimatedRef.current = false;

      return () => {
        if (userRegionRef.current) {
          setRegion(userRegionRef.current);
        }
      };
    }, [])
  );

  /* =========================
     FIRESTORE (POINTS + SCHED)
  ========================== */
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

  /* =====================
     USER LOCATION
  ====================== */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const userRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      userRegionRef.current = userRegion;
      setMarker({ latitude, longitude });

      if (!params?.from) {
        setRegion(userRegion);
        mapRef.current?.animateToRegion(userRegion, 500);
      }
    })();
  }, [params?.navKey]);

  /* =========================================
     ✅ SMOOTH ONE-TIME ZOOM FROM NOTIF
  ========================================== */
  useEffect(() => {
    if (params.from !== "pickupScheduled") return;
    if (!params.lat || !params.lng) return;
    if (hasAnimatedRef.current) return;

    const lat = parseFloat(params.lat);
    const lng = parseFloat(params.lng);

    if (isNaN(lat) || isNaN(lng)) return;

    hasAnimatedRef.current = true;
    setSelectedView("map");

    const camera = {
      center: {
        latitude: lat,
        longitude: lng,
      },
      zoom: 18, // ✅ zoom level (adjust if needed)
      heading: 0,
      pitch: 0,
      altitude: 800,
    };

    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateCamera(camera, { duration: 1500 }); // ✅ smooth animation
      }
    }, 400);
  }, [params]);

  /* ================================
     COMBINE SCHEDULES + POINT DATA
  ================================= */
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

  /* ================================
     GEOAPIFY AUTOCOMPLETE
  ================================= */
  const fetchGeoapifySuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const apiKey = "21e4ce510e324d2c81b5caa1989a69d2"; // your Geoapify key
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        query
      )}&limit=5&format=json&apiKey=${apiKey}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data?.results) setSearchResults(data.results);
      else setSearchResults([]);
    } catch (err) {
      console.error("Geoapify fetch error:", err);
      setSearchResults([]);
    }
  };

  /* ================================
     RESET TO CURRENT USER LOCATION
  ================================= */
  const resetToUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const { latitude, longitude } = location.coords;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(newRegion);
      setMarker({ latitude, longitude });
      setSearchMarker(null);
      setPickupFocusMarker(null);

      setTimeout(() => {
        mapRef.current?.animateToRegion(newRegion, 0);
      }, 0);
    } catch (err) {
      console.error("Error resetting location:", err);
    }
  };

  /* ================================
     GROUPED COLORS BY POINT ID
  ================================= */
  const getGroupedColors = useMemo(() => {
    const colors = {};
    let lastColor = "#8CA34A";
    let lastPointId = null;

    flattenedData.forEach((item) => {
      if (item.pointId !== lastPointId) {
        lastColor = lastColor === "#8CA34A" ? "#C79E4B" : "#8CA34A";
      }
      colors[item.pointId] = lastColor;
      lastPointId = item.pointId;
    });

    return colors;
  }, [flattenedData]);

  /* ================================
     OPEN GOOGLE MAPS
  ================================= */
  const openGoogleMaps = (lat, lng) => {
    if (!marker) return;
    const { latitude, longitude } = marker;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url);
  };

  /* ================================
     RENDER SCHEDULE CARD
  ================================= */
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

  /* ================================
     RENDER
  ================================= */
  return (
    <CustomBgColor>
      <SafeAreaView style={{ flex: 1,}}>
        <View style={styles.container}>
          

          {/* 🔍 Search + Tabs */}
          <View
            style={[
              styles.topOverlayContainer,
              selectedView === "list" && styles.listTabBackground,
            ]}
          >

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
                      selectedView === "list" &&
                        styles.toggleOptionTextSelected,
                    ]}
                  >
                    List
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.toggleLabelBox}>
                <Text
                  style={[
                    styles.toggleLabel,
                    selectedView === "map" && {
                      color: systemTheme === "dark" ? "#FFFFFF" : "#000000",
                      color: systemTheme === "light" ? "#000000" : "#FFFFFF",
                    },
                    selectedView === "list" && { color: "#000000" },
                  ]}
                >
                  View Collection Points Around You
                </Text>
              </View>
            </View>
          </View>

          {/* Map or List */}
          {selectedView === "map" ? (
            <MapView
              style={{ flex: 1 }}
              region={region}
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
            >
              {/* User location marker */}
              {marker && (
                <Marker
                  coordinate={marker}
                  title={`${
                    userData?.firstName ? userData.firstName : "Guest"
                  }'s Location`}
                  description="This is where you are."
                />
              )}

              {/* Searched location marker */}
              {searchMarker && (
                <Marker
                  coordinate={searchMarker}
                  title="Searched Location"
                  description="Selected place from search"
                  pinColor="#0B57D0"
                />
              )}

              {/* ❌ REMOVED PURPLE PIN FOR SCHEDULED PICKUP */}
              {/* Collection points with status-based icons */}
              {points.map((p) => {
                const sched = schedules.find((s) => s.pointId === p.id);
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
                    }
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
                paddingTop: 155,
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
  toggleContainer: { marginHorizontal: 20, marginTop: 45 },
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
    paddingVertical: 15,
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
