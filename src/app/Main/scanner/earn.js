import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useRouter } from "expo-router";
import { auth, db } from "../../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import CustomBgColor from "../../../components/customBgColor";

export default function EarnPointsQR() {
  const router = useRouter();
  const user = auth.currentUser;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⏳ expiry-based timer (SOURCE OF TRUTH)
  const EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes
  const [expiryTimestamp, setExpiryTimestamp] = useState(
    Date.now() + EXPIRY_DURATION
  );
  const [timeLeft, setTimeLeft] = useState(5 * 60);

  const appState = useRef(AppState.currentState);

  /* =========================
     TIMER – REAL TIME SAFE
  ========================= */

  const recalcTimeLeft = () => {
    const diff = Math.floor((expiryTimestamp - Date.now()) / 1000);
    setTimeLeft(diff > 0 ? diff : 0);
  };

  // foreground/background listener
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        recalcTimeLeft(); // 👈 FIX: recompute when app resumes
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [expiryTimestamp]);

  // live countdown while app is active
  useEffect(() => {
    const interval = setInterval(recalcTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiryTimestamp]);

  // regenerate QR when expired
  useEffect(() => {
    if (timeLeft === 0) {
      const newExpiry = Date.now() + EXPIRY_DURATION;
      setExpiryTimestamp(newExpiry);
      setTimeLeft(5 * 60);
    }
  }, [timeLeft]);

  /* =========================
     FETCH USER DATA
  ========================= */

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
      <CustomBgColor>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#0047AB" />
        </View>
      </CustomBgColor>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return (
    <CustomBgColor>
      <View style={styles.container}>
        <View style={styles.qrContainer}>
          <Text style={styles.description}>
            Staff can scan this QR to award points.
          </Text>

          {userData && timeLeft > 0 ? (
            <QRCode
              value={JSON.stringify({
                type: "earn",
                uid: user.uid,
                email: user.email,
                name: `${userData.firstName || ""} ${
                  userData.lastName || ""
                }`,
                exp: expiryTimestamp,
              })}
              size={180}
            />
          ) : (
            <Text style={styles.expiredMessage}>
              ⚠️ QR code expired.
            </Text>
          )}

          {timeLeft > 0 && (
            <Text style={styles.expiryText}>
              This QR code will expire in {minutes}:{seconds}
            </Text>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </CustomBgColor>
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
  qrContainer: {
    backgroundColor: "#D4F2B4",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  description: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  expiryText: {
    color: "red",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    marginBottom: 15,
    marginTop: 15,
  },
  closeButton: {
    backgroundColor: "#A5C78A",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  expiredMessage: {
    color: "red",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 40,
  },
  closeButtonText: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#000",
  },
  errorText: {
    color: "red",
    fontWeight: "bold",
    textAlign: "center",
  },
});