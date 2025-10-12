// src/app/Main/profile/redemptionLogs.js
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
import { doc, getDoc } from "firebase/firestore";
import Svg, { Polygon } from "react-native-svg";

const screenWidth = Dimensions.get("window").width;

export default function RedemptionLogs() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // redemption log ID

  const [loading, setLoading] = useState(true);
  const [logData, setLogData] = useState(null);
  const [cardWidth, setCardWidth] = useState(0);
  const zigHeight = 14;
  const approxTeeth = 15;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const ref = doc(db, "redemption_logs", id);
        const snap = await getDoc(ref);
        if (snap.exists()) setLogData(snap.data());
      } catch (err) {
        console.error("Error fetching redemption log:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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

  if (loading) {
    return (
      <CustomBgColor>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#008243" />
          <Text style={{ marginTop: 10 }}>Loading redemption details...</Text>
        </View>
      </CustomBgColor>
    );
  }

  if (!logData) {
    return (
      <CustomBgColor>
        <View style={styles.center}>
          <Text style={{ fontSize: 16, textAlign: "center", color: "#333" }}>
            Redemption record not found.
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

  const {
    name,
    userEmail,
    rewardCategory,
    rewardName,
    points,
    remarks,
    collectionPoint,
    collectionAddress,
    redeemedByName,
    redeemedByRole,
    proofPhotoUrl,
    createdAt,
  } = logData;

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

  return (
    <CustomBgColor>
      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={styles.cardWrapper}
          onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
        >
          <View style={styles.card}>
            <Image
              source={require("../../../assets/profile/wordmarkLogo.png")}
              style={styles.wordmarkLogo}
              resizeMode="contain"
            />

            {collectionPoint ? (
              <Text style={styles.addressText}>{collectionPoint}</Text>
            ) : null}
            {collectionAddress ? (
              <Text style={styles.addressSubText}>{collectionAddress}</Text>
            ) : null}

            <Text style={styles.dateText}>{dateStr}</Text>

            <Detail label="Redeemed By" value={name || "—"} />
            <Detail label="User Email" value={userEmail || "—"} />
            <Divider />

            <Detail label="Reward" value={rewardName || "—"} />
            <Detail label="Category" value={rewardCategory || "—"} />
            <Detail label="Points Deducted" value={`-${points || 0} pts`} />
            <Detail label="Remarks" value={remarks || "None"} />
            <Divider />

            <Detail
              label="Processed By"
              value={`${redeemedByName || "—"} (${redeemedByRole || "—"})`}
            />

            {proofPhotoUrl ? (
              <View style={{ width: "100%", marginTop: 10 }}>
                <Text style={styles.subHeader}>Proof Photo:</Text>
                <Image source={{ uri: proofPhotoUrl }} style={styles.image} />
              </View>
            ) : null}
          </View>

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

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, alignItems: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  subHeader: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 8,
  },
  cardWrapper: { width: "100%", marginBottom: 20 },
  card: { backgroundColor: "#FFFF", padding: 20 },
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
    marginBottom: 40,
  },
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
  },
});
