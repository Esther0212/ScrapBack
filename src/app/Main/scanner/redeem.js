import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useRouter } from "expo-router";
import { auth, db } from "../../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import CustomBgColor from "../../../components/customBgColor";

export default function RedeemRewardsQR() {
  const router = useRouter();
  const user = auth.currentUser;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // countdown state
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes
  const [expiryTimestamp, setExpiryTimestamp] = useState(
    Date.now() + 5 * 60 * 1000
  );

  // countdown logic
  useEffect(() => {
    if (timeLeft <= 0) {
      const newExpiry = Date.now() + 5 * 60 * 1000;
      setExpiryTimestamp(newExpiry);
      setTimeLeft(5 * 60);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  // fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "user", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("⚠️ No user document found in Firestore");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (!user) {
    return <Text style={styles.errorText}>Please log in</Text>;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Redeem Rewards QR Code</Text>
      <View style={styles.qrContainer}>
        <Text style={styles.description}>
          Generate your QR code for staff to scan and deduct points for your reward.
        </Text>

        <Image
          source={require("../../../assets/scanner/sample-qr.png")}
          style={styles.qrImage}
        />

        <Text style={styles.expiryText}>This QR code will expire in 2:35 minutes</Text>

        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>CLOSE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  qrContainer: {
    backgroundColor: "#D4F2B4",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  description: { fontSize: 14, textAlign: "center", marginBottom: 20 },
  expiryText: { color: "red", fontWeight: "500", marginBottom: 15 },
  expiredMessage: {
    color: "red",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 40,
  },
  closeButton: {
    backgroundColor: "#A5C78A",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  closeButtonText: { fontWeight: "bold", color: "#000" },
  errorText: { color: "red", fontWeight: "bold", textAlign: "center" },
});
