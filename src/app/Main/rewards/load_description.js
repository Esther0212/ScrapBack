import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import CustomBgColor from "../../../components/customBgColor";

// ✅ Firebase
import { db, auth } from "../../../../firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const LoadDescription = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Firestore reward doc ID
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false); // ✅ success modal
  const [failedModalVisible, setFailedModalVisible] = useState(false); // ✅ failed modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // ✅ Fetch reward by ID
  useEffect(() => {
    const fetchReward = async () => {
      try {
        const docRef = doc(db, "reward", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setReward({ id: docSnap.id, ...docSnap.data() });
        } else {
          setReward(null);
        }
      } catch (err) {
        console.error("Error fetching reward:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReward();
  }, [id]);

  // Small helper to ensure we have a signed-in user
  const getCurrentUser = () =>
    new Promise((resolve) => {
      if (auth.currentUser) return resolve(auth.currentUser);
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub();
        resolve(u || null);
      });
    });

  // ✅ Handle Redeem — with processing + fail modal
  const handleRedeem = async () => {
    setIsSubmitting(true);

    // Step 1: simulate processing delay
    setTimeout(async () => {
      try {
        // 2) Ensure user is logged in
        const user = await getCurrentUser();
        if (!user) {
          setIsSubmitting(false);
          Alert.alert("Login Required", "Please log in to redeem rewards.");
          return;
        }

        // 3) Ensure reward exists
        if (!reward) {
          setIsSubmitting(false);
          Alert.alert("Error", "Reward not found.");
          return;
        }

        // 4) Fetch user profile
        const userDocRef = doc(db, "user", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          setIsSubmitting(false);
          Alert.alert("Error", "User profile not found.");
          return;
        }

        const userProfile = userDocSnap.data();
        setUserProfile(userProfile);

        const userPoints = Number(userProfile.totalPoints || 0);
        const requiredPoints = Number(reward.points || 0);

        // ✅ Not enough points — show PACAFACO-style fail modal
        if (userPoints < requiredPoints) {
          setIsSubmitting(false);
          setFailedModalVisible(true);
          return;
        }

        // ✅ Proceed normally if enough points
        const formattedPoints = parseFloat(requiredPoints).toFixed(2);
        await addDoc(collection(db, "redemptionRequest"), {
          userId: user.uid,
          name: `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim(),
          contact: userProfile.contact || "N/A",
          rewardId: reward.id,
          rewardName: reward.title || "Reward",
          points: formattedPoints,
          status: "Pending",
          createdAt: serverTimestamp(),
        });

        setModalVisible(true);
      } catch (error) {
        console.error("Error during redemption:", error);
        Alert.alert(
          "Error",
          error?.message || "Failed to send redemption request. Try again later."
        );
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };

  // ✅ Loading state
  if (loading) {
    return (
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
        </SafeAreaView>
      </CustomBgColor>
    );
  }

  if (!reward) {
    return (
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.notFoundText}>No description found for this reward.</Text>
        </SafeAreaView>
      </CustomBgColor>
    );
  }

  // ✅ UI rendering
  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{reward.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Image */}
          <LinearGradient colors={["#E8F5E9", "#FFFFFF"]} style={styles.imageWrapper}>
            {reward.image && (
              <Image source={{ uri: reward.image }} style={styles.image} />
            )}
          </LinearGradient>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.text}>
              <Text style={styles.bold}>ABOUT ScrapBack{"\n"}</Text>
              ScrapBack is a digital recycling rewards system developed for PACAFACO
              residents. It converts recyclable materials into reward points for
              items like rice, mobile load, or vouchers.
            </Text>

            <Text style={styles.sectionTitle}>About this Reward</Text>
            <Text style={styles.text}>{reward.description}</Text>

            <Text style={styles.sectionTitle}>Points Required</Text>
            <Text style={styles.text}>{reward.points} pts</Text>

            <Text style={styles.sectionTitle}>How to Redeem Rewards</Text>
            <Text style={styles.text}>
              1. Go to any designated PACAFACO collection point.{"\n"}
              2. Show your QR code from the ScrapBack app to the staff.{"\n"}
              3. Staff will scan your QR and validate your points.{"\n"}
              4. Choose your reward and confirm redemption.{"\n"}
              5. Once approved, receive your reward on the spot or be notified for scheduled claiming.{"\n\n"}
              <Text style={styles.bold}>
                Note: Ensure you meet the minimum points required before attempting to redeem.
              </Text>
            </Text>

            {/* ✅ Redeem Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRedeem}
              disabled={isSubmitting}
              style={[styles.ctaButtonSolid, isSubmitting && { opacity: 0.7 }]}
            >
              <Text style={styles.ctaText}>
                {isSubmitting ? "Processing..." : `Redeem for ${reward.points} Points`}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ✅ Success Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Waiting for PACAFACO to accept your request...
              </Text>
              <TouchableOpacity
                style={styles.okButton}
                onPress={() => {
                  setModalVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.okButtonText}>OKAY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ❌ Failed Modal (PACAFACO style) */}
        <Modal
          visible={failedModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFailedModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalText, { color: "#B00020", fontWeight: "600" }]}>
                Processing Failed — Not Enough Points
              </Text>
              <TouchableOpacity
                style={[styles.okButton, { backgroundColor: "#B00020" }]}
                onPress={() => setFailedModalVisible(false)}
              >
                <Text style={styles.okButtonText}>OKAY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default LoadDescription;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
  },
  scrollContainer: {
    padding: 16,
    alignItems: "center",
    paddingBottom: 40,
  },
  imageWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 220,
    resizeMode: "contain",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 22,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginTop: 12,
    marginBottom: 6,
    color: "#2E7D32",
  },
  text: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#444",
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontFamily: "Poppins_700Bold",
  },
  ctaButtonSolid: {
    backgroundColor: "#008243",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: "center",
    shadowColor: "#008243",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  okButton: {
    backgroundColor: "#008243",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  okButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
});
