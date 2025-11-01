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
  TextInput,
  Animated,
  Platform,
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
  query,
  where, 
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const RewardDescription = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Firestore doc ID

  const [reward, setReward] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasPendingRedemption, setHasPendingRedemption] = useState(false);


  // 🔹 Modals
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [confirmMapModalVisible, setConfirmMapModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [failedModalVisible, setFailedModalVisible] = useState(false);
  // 🪙 Cash modal (user sets amount)
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Toast animation
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const showAnimatedToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setToastVisible(false));
      }, 2000);
    });
  };

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

  // ✅ Fetch user points
  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;
        const userRef = doc(db, "user", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setUserPoints(Number(snap.data().points || 0));
        }
      } catch (err) {
        console.error("Error fetching user points:", err);
      }
    };
    fetchUserPoints();
  }, []);

  // ✅ Check if user already has pending redemption for this reward
  useEffect(() => {
    const checkPendingRedemption = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || !id) return;

        const q = query(
          collection(db, "redemptionRequest"),
          where("userId", "==", user.uid),
          where("rewardId", "==", id),
          where("status", "in", ["pending", "processing"])
        );
        const snap = await getDocs(q);
        setHasPendingRedemption(!snap.empty);
      } catch (err) {
        console.error("Error checking pending redemption:", err);
      }
    };
    checkPendingRedemption();
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

      if (!user)
        throw new Error("No authenticated user when sending admin notif.");

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
        showAnimatedToast("Please log in to redeem rewards.");
        setIsSubmitting(false);
        return;
      }

      // Get user profile
      const userDocRef = doc(db, "user", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        showAnimatedToast("User profile not found.");
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
        seenByAdmin: false, // 👈 add this
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
      showAnimatedToast("Something went wrong. Please try again later.");
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
      showAnimatedToast("Please enter a valid cash amount.");
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
        seenByAdmin: false, // 👈 add this
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
          {toastVisible && (
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: Platform.OS === "ios" ? 60 : 40,
                  left: "6%",
                  right: "6%",
                  backgroundColor: "rgba(14,146,71,0.95)",
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2000,
                  elevation: 8,
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: "Poppins_700Bold",
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                {toastMessage}
              </Text>
            </Animated.View>
          )}
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
  const canRedeem =
  reward &&
  reward.category?.toLowerCase() !== "cash" &&
  userPoints >= Number(reward.points || 0) &&
  !hasPendingRedemption;


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
        <Text
          style={{
            textAlign: "center",
            fontFamily: "Poppins_700Bold",
            fontSize: 24,
            color: userPoints >= reward.points ? "#2E7D32" : "#B00020",
            marginBottom: 3,
            marginTop: -10
          }}
        >
          Your Points: {userPoints} pts
        </Text>


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
              activeOpacity={canRedeem && !isUnavailable && !isSubmitting ? 0.85 : 1}
              onPress={() => {
                if (canRedeem && !isUnavailable && !isSubmitting) handleRedeemClick();
              }}
              style={[
                styles.ctaButtonSolid,
                (!canRedeem || isUnavailable || isSubmitting) && styles.disabledButton,
              ]}
              disabled={!canRedeem || isUnavailable || isSubmitting}
            >
              {isSubmitting ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.ctaText}>Processing...</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.ctaText,
                    (!canRedeem || isUnavailable) && styles.disabledText,
                  ]}
                >
                  {hasPendingRedemption
                  ? "Already Redeemed (Pending Approval)"
                  : !canRedeem
                  ? `Redeem for ${reward.points} Points`
                  : isUnavailable
                  ? "Not Available"
                  : reward.category?.toLowerCase() === "cash"
                  ? "Redeem Cash Amount"
                  : `Redeem for ${reward.points} Points`}
                </Text>
              )}
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

        {/*CASH AMOUNT MODAL */}
        <Modal visible={cashModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.cashModalCard}>
              <Text style={styles.cashModalTitle}>Redeem Cash Amount</Text>
              <Text style={styles.cashModalSubtitle}>
                Enter or select the amount you want to redeem
              </Text>

              {/* Input Field */}
              <View style={styles.amountInputWrapper}>
                <Text style={styles.pesoSign}>₱</Text>
                <TextInput
                  value={selectedAmount}
                  onChangeText={setSelectedAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#aaa"
                  style={styles.amountInput}
                />
              </View>

              {/* Quick Select Buttons */}
              <View style={styles.amountButtonRow}>
                {[50, 100, 200, 500].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => setSelectedAmount(amount.toString())}
                    style={[
                      styles.amountButton,
                      selectedAmount === amount.toString() &&
                        styles.amountButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.amountButtonText,
                        selectedAmount === amount.toString() &&
                          styles.amountButtonTextSelected,
                      ]}
                    >
                      ₱{amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Buttons */}
              <TouchableOpacity
                style={[styles.redeemButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleCashRedeem}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.redeemButtonText}>Request to Redeem</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCashModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  cashModalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },

  cashModalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#2E7D32",
    marginBottom: 4,
    textAlign: "center",
  },

  cashModalSubtitle: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 20,
  },

  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
    width: "70%",
    backgroundColor: "#FAFAFA",
  },

  pesoSign: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#2E7D32",
    marginRight: 8,
  },

  amountInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#333",
    textAlign: "center",
  },

  amountButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },

  amountButton: {
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    margin: 5,
    backgroundColor: "#E8F5E9",
  },

  amountButtonSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },

  amountButtonText: {
    color: "#2E7D32",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },

  amountButtonTextSelected: {
    color: "#fff",
  },

  redeemButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: "80%",
    alignItems: "center",
    marginBottom: 12,
  },

  redeemButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },

  cancelButton: {
    backgroundColor: "#eee",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
    width: "80%",
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#444",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
});