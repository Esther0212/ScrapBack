// src/app/Main/redeem_rewards.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { db } from "../../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const { width } = Dimensions.get("window");

const categories = [
  { id: 1, name: "Rice Sack", key: "sack", icon: require("../../assets/redeem/rice.png") },
  { id: 2, name: "Load", key: "load", icon: require("../../assets/redeem/load.png") },
  { id: 3, name: "GCash", key: "gcash", icon: require("../../assets/redeem/gcash.png") },
];

const RedeemRewards = () => {
  const router = useRouter();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRewards = async (categoryKey) => {
    setLoading(true);
    try {
      const rewardsRef = collection(db, "reward");
      const q = query(rewardsRef, where("category", "==", categoryKey));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRewards(data);
    } catch (err) {
      console.error("Error fetching rewards:", err);
    }
    setLoading(false);
  };

  const handleCategoryPress = (categoryKey) => {
    fetchRewards(categoryKey);
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Redeem Rewards</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.intro}>
              Here are the rewards you {"\n"}can redeem using your earned points:
            </Text>

            {/* Category Cards */}
            <View style={styles.cardContainer}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => handleCategoryPress(item.key)}
                >
                  <Image source={item.icon} style={styles.icon} />
                  <Text style={styles.cardTitle}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rewards List */}
            {loading ? (
              <Text style={{ marginTop: 20 }}>Loading...</Text>
            ) : rewards.length === 0 ? (
              <Text style={{ marginTop: 20, fontStyle: "italic" }}>No rewards found.</Text>
            ) : (
              <View style={{ marginTop: 20, width: "100%" }}>
                {rewards.map((reward) => (
                  <View
                    key={reward.id}
                    style={{
                      flexDirection: "row",
                      backgroundColor: "#B6D799",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={
                        reward.image?.startsWith("http")
                          ? { uri: reward.image }
                          : require("../../assets/redeem/placeholder.jpg") // fallback
                      }
                      style={{ width: 60, height: 60, borderRadius: 8, marginRight: 16 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "bold", fontSize: 16 }}>{reward.title}</Text>
                      <Text>Points: {reward.points}</Text>
                      {reward.description ? <Text>{reward.description}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  headerTitle: { fontSize: 18, fontFamily: "Poppins_700Bold" },
  scrollView: { flexGrow: 1, padding: 16 },
  content: { alignItems: "center" },
  intro: { fontSize: width < 400 ? 16 : 20, fontFamily: "Poppins_700Bold", marginBottom: 30, textAlign: "center" },
  cardContainer: { flexDirection: "row", justifyContent: "center" },
  card: {
    width: width * 0.28,
    backgroundColor: "#B6D799",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 5,
  },
  icon: { width: width * 0.15, height: width * 0.15, marginBottom: 10, resizeMode: "contain" },
  cardTitle: { fontSize: width < 400 ? 14 : 16, fontFamily: "Poppins_700Bold", marginBottom: 4, textAlign: "center" },
});

export default RedeemRewards;
