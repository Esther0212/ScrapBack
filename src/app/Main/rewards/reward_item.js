import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../../components/customBgColor";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from "../../../../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const { width } = Dimensions.get("window");

const RewardItem = () => {
  const router = useRouter();
  const { category } = useLocalSearchParams(); 
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userPoints, setUserPoints] = useState(0); // start at 0 until loaded
  const auth = getAuth(); // 🔹 get current Firebase user

  // 🔹 Fetch Firestore rewards filtered by category and sorted by lowest points
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "rewardItems"));
        const allRewards = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ✅ Filter by category
        const filtered = allRewards.filter((r) => {
          const cat = r.category?.toLowerCase()?.trim();
          if (category === "other")
            return !["rice", "load", "cash"].includes(cat);
          return cat === category?.toLowerCase()?.trim();
        });

        // ✅ Sort rewards from lowest to highest based on points
        const sorted = filtered.sort((a, b) => {
          const pointsA = Number(a.points) || 0;
          const pointsB = Number(b.points) || 0;
          return pointsA - pointsB; // ascending order
        });

        setOffers(sorted);
      } catch (err) {
        console.error("Error fetching rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [category]);

  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const authInstance = getAuth();

        // ✅ Wait for user to be ready (handles async auth)
        const user = await new Promise((resolve) => {
          if (authInstance.currentUser)
            return resolve(authInstance.currentUser);
          const unsub = onAuthStateChanged(authInstance, (u) => {
            unsub();
            resolve(u || null);
          });
        });

        if (!user) {
          console.warn("No user logged in yet");
          return;
        }

        // ✅ Correct collection name and field (matches your RewardDescription)
        const userRef = doc(db, "user", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setUserPoints(Number(snap.data().points || 0));
        } else {
          console.warn("User document not found in Firestore");
        }
      } catch (err) {
        console.error("Error fetching user points:", err);
      }
    };

    fetchUserPoints();
  }, []);

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2E7D32"
            style={{ marginTop: 30 }}
          />
        ) : offers.length === 0 ? (
          <Text style={styles.noDataText}>
            No rewards found in this category.
          </Text>
        ) : (
          <>
            <View style={styles.totalPointsContainer}>
              <Text style={styles.totalPointsLabel}>Your Total Points:</Text>
              <Text style={styles.totalPointsValue}>
                {userPoints.toLocaleString()} pts
              </Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollView}>
              <View style={styles.cardContainer}>
                {offers.map((offer, index) => {
                  const notEnoughPoints = Number(offer.points) > userPoints;
                  const isUnavailable =
                    offer.status?.toLowerCase()?.trim() === "unavailable";

                  const isDisabled = notEnoughPoints || isUnavailable;

                  return (
                    <TouchableOpacity
                      key={`${offer.id}-${index}`}
                      style={[styles.card, isDisabled && styles.disabledCard]}
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push({
                          pathname: "/Main/rewards/reward_description",
                          params: { id: offer.id },
                        })
                      }
                    >
                      <View style={styles.imageWrapper}>
                        {offer.image ? (
                          <Image
                            source={{ uri: offer.image }}
                            style={[
                              styles.image,
                              isDisabled && { opacity: 0.4 },
                            ]}
                          />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>No Image</Text>
                          </View>
                        )}

                        {category !== "cash" && (
                          <View style={styles.pointsBadge}>
                            <Image
                              source={require("../../../assets/home/lettermarkLogo.png")}
                              style={styles.logoIcon}
                            />
                            <Text style={styles.pointsText}>
                              {offer.points} pts
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.cardTitle,
                          isDisabled && { color: "#aaa" },
                        ]}
                      >
                        {offer.title || "Untitled Reward"}
                      </Text>

                      {isUnavailable && (
                        <Text style={styles.insufficientText}>
                          Currently unavailable
                        </Text>
                      )}

                      {!isUnavailable && notEnoughPoints && (
                        <Text style={styles.insufficientText}>
                          Not enough points
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default RewardItem;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { paddingHorizontal: 14, paddingBottom: 30 },
  noDataText: {
    textAlign: "center",
    marginTop: 50,
    fontFamily: "Poppins_500Medium",
    color: "#555",
    fontSize: 15,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: width * 0.46,
    borderRadius: 20,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  imageWrapper: { position: "relative" },
  image: {
    width: "100%",
    height: width * 0.38,
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: width * 0.38,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontFamily: "Poppins_500Medium",
    color: "#777",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#1B5E20",
    paddingVertical: 10,
    textAlign: "center",
  },
  pointsBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  logoIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  pointsText: {
    color: "#2E7D32",
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    marginLeft: 6,
    marginTop: 2,
  },
  disabledCard: {
    backgroundColor: "#f2f2f2",
  },
  insufficientText: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    fontFamily: "Poppins_500Medium",
    marginBottom: 8,
  },
  totalPointsContainer: {
    alignItems: "flex-start",
    marginTop: 12,
    paddingTop: 0,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  totalPointsLabel: {
    fontFamily: "Poppins_600SemiBold",
    color: "#2E7D32",
    fontSize: 14,
    marginBottom: 2,
  },
  totalPointsValue: {
    fontFamily: "Poppins_800ExtraBold",
    color: "#1B5E20",
    fontSize: 20,
  },
});