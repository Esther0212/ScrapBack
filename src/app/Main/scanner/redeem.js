// /Main/scanner/RedeemRewardsQR.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  SafeAreaView,
  Image,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useRouter } from "expo-router";
import { auth, db } from "../../../../firebase";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import CustomBgColor from "../../../components/customBgColor";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

/**
 * IMPORTANT:
 * - Reward info is encoded directly inside the QR payload (no Firestore write).
 * - EXPIRY_SECONDS controls the lifetime (in seconds). Change it once and the UI uses it everywhere.
 */

// change this value to control the QR expiry (in seconds)
const EXPIRY_SECONDS = 5 * 60;

export default function RedeemRewardsQR() {
  const router = useRouter();
  const user = auth.currentUser;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use EXPIRY_SECONDS for initial state
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [expiryTimestamp, setExpiryTimestamp] = useState(
    Date.now() + EXPIRY_SECONDS * 1000
  );

  // Rewards
  const [rewards, setRewards] = useState([]);
  const [groupedRewards, setGroupedRewards] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState({
    sack: true,
    cash: true,
    load: true,
    other: true,
  });
  const [selectedReward, setSelectedReward] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [rewardModalVisible, setRewardModalVisible] = useState(false);

  // QR (no server write) - this holds the generated payload string/object
  const [qrPayload, setQrPayload] = useState(null);
  const [creatingPayload, setCreatingPayload] = useState(false);

  const showToast = (msg) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

  // --------------------------
  // Countdown effect (based on timeLeft)
  // --------------------------
  useEffect(() => {
    // If no QR generated, keep the counter at EXPIRY_SECONDS (or paused).
    // When qrPayload exists, timeLeft will be set to EXPIRY_SECONDS in handleGenerateQR.
    if (!qrPayload) return;

    if (timeLeft <= 0) {
      // expire QR locally
      setQrPayload(null);
      // reset to default expiry values (so UI can generate again)
      setExpiryTimestamp(Date.now() + EXPIRY_SECONDS * 1000);
      setTimeLeft(EXPIRY_SECONDS);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, qrPayload]);

  // --------------------------
  // Fetch user data
  // --------------------------
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

  // --------------------------
  // Fetch rewards
  // --------------------------
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const snap = await getDocs(collection(db, "rewardItems"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const order = { sack: 1, cash: 2, load: 3, other: 4 };
        const sortedList = [...list].sort((a, b) => {
          const catA = (a.category || "other").toLowerCase();
          const catB = (b.category || "other").toLowerCase();
          return (order[catA] || 99) - (order[catB] || 99);
        });

        setRewards(sortedList);

        const groups = {};
        sortedList.forEach((r) => {
          const cat = (r.category || "other").toLowerCase();
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(r);
        });
        setGroupedRewards(groups);
      } catch (err) {
        console.error("Failed to load rewards:", err);
      }
    };

    fetchRewards();
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  // --------------------------
  // Create QR payload (no DB writes)
  // - This verifies user has enough points (checks only).
  // - Then builds a JSON payload including reward info and user metadata.
  // - The payload is stored locally (qrPayload) and encoded into the QR.
  // --------------------------
  const createQrPayload = async ({ reward, cashAmount = null }) => {
    if (!userData) return null;

    // POINT CHECK ONLY — NO DEDUCTION AND NO LOCKED POINTS
    const userPoints = Number(userData.points || 0);
    const requiredPoints =
      reward.points && reward.points !== 0
        ? Number(reward.points)
        : cashAmount
          ? Number(cashAmount)
          : 0;

    if (userPoints < requiredPoints) {
      showToast("Insufficient points for this reward.");
      return null;
    }

    setCreatingPayload(true);
    try {
      const pointsRounded = parseFloat(Number(requiredPoints).toFixed(2));

      // Build payload object to encode inside the QR
      // You can include any fields staff needs to process redemption.
      const payload = {
        type: "redeem",
        uid: user.uid,
        email: user.email || null,
        name:
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
          userData.name ||
          user.displayName ||
          "",
        contact: userData.contact || "N/A",
        exp: Date.now() + EXPIRY_SECONDS * 1000,

        // Reward info
        rewardId: reward.id,
        rewardName: reward.title || "Reward",
        rewardCategory: reward.category || "other",
        rewardImage: reward.image || null,

        points:
          reward.points && reward.points !== 0
            ? Number(Number(reward.points).toFixed(2))
            : cashAmount
              ? Number(Number(cashAmount).toFixed(2))
              : 0,

        cashAmount:
          reward.points == 0 ? (cashAmount ? Number(cashAmount) : null) : null,
      };

      // Save locally so UI shows QR immediately
      setQrPayload(payload);

      // Set expiry timer based on EXPIRY_SECONDS
      const newExpiry = Date.now() + EXPIRY_SECONDS * 1000;
      setExpiryTimestamp(newExpiry);
      setTimeLeft(EXPIRY_SECONDS);

      showToast("QR generated. Show QR to staff for scanning.");
      return payload;
    } catch (err) {
      console.error("Failed to create QR payload:", err);
      showToast("Could not generate QR. Try again.");
      return null;
    } finally {
      setCreatingPayload(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedReward) {
      showToast("Choose a reward first.");
      return;
    }

    const isCashReward =
      selectedReward.points == 0 &&
      (selectedReward.category === "cash" ||
        selectedReward.title?.toLowerCase().includes("cash"));

    let cashAmount = null;
    if (isCashReward) {
      const entered = parseFloat(customAmount);
      if (!entered || isNaN(entered) || entered <= 0) {
        showToast("Enter a valid amount.");
        return;
      }
      cashAmount = entered;
    }

    await createQrPayload({ reward: selectedReward, cashAmount });
  };

  // --------------------------
  // Memoized Reward Modal
  // --------------------------
  const RewardSelectionModal = useMemo(() => {
    return (
      <Modal visible={rewardModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F1C5" }}>
          <Text style={styles.modalHeader}>Select Reward</Text>
          <ScrollView contentContainerStyle={styles.modalList}>
            {Object.entries(groupedRewards).map(([category, items]) => (
              <View key={category}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 10,
                    backgroundColor: "#008243",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                  }}
                  onPress={() =>
                    setCollapsedCategories((prev) => ({
                      ...prev,
                      [category]: !prev[category],
                    }))
                  }
                >
                  <Text
                    style={{
                      fontFamily: "Poppins_700Bold",
                      fontSize: 16,
                      color: "#fff",
                      textTransform: "capitalize",
                    }}
                  >
                    {category} rewards
                  </Text>
                  <Ionicons
                    name={
                      collapsedCategories[category]
                        ? "chevron-down"
                        : "chevron-forward"
                    }
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>

                {collapsedCategories[category] &&
                  items.map((r) => {
                    const isSelected = selectedReward?.id === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[
                          styles.wasteOption,
                          isSelected && styles.wasteOptionSelected,
                        ]}
                        onPress={() => {
                          if (isSelected) setSelectedReward(null);
                          else {
                            setSelectedReward(r);
                            if (
                              !(
                                r.points == 0 &&
                                (r.category === "cash" ||
                                  r.title?.toLowerCase().includes("cash"))
                              )
                            ) {
                              setCustomAmount("");
                            }
                            setRewardModalVisible(false);
                          }
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Image
                            source={{ uri: r.image }}
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 8,
                              marginRight: 12,
                            }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.wasteText,
                                isSelected && styles.wasteTextSelected,
                              ]}
                            >
                              {r.title}
                            </Text>
                            <Text style={styles.wastePoints}>
                              {r.points == 0 &&
                              (r.category === "other" ||
                                r.title?.toLowerCase().includes("cash"))
                                ? "Enter amount"
                                : `${r.points} pts`}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setRewardModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }, [rewardModalVisible, groupedRewards, collapsedCategories, selectedReward]);

  if (!user) {
    return (
      <CustomBgColor>
        <View style={styles.containerCentered}>
          <Text style={{ color: "red", fontWeight: "bold" }}>
            Please log in
          </Text>
        </View>
      </CustomBgColor>
    );
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

  // Build QR JSON string from qrPayload
  const qrValue = qrPayload ? JSON.stringify(qrPayload) : null;

  // --------------------------
  // Dynamic Description
  // --------------------------
  const descriptionText = !selectedReward
    ? "To generate a QR code, please choose a reward to redeem first. Tap 'Reward Item' below."
    : qrPayload
      ? "Staff can scan this QR to process your onsite redemption request."
      : "A reward is selected. Tap 'Generate QR' to create the QR that staff will scan.";

  return (
    <CustomBgColor>
      <View style={styles.container}>
        <View style={styles.qrContainer}>
          <Text style={styles.description}>{descriptionText}</Text>

          {!qrPayload ? (
            <>
              {/* ⭐⭐ ADDED POINTS SECTION (same as Home) ⭐⭐ */}
              {!qrPayload && (
                <View style={styles.pointsColumn}>
                  <Text style={styles.pointsLabel}>Your Total Points</Text>

                  <View style={styles.pointsRow}>
                    <Image
                      source={require("../../../assets/home/lettermarkLogo.png")}
                      style={styles.pointsLogo}
                      resizeMode="contain"
                    />

                    <View>
                      <Text style={styles.pointsValueText}>
                        {userData?.points?.toFixed(2) || "0.00"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              {/* Reward Picker */}
              <Text style={styles.label}>Select Reward</Text>

              <TouchableOpacity
                style={styles.infoBox}
                onPress={() => setRewardModalVisible(true)}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome name="gift" size={28} color="#0E9247" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Reward Item</Text>
                  <Text style={styles.infoSub}>
                    {selectedReward
                      ? `${selectedReward.title} (${
                          selectedReward.points == 0 &&
                          (selectedReward.category === "cash" ||
                            selectedReward.title
                              ?.toLowerCase()
                              .includes("cash"))
                            ? "Enter amount"
                            : selectedReward.points + " pts"
                        })`
                      : "Tap to choose reward"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Cash Input */}
              {selectedReward?.points == 0 &&
                (selectedReward?.category === "cash" ||
                  selectedReward?.title?.toLowerCase().includes("cash")) && (
                  <>
                    <Text style={styles.label}>Enter Amount (₱)</Text>
                    <TextInput
                      style={styles.inputEditable}
                      keyboardType="numeric"
                      placeholder="e.g. 250"
                      value={customAmount}
                      onChangeText={setCustomAmount}
                    />

                    <View style={styles.suggestionContainer}>
                      {[50, 100, 200, 500].map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={[
                            styles.suggestionButton,
                            customAmount === String(value) &&
                              styles.suggestionButtonActive,
                          ]}
                          onPress={() => setCustomAmount(String(value))}
                        >
                          <Text
                            style={[
                              styles.suggestionText,
                              customAmount === String(value) &&
                                styles.suggestionTextActive,
                            ]}
                          >
                            ₱{value}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

              {/* Generate QR — only if reward selected */}
              {selectedReward && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: "#6FA45D", marginTop: 18 },
                  ]}
                  onPress={handleGenerateQR}
                  disabled={creatingPayload}
                >
                  {creatingPayload ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Generate QR</Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Close */}
              <TouchableOpacity
                style={[styles.closeButton, { marginTop: 12 }]}
                onPress={() => router.back()}
              >
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {qrValue ? (
                <QRCode value={qrValue} size={180} />
              ) : (
                <Text>No QR data</Text>
              )}

              <Text style={styles.expiryText}>
                This QR code will expire in {minutes}:{seconds}
              </Text>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  // allow user to clear generated QR and choose another
                  setQrPayload(null);
                  setSelectedReward(null);
                  setCustomAmount("");
                  // reset expiry/timeLeft
                  const nowExpiry = Date.now() + EXPIRY_SECONDS * 1000;
                  setExpiryTimestamp(nowExpiry);
                  setTimeLeft(EXPIRY_SECONDS);
                }}
              >
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {RewardSelectionModal}
      </View>
    </CustomBgColor>
  );
}

// ================================
// Styles
// ================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  containerCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  /* ⭐ ADDED STYLES FOR POINTS SECTION */
  pointsContainer: {
    width: "100%",
    backgroundColor: "#B6D799",
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },
  pointsColumn: { width: "100%", justifyContent: "center", alignItems: "center", marginVertical: 30 },
  pointsLabel: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 6,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointsLogo: { width: 30, height: 30 },
  pointsValueText: {
    fontSize: 28,
    fontFamily: "Poppins_800ExtraBold",
    color: "#2E7D32",
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
    maxWidth: 300,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  buttonText: {
    color: "#000",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
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
  closeButtonText: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#000",
  },
  expiryText: {
    color: "red",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    marginBottom: 15,
    marginTop: 15,
  },
  label: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
  },
  inputEditable: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    width: "100%",
  },
  suggestionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    width: "100%",
  },
  suggestionButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  suggestionButtonActive: {
    backgroundColor: "#008243",
    borderColor: "#008243",
  },
  suggestionText: {
    color: "#333",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  suggestionTextActive: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
  },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E6F4EA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333" },
  infoSub: { color: "#6b6b6b", fontSize: 15, fontFamily: "Poppins_400Regular" },
  modalHeader: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    padding: 16,
    textAlign: "center",
    backgroundColor: "#F0F1C5",
  },
  modalList: { padding: 16, paddingBottom: 10 },
  modalFooter: {
    padding: 16,
    backgroundColor: "#F0F1C5",
    alignItems: "center",
  },
  modalCloseBtn: {
    width: "100%",
    backgroundColor: "#008243",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  wasteOption: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  wasteOptionSelected: { borderColor: "#0E9247", backgroundColor: "#E6F4EA" },
  wasteText: { fontSize: 15, color: "#333", fontFamily: "Poppins_700Bold" },
  wasteTextSelected: { color: "#0E9247", fontFamily: "Poppins_700Bold" },
  wastePoints: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    fontFamily: "Poppins_400Regular",
  },
});
