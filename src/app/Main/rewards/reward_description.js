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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";

// ✅ Firebase
import { db, auth } from "../../../../firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const RewardDescription = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Determine title based on category
  const getHeaderTitle = (category) => {
    switch (category) {
      case "gcash":
        return "Gcash Offer";
      case "load":
        return "Load Offer";
      case "sack":
        return "Rice Offer";
      default:
        return "Reward Details";
    }
  };

  // ✅ Fetch reward
  useEffect(() => {
    const fetchReward = async () => {
      try {
        const ref = doc(db, "reward", id);
        const snap = await getDoc(ref);
        if (snap.exists()) setReward({ id: snap.id, ...snap.data() });
        else setReward(null);
      } catch (error) {
        console.error("Error fetching reward:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReward();
  }, [id]);

  const handleRedeem = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to redeem rewards.");
      return;
    }

    try {
      setSaving(true);

      // 🔹 Fetch user data
      const userRef = doc(db, "user", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      // 🔹 Combine firstName + lastName into name
      const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

      // 🔹 Add Firestore document in redemptionRequest
      await addDoc(collection(db, "redemptionRequest"), {
        userId: user.uid,
        name: fullName || "Unknown User",
        rewardId: reward.id,
        contact: userData.contact || "",
        rewardName: reward.title || reward.rewardName || "Unknown Reward",
        points: reward.points?.toString() || "0",
        status: "Pending",
        adminNote: "",
        action: "Archive",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setModalVisible(true);
    } catch (error) {
      console.error("Error saving redemption request:", error);
      Alert.alert("Error", "Failed to submit redemption request.");
    } finally {
      setSaving(false);
    }
  };


  // ✅ Loading UI
  if (loading) {
    return (
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
        </SafeAreaView>
      </CustomBgColor>
    );
  }

  // ✅ Not found
  if (!reward) {
    return (
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.notFoundText}>
            No description found for this reward.
          </Text>
        </SafeAreaView>
      </CustomBgColor>
    );
  }

  const isUnavailable = reward.status === "unavailable";

  return (
    <CustomBgColor>
      <Stack.Screen options={{ title: getHeaderTitle(reward?.category) }} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{reward.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <LinearGradient colors={["#E8F5E9", "#FFFFFF"]} style={styles.imageWrapper}>
            {reward.image && (
              <Image source={{ uri: reward.image }} style={styles.image} />
            )}
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About this Reward</Text>
            <Text style={styles.text}>{reward.description}</Text>

            <Text style={styles.sectionTitle}>Points Required</Text>
            <Text style={styles.text}>{reward.points} pts</Text>

            <Text style={styles.sectionTitle}>How to Redeem Rewards</Text>
            <Text style={styles.text}>
              {reward.howToRedeem ||
                "Redemption instructions are not available at the moment."}
            </Text>

            <Text style={styles.bold}>
              Note: Ensure you meet the minimum points required before redeeming.
            </Text>

            {/* Redeem Button */}
            <TouchableOpacity
              activeOpacity={isUnavailable ? 1 : 0.85}
              onPress={() => {
                if (!isUnavailable && !saving) handleRedeem();
              }}
              style={[
                styles.ctaButtonSolid,
                isUnavailable && styles.disabledButton,
              ]}
              disabled={saving}
            >
              <Text
                style={[
                  styles.ctaText,
                  isUnavailable && styles.disabledText,
                ]}
              >
                {isUnavailable
                  ? "Not Available"
                  : saving
                  ? "Submitting..."
                  : `Redeem for ${reward.points} Points`}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Confirmation Modal */}
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
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default RewardDescription;

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
  bold: { fontFamily: "Poppins_700Bold" },
  ctaButtonSolid: {
    backgroundColor: "#008243",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "90%",
    shadowColor: "#008243",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    shadowOpacity: 0,
  },
  ctaText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  disabledText: {
    color: "#666",
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
