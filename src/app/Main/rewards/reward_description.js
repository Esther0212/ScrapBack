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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";
// ✅ Firebase
import { db } from "../../../../firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const RewardDescription = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Firestore doc ID

  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Modals
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [confirmMapModalVisible, setConfirmMapModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [failedModalVisible, setFailedModalVisible] = useState(false);
  // 🪙 Cash modal (user sets amount)
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Fetch reward
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

  // ✅ Helper: get current user
  const getCurrentUser = () =>
    new Promise((resolve) => {
      const authInstance = getAuth();
      if (authInstance.currentUser) return resolve(authInstance.currentUser);
      const unsub = onAuthStateChanged(authInstance, (u) => {
        unsub();
        resolve(u || null);
      });
    });

  // ✅ Send notification to all admins (shared adminNotifications collection)
// ✅ Send notification to all admins (shared adminNotifications collection)
const notifyAdmins = async (title, body, userId, type = "redemption") => {
  try {
    const auth = getAuth();
    const user = await new Promise((resolve) => {
      if (auth.currentUser) return resolve(auth.currentUser);
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub();
        resolve(u);
      });
    });

    if (!user) throw new Error("No authenticated user when sending admin notif.");

    console.log("🔹 Auth UID:", user.uid); // debug
    await addDoc(collection(db, "adminNotifications"), {
      title,
      body,
      userId,
      createdAt: serverTimestamp(),
      read: false,
      type,
    });

    console.log("✅ Sent admin notification");
  } catch (err) {
    console.error("❌ Error sending admin notification:", err);
  }
};

  // ✅ Send notification to current user
  const notifyUser = async (userId, title, body, type = "redemption") => {
    try {
      await addDoc(
        collection(db, "notifications", userId, "userNotifications"),
        {
          title,
          body,
          createdAt: serverTimestamp(),
          read: false,
          type,
        }
      );
      console.log("✅ Sent user notification");
    } catch (err) {
      console.error("❌ Error sending user notification:", err);
    }
  };

  // ✅ Handle redeem (online request)
  const handleRedeemOnline = async () => {
    setIsSubmitting(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert("Login Required", "Please log in to redeem rewards.");
        setIsSubmitting(false);
        return;
      }

      // Get user profile
      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        Alert.alert("Error", "User profile not found.");
        setIsSubmitting(false);
        return;
      }

      const userProfile = userDocSnap.data();
      const userPoints = Number(userProfile.points || 0);
      const requiredPoints = Number(reward.points || 0);

      if (userPoints < requiredPoints) {
        setIsSubmitting(false);
        setFailedModalVisible(true);
        return;
      }

      // ✅ Create redemption request
      await addDoc(collection(db, "redemptionRequest"), {
        userId: user.uid,
        name: `${userProfile.firstName || ""} ${
          userProfile.lastName || ""
        }`.trim(),
        contact: userProfile.contact || "N/A",
        email: userProfile.email || "",
        rewardId: reward.id,
        rewardName: reward.title || "Reward",
        rewardCategory: reward.category || "Other",
        points: requiredPoints,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // 🔔 Notify admins
      await notifyAdmins(
        "New Redemption Request",
        `User <b>${userProfile.firstName} ${userProfile.lastName}</b> requested to redeem <b>${reward.title}</b>.`,
        user.uid
      );

      // 🔔 Notify user
      await notifyUser(
        user.uid,
        "Redemption Request Submitted",
        `Your redemption request for <b>${reward.title}</b> has been successfully sent.`
      );

      setSuccessModalVisible(true);
    } catch (error) {
      console.error("Redemption error:", error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
      setChoiceModalVisible(false);
    }
  };

  // ✅ Handle redeem for CASH (user decides amount)
  const handleCashRedeem = async () => {
    if (
      !selectedAmount ||
      isNaN(selectedAmount) ||
      Number(selectedAmount) <= 0
    ) {
      Alert.alert("Invalid Amount", "Please enter a valid cash amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert("Login Required", "Please log in to redeem rewards.");
        setIsSubmitting(false);
        return;
      }

      const userDocSnap = await getDoc(doc(db, "user", user.uid));
      if (!userDocSnap.exists()) {
        Alert.alert("Error", "User profile not found.");
        setIsSubmitting(false);
        return;
      }

      const userData = userDocSnap.data();
      const userPoints = Number(userData.points || 0);
      const requiredPoints = Number(selectedAmount); // 1 peso = 1 point

      if (userPoints < requiredPoints) {
        setIsSubmitting(false);
        setCashModalVisible(false);
        setFailedModalVisible(true);
        return;
      }

      await addDoc(collection(db, "redemptionRequest"), {
        userId: user.uid,
        name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
        contact: userData.contact || "N/A",
        email: userData.email || "",
        rewardId: reward.id,
        rewardName: reward.title || "Cash Redemption",
        rewardCategory: reward.category || "cash",
        cashAmount: Number(selectedAmount),
        points: requiredPoints,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      // 🔔 Notify admins
      await notifyAdmins(
        "New Redemption Request",
        `User <b>${userData.firstName} ${userData.lastName}</b> requested to redeem ₱${selectedAmount}.`,
        user.uid
      );

      // 🔔 Notify user
      await notifyUser(
        user.uid,
        "Redemption Request Submitted",
        `Your cash redemption request of ₱${selectedAmount} has been successfully sent.`
      );
      setCashModalVisible(false);
      setSuccessModalVisible(true);
    } catch (err) {
      console.error("Cash redemption error:", err);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Handle redeem button click
  const handleRedeemClick = () => {
    const mode = reward.modeAvailable?.toLowerCase() || "online";
    const category = reward.category?.toLowerCase();

    // ✅ CASH: open modal to set amount
    if (category === "cash") {
      setCashModalVisible(true);
      return;
    }

    // Normal modes
    if (mode === "online") handleRedeemOnline();
    else if (mode === "onsite") setConfirmMapModalVisible(true);
    else if (mode === "both" || mode.includes("online"))
      setChoiceModalVisible(true);
    else handleRedeemOnline();
  };

  // ✅ Loading
  if (loading) {
    return (
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator
            size="large"
            color="#2E7D32"
            style={{ marginTop: 40 }}
          />
        </SafeAreaView>
      </CustomBgColor>
    );
  }

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

  // ✅ Redeemable mode badge helpers
  const formatMode = (mode) => {
    if (!mode) return "N/A";
    const formatted = mode.toString().trim().toLowerCase();
    if (formatted === "both") return "Online or Onsite";
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const getModeColor = (mode) => {
    switch (mode?.toLowerCase()) {
      case "online":
        return { borderColor: "#43A047", textColor: "#2E7D32" };
      case "onsite":
        return { borderColor: "#039BE5", textColor: "#0277BD" };
      case "both":
        return { borderColor: "#8E24AA", textColor: "#6A1B9A" };
      default:
        return { borderColor: "#BDBDBD", textColor: "#616161" };
    }
  };

  const modeStyle = getModeColor(reward.modeAvailable);

  const isUnavailable = reward.status?.toLowerCase() === "unavailable";

  // ✅ Header title logic
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

  return (
    <CustomBgColor>
      <Stack.Screen options={{ title: getHeaderTitle(reward?.category) }} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{reward.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Reward Image with Redeemable Badge */}
          <LinearGradient
            colors={["#E8F5E9", "#FFFFFF"]}
            style={[styles.imageWrapper, { position: "relative" }]}
          >
            {reward.image && (
              <Image source={{ uri: reward.image }} style={styles.image} />
            )}

            {reward.modeAvailable && (
              <View
                style={[
                  styles.modeBadge,
                  { borderColor: modeStyle.borderColor },
                ]}
              >
                <Text style={[styles.modeText, { color: modeStyle.textColor }]}>
                  Redeemable {formatMode(reward.modeAvailable)}
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Reward Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About this Reward</Text>
            <Text style={styles.text}>{reward.description}</Text>

            {reward.category?.toLowerCase() !== "cash" && (
              <>
                <Text style={styles.sectionTitle}>Points Required</Text>
                <Text style={styles.text}>{reward.points} pts</Text>
              </>
            )}

            <Text style={styles.sectionTitle}>How to Redeem</Text>
            <Text style={styles.text}>
              {reward.howToRedeem ||
                "Redemption instructions are not available at the moment."}
            </Text>

            <Text style={styles.bold}>
              Note: Ensure you meet the minimum points required before
              redeeming.
            </Text>

            {/* Redeem Button */}
            <TouchableOpacity
              activeOpacity={isUnavailable ? 1 : 0.85}
              onPress={() => {
                if (!isUnavailable) handleRedeemClick();
              }}
              style={[
                styles.ctaButtonSolid,
                isUnavailable && styles.disabledButton,
              ]}
              disabled={isSubmitting}
            >
              <Text
                style={[styles.ctaText, isUnavailable && styles.disabledText]}
              >
                {isUnavailable
                  ? "Not Available"
                  : isSubmitting
                  ? "Processing..."
                  : reward.category?.toLowerCase() === "cash"
                  ? "Redeem Cash Amount"
                  : `Redeem for ${reward.points} Points`}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ✅ Choice Modal for BOTH */}
        <Modal visible={choiceModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                How would you like to redeem this reward?
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={styles.choiceButton}
                  onPress={handleRedeemOnline}
                >
                  <Text style={styles.okButtonText}>Request Online</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.choiceButton, { backgroundColor: "#5F934A" }]}
                  onPress={() => {
                    setChoiceModalVisible(false);
                    setConfirmMapModalVisible(true);
                  }}
                >
                  <Text style={styles.okButtonText}>Go to Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ⚠️ Confirm Map Modal */}
        <Modal
          visible={confirmMapModalVisible}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Would you like to check available PACAFACO Collection Points?
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={[styles.choiceButton, { backgroundColor: "#5F934A" }]}
                  onPress={() => {
                    setConfirmMapModalVisible(false);
                    router.push("Main/map");
                  }}
                >
                  <Text style={styles.okButtonText}>Yes, Go</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.choiceButton, { backgroundColor: "#B00020" }]}
                  onPress={() => setConfirmMapModalVisible(false)}
                >
                  <Text style={styles.okButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 💵 CASH AMOUNT MODAL */}
        <Modal visible={cashModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalText, { fontWeight: "700" }]}>
                Enter the amount you want to redeem (₱)
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: "Poppins_600SemiBold",
                    color: "#2E7D32",
                    marginRight: 6,
                  }}
                >
                  ₱
                </Text>
                <TextInput
                  value={selectedAmount}
                  onChangeText={setSelectedAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    padding: 10,
                    width: 120,
                    textAlign: "center",
                    fontSize: 16,
                    color: "#333",
                  }}
                />
              </View>
              {/* Suggested Amount Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {[50, 100, 200, 500].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => setSelectedAmount(amount.toString())}
                    style={{
                      backgroundColor:
                        selectedAmount === amount.toString()
                          ? "#008243"
                          : "#E8F5E9",
                      borderColor: "#008243",
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      margin: 4,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          selectedAmount === amount.toString()
                            ? "white"
                            : "#2E7D32",
                        fontFamily: "Poppins_600SemiBold",
                      }}
                    >
                      ₱{amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.okButton,
                  { backgroundColor: "#008243", marginBottom: 10 },
                ]}
                onPress={handleCashRedeem}
                disabled={isSubmitting}
              >
                <Text style={styles.okButtonText}>
                  {isSubmitting ? "Submitting..." : "Request to Redeem"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.okButton, { backgroundColor: "#B00020" }]}
                onPress={() => setCashModalVisible(false)}
              >
                <Text style={styles.okButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ✅ Success Modal */}
        <Modal visible={successModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Your redemption request has been sent successfully!{"\n"}Waiting
                for PACAFACO approval.
              </Text>
              <TouchableOpacity
                style={styles.okButton}
                onPress={() => {
                  setSuccessModalVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.okButtonText}>OKAY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ❌ Failed Modal */}
        <Modal visible={failedModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text
                style={[
                  styles.modalText,
                  { color: "#B00020", fontWeight: "600" },
                ]}
              >
                Not Enough Points to Redeem
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
    resizeMode: "cover",
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
  disabledText: { color: "#666" },
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
  choiceButton: {
    backgroundColor: "#008243",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
  modeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  modeText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
});
