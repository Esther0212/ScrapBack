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
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import CustomBgColor from "../../../components/customBgColor";
import { Ionicons, Entypo, FontAwesome } from "@expo/vector-icons";
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

  // ✅ Prevent infinite zoom or repeated animations
  const hasAnimatedRef = useRef(false);

  const [selectedView, setSelectedView] = useState("map");

  const [region, setRegion] = useState(ORIGINAL_REGION);
  const [marker, setMarker] = useState(null); // user location
  const [searchMarker, setSearchMarker] = useState(null); // legacy state, not used for search UI
  const [pickupFocusMarker, setPickupFocusMarker] = useState(null); // kept but not rendered

  const [points, setPoints] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [flattenedData, setFlattenedData] = useState([]);

  const [isSatellite, setIsSatellite] = useState(false);

  /* ====================================
     FOCUS HANDLING (ENTER / LEAVE MAP)
     ==================================== */
  useFocusEffect(
    useCallback(() => {
      // whenever we enter the screen, allow a new one-time animation if params specify
      hasAnimatedRef.current = false;

      // If we come back to the map normally (no deep-link / no "from"),
      // center back on the user's last known location.
      if (!params?.from && userRegionRef.current) {
        setRegion(userRegionRef.current);
        if (mapRef.current) {
          mapRef.current.animateToRegion(userRegionRef.current, 500);
        }
      }

      return () => {
        // When leaving, remember user region as the "default"
        if (userRegionRef.current) {
          setRegion(userRegionRef.current);
        }
      };
    }, [params?.from])
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

      // If not coming from a deep link (like pickupScheduled/collectionPoint),
      // default center to user.
      if (!params?.from) {
        setRegion(userRegion);
        mapRef.current?.animateToRegion(userRegion, 500);
      }
    })();
  }, [params?.from]);

  /* =========================================
     ✅ SMOOTH ONE-TIME ZOOM FROM NOTIFICATIONS
     ========================================== */
  useEffect(() => {
    if (!params?.from) return;
    if (hasAnimatedRef.current) return;

    // Always ensure we're on the map tab when coming from notifications
    setSelectedView("map");

    // 1️⃣ From SCHEDULED PICKUP → use scheduledCoords from params.lat/lng
    if (params.from === "pickupScheduled") {
      if (!params.lat || !params.lng) return;

      const lat = parseFloat(params.lat);
      const lng = parseFloat(params.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      hasAnimatedRef.current = true;

      const camera = {
        center: {
          latitude: lat,
          longitude: lng,
        },
        zoom: 18,
        heading: 0,
        pitch: 0,
        altitude: 800,
      };

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateCamera(camera, { duration: 1500 });
        }
      }, 400);

      return;
    }

    // 2️⃣ From COLLECTION POINT → look up in Firestore (collectionPoint)
    if (params.from === "collectionPoint" && params.pointId && points.length) {
      const point = points.find((p) => p.id === params.pointId);
      if (!point) return;

      const lat = typeof point.lat === "number" ? point.lat : null;
      const lng = typeof point.lng === "number" ? point.lng : null;
      if (lat == null || lng == null) return;

      hasAnimatedRef.current = true;

      const camera = {
        center: {
          latitude: lat,
          longitude: lng,
        },
        zoom: 18,
        heading: 0,
        pitch: 0,
        altitude: 800,
      };

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateCamera(camera, { duration: 1500 });
        }
      }, 400);
    }
  }, [params, points]);

  /* ================================
     COMBINE SCHEDULES + POINT DATA
     ================================ */
  useEffect(() => {
    if (!points.length || !schedules.length) {
      setFlattenedData([]);
      return;
    }

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
     RESET TO CURRENT USER LOCATION
     ================================ */
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

      userRegionRef.current = newRegion;
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
     ================================ */
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
     ================================ */
  const openGoogleMaps = async (lat, lng) => {
    if (!marker) return;

    const { latitude, longitude } = marker;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${lat},${lng}&travelmode=driving`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn("Cannot open Google Maps");
      }
    } catch (err) {
      console.error("Google Maps error:", err);
    }
  };

  /* ================================
     RENDER SCHEDULE CARD
     ================================ */
  const renderScheduleCard = ({ item }) => {
    const borderColor = getGroupedColors[item.pointId] || "#8CA34A";

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.scheduleCard, { borderLeftColor: borderColor }]}
        onPress={() => openGoogleMaps(item.lat, item.lng)}
      >
        <View style={styles.cardTitleWrapper}>
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
     MAP MARKERS (GREEN / GRAY)
     ================================ */
  const renderMapMarkers = () => {
    return points.map((p) => {
      const sched = schedules.find((s) => s.pointId === p.id);
      const status = sched?.status ? sched.status.toLowerCase() : "";
      const isClosed = status === "closed" || status === "close"; // handles "Closed" or "Close"

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
          image={isClosed ? closedCollectionPointMarker : collectionPointMarker}
        />
      );
    });
  };

  /* ================================
     RENDER
     ================================ */
  return (
    <CustomBgColor>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* 🔍 Search + Tabs + Header Actions (copy UX; only LIST tab gets edit controls) */}
          <View
            style={[
              styles.topOverlayContainer,
              selectedView === "list" && styles.listTabBackground,
            ]}
          >
            {/* Tabs + Header Actions */}
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

              {/* Header row with label + edit controls */}
              <View style={styles.headerRow}>
                {/* ONLY the label text color follows the MapView/OS color scheme.
                    When on the MAP tab: text color = white if system dark, black if system light.
                    When on the LIST tab: text color always black (as requested). */}
                <Text
                  style={[
                    styles.toggleLabel,

                    // 📍 MAP TAB
                    selectedView === "map" && {
                      color: isSatellite
                        ? "#FFFFFF" // 🛰 FORCE WHITE when satellite is ON
                        : systemTheme === "dark"
                          ? "#FFFFFF"
                          : "#000000",
                    },

                    // 📋 LIST TAB (always black)
                    selectedView === "list" && { color: "#000000" },
                  ]}
                >
                  View Nearby Collection Points
                </Text>
              </View>
            </View>
          </View>

          {/* Map or List */}
          {selectedView === "map" ? (
            <>
              <MapView
                style={{ flex: 1 }}
                region={region}
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                mapType={isSatellite ? "hybrid" : "standard"}
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

                {/* Searched location marker (state kept, but you said no search UI; this won't be set anymore) */}
                {searchMarker && (
                  <Marker
                    coordinate={searchMarker}
                    title="Searched Location"
                    description="Selected place from search"
                    pinColor="#0B57D0"
                  />
                )}

                {/* Collection points with status-based icons from collectionSchedule */}
                {renderMapMarkers()}
              </MapView>
              {/* 🛰 MAP TYPE TOGGLE (same as Signup) */}
              <TouchableOpacity
                style={styles.mapToggleButton}
                onPress={() => setIsSatellite(!isSatellite)}
                activeOpacity={0.8}
              >
                <FontAwesome
                  name={isSatellite ? "map" : "map-o"}
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
            </>
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

          {/* Optional “recenter” button could be added here if you like, using resetToUserLocation() */}
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
    paddingBottom: 0,
  },
  listTabBackground: { backgroundColor: "#F0F1C5" },

  toggleContainer: { marginHorizontal: 20, marginTop: 45 },
  toggleButtons: {
    flexDirection: "row",
    backgroundColor: "#ccc",
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#ccc",
  },
  toggleSelected: { backgroundColor: "white" },
  toggleOptionText: {
    fontSize: 15,
    color: "#555",
    fontFamily: "Poppins_400Regular",
  },
  toggleOptionTextSelected: {
    color: "#117D2E",
    fontFamily: "Poppins_700Bold",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    paddingTop: 10,
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
    marginBottom: 4,
  },
  cardTitleWrapper: {
    flex: 1,
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
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  mapToggleButton: {
    position: "absolute",
    top: 110, // below header
    right: 16,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    zIndex: 20,
  },
});
