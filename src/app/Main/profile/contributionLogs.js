import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";
import { db } from "../../../../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Svg, { Polygon } from "react-native-svg";

const screenWidth = Dimensions.get("window").width;

export default function ContributionLogs() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // receives ?id=<logId>

  const [loading, setLoading] = useState(true);
  const [logData, setLogData] = useState(null);
  const [rates, setRates] = useState([]);
  const [cardWidth, setCardWidth] = useState(0);

  const zigHeight = 14;
  const approxTeeth = 15;

  // 🔹 Fetch contribution log
  useEffect(() => {
    const fetchLog = async () => {
      try {
        if (!id) return;
        const ref = doc(db, "contribution_logs", id);
        const snap = await getDoc(ref);
        if (snap.exists()) setLogData(snap.data());
      } catch (err) {
        console.error("Error fetching log:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [id]);

  // 🔹 Fetch wasteConversionRates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const snap = await getDocs(collection(db, "wasteConversionRates"));
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRates(arr);
      } catch (err) {
        console.error("Error fetching wasteConversionRates:", err);
      }
    };
    fetchRates();
  }, []);

  // 🔹 Zigzag bottom edge
  const jaggedPoints = useMemo(() => {
    if (!cardWidth) return "";
    const step = Math.max(8, Math.floor(cardWidth / approxTeeth));
    let x = 0;
    const pts = ["0,0"];
    while (x < cardWidth) {
      const mid = x + step / 2;
      const next = Math.min(x + step, cardWidth);
      pts.push(`${x},0`);
      pts.push(`${mid},${zigHeight}`);
      pts.push(`${next},0`);
      x = next;
    }
    return pts.join(" ");
  }, [cardWidth]);

  // 🔹 Group rates by category
  const groupedRates = useMemo(() => {
    const grouped = {};
    rates.forEach((r) => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r);
    });
    return grouped;
  }, [rates]);

  // 🔹 Loading / Empty state
  if (loading) {
    return (
      <CustomBgColor>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#008243" />
          <Text style={{ marginTop: 10 }}>Loading contribution log...</Text>
        </View>
      </CustomBgColor>
    );
  }

  if (!logData) {
    return (
      <CustomBgColor>
        <View style={styles.center}>
          <Text style={{ fontSize: 16, textAlign: "center", color: "#333" }}>
            Contribution record not found.
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.push("/Main/profile")}
          >
            <Text style={styles.doneButtonText}>BACK TO PROFILE</Text>
          </TouchableOpacity>
        </View>
      </CustomBgColor>
    );
  }

  // 🔹 Destructure Firestore doc
  const {
    name,
    userEmail,
    weights = {},
    totalActualWeight,
    totalPoints,
    remarks,
    collectionPoint,
    collectionAddress,
    awardedByName,
    awardedByRole,
    createdAt,
    staffPhotoUrl,
  } = logData;

  // 🔹 Format readable date
  const dateStr = createdAt?.toDate
    ? createdAt.toDate().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

  // =====================
  //      RENDER UI
  // =====================
  return (
    <CustomBgColor>
      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={styles.cardWrapper}
          onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
        >
          <View style={styles.card}>
            {/* 🔹 Logo */}
            <Image
              source={require("../../../assets/profile/wordmarkLogo.png")}
              style={styles.wordmarkLogo}
              resizeMode="contain"
            />

            {/* 🔹 Collection Info */}
            {collectionPoint ? (
              <Text style={styles.addressText}>{collectionPoint}</Text>
            ) : null}
            {collectionAddress ? (
              <Text style={styles.addressSubText}>{collectionAddress}</Text>
            ) : null}

            <Text style={styles.dateText}>{dateStr}</Text>

            {/* 🔹 Recipient Info */}
            <Detail label="Awarded To" value={name || "—"} />
            <Detail label="Awardee Email" value={userEmail || "—"} />
            <Divider />

            {/* 🔹 Waste Breakdown */}
            <Text style={[styles.label, { marginBottom: 5 }]}>
              Waste Types (kg):
            </Text>
            {Object.entries(groupedRates).map(([category, items]) => {
              const relevant = items.filter((it) => weights[it.type]);
              if (relevant.length === 0) return null;

              return (
                <View key={category} style={{ marginBottom: 10 }}>
                  <View style={styles.categoryRow}>
                    <Text style={styles.categoryHeader}>{category}:</Text>
                    <Text
                      style={styles.valueRight}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {relevant[0].type}: {weights[relevant[0].type]} kg,
                    </Text>
                  </View>
                  {relevant.slice(1).map((it) => (
                    <View key={it.id} style={styles.rightValueRow}>
                      <Text style={styles.valueRightWrap}>
                        {it.type}: {weights[it.type]} kg,
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}

            <Divider />

            {/* 🔹 Totals */}
            <Detail
              label="Total Actual Weight"
              value={`${parseFloat(totalActualWeight || 0)} kg`}
            />
            <Detail
              label="Total Points Awarded"
              value={`${parseFloat(totalPoints || 0)} pts`}
            />
            <Detail label="Remarks" value={remarks || "None"} />
            <Divider />

            {/* 🔹 Staff Info */}
            <Detail
              label="Awarded By"
              value={`${awardedByName || "—"} (${awardedByRole || "—"})`}
            />

            {/* 🔹 Staff Proof Photo */}
            {staffPhotoUrl ? (
              <View style={{ width: "100%", marginTop: 10 }}>
                <Text style={styles.subHeader}>Proof Photo:</Text>
                <Image source={{ uri: staffPhotoUrl }} style={styles.image} />
              </View>
            ) : null}
          </View>

          {/* 🔹 Zigzag Bottom */}
          {cardWidth > 0 && (
            <Svg
              width={cardWidth}
              height={zigHeight}
              style={styles.zigSvg}
              preserveAspectRatio="none"
            >
              <Polygon points={jaggedPoints} fill="#FFFF" />
            </Svg>
          )}
        </View>

        {/* 🔹 Back Button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.push("/Main/profile")}
        >
          <Text style={styles.doneButtonText}>BACK TO PROFILE</Text>
        </TouchableOpacity>
      </ScrollView>
    </CustomBgColor>
  );
}

/* ---------- Reusable Components ---------- */
const Detail = ({ label, value }) => (
  <View style={styles.userDetailRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const Divider = () => (
  <View style={styles.dividerContainer}>
    <View style={styles.dividerLine} />
  </View>
);

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: "center" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  subHeader: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 8,
  },
  cardWrapper: { width: "100%", marginBottom: 20 },
  card: {
    backgroundColor: "#FFFF",
    padding: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  wordmarkLogo: {
    width: screenWidth * 0.3,
    height: screenWidth * 0.15,
    alignSelf: "center",
  },
  addressText: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    textAlign: "center",
    marginTop: 8,
  },
  addressSubText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#555",
    textAlign: "center",
    marginBottom: 5,
  },
  dateText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    textAlign: "center",
    marginBottom: 50,
  },
  zigSvg: { marginTop: -1 },
  userDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  label: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333" },
  value: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    textAlign: "right",
    flexShrink: 1,
  },
  categoryHeader: {
    fontFamily: "Poppins_700Bold",
    color: "#0E9247",
    marginBottom: 2,
  },
  image: { width: "100%", height: 220, borderRadius: 12, marginBottom: 10 },
  doneButton: {
    backgroundColor: "#008243",
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
    marginTop: 10,
  },
  doneButtonText: {
    fontFamily: "Poppins_700Bold",
    color: "white",
    fontSize: 16,
  },
  dividerContainer: { width: "100%", alignItems: "center", marginVertical: 10 },
  dividerLine: {
    borderBottomWidth: 1,
    borderColor: "#aaa",
    borderStyle: "dashed",
    width: "100%",
    marginBottom: 5,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rightValueRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  valueRight: {
    textAlign: "right",
    flexShrink: 1,
    flexWrap: "wrap",
    maxWidth: "65%",
    fontFamily: "Poppins_400Regular",
    color: "#333",
    fontSize: 15,
  },
  valueRightWrap: {
    textAlign: "right",
    flexWrap: "wrap",
    maxWidth: "80%",
    alignSelf: "flex-end",
    fontFamily: "Poppins_400Regular",
    color: "#333",
    fontSize: 15,
  },
});
