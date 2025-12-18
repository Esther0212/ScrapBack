// src/app/Main/rewards/index.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../../components/customBgColor";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { db } from "../../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const { width } = Dimensions.get("window");

const RewardsIndex = () => {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Real-time Firestore listener — ignoring modeAvailable entirely
  useEffect(() => {
    const rewardRef = collection(db, "rewardItems");
    const unsubscribe = onSnapshot(rewardRef, (snapshot) => {
      const rewards = snapshot.docs.map((doc) => doc.data());

      // ✅ DO NOT filter out unavailable rewards here
      const rawCategories = rewards
        .map((r) => r.category?.toLowerCase()?.trim())
        .filter(Boolean);

      const normalized = rawCategories.map((c) =>
        c === "others" ? "other" : c
      );

      const uniqueCategories = [...new Set(normalized)];

      const order = ["rice", "load", "cash", "other"];
      const sorted = uniqueCategories.sort(
        (a, b) => order.indexOf(a) - order.indexOf(b)
      );

      setCategories(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔸 Category image selector
  const getCategoryImage = (cat) => {
    switch (cat) {
      case "rice":
        return require("../../../assets/redeem/rice.png");
      case "load":
        return require("../../../assets/redeem/load.png");
      case "cash":
        return require("../../../assets/redeem/cash.png");
      default:
        return require("../../../assets/redeem/other.png");
    }
  };

  // 🔸 Category title
  const getCategoryTitle = (cat) => {
    switch (cat) {
      case "rice":
        return "Rice";
      case "load":
        return "Load";
      case "cash":
        return "Cash";
      default:
        return "Others";
    }
  };

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

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.descriptionText}>
            ♻️ Here are the rewards you can redeem using your earned points:
          </Text>

          {categories.length === 0 ? (
            <Text style={styles.noRewardsText}>No rewards available yet.</Text>
          ) : (
            <View style={styles.cardContainer}>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={`${String(category)}-${index}`}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/Main/rewards/reward_item",
                      params: { category },
                    })
                  }
                >
                  <LinearGradient
                    colors={["#A5D6A7", "#E8F5E9"]}
                    style={styles.gradientCard}
                  >
                    <Image
                      source={getCategoryImage(category)}
                      style={styles.icon}
                    />
                    <Text style={styles.cardTitle}>
                      {getCategoryTitle(category)}
                    </Text>

                    <TouchableOpacity
                      style={styles.redeemButton}
                      onPress={() =>
                        router.push({
                          pathname: "/Main/rewards/reward_item",
                          params: { category },
                        })
                      }
                    >
                      <Text style={styles.redeemText}>View Rewards</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default RewardsIndex;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#1B5E20",
    textAlign: "center",
    marginBottom: 20,
  },
  noRewardsText: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    marginTop: 30,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  card: {
    width: width * 0.44,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  gradientCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 20,
  },
  icon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#1B5E20",
    textAlign: "center",
    marginBottom: 5,
  },
  redeemButton: {
    backgroundColor: "#008243",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 22,
    marginTop: 5,
  },
  redeemText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
});