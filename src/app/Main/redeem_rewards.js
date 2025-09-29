// src/app/Main/redeem_rewards.js
import React, { useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import CustomBgColor from "../../components/customBgColor";

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
          <Text style={styles.headerTitle}>🎁 Redeem Rewards</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Eco friendly background accents */}
        <Ionicons
          name="leaf"
          size={140}
          color="green"
          style={[styles.bgIcon, { top: 100, left: -30, transform: [{ rotate: "-20deg" }] }]}
        />
        <Ionicons
          name="earth"
          size={120}
          color="green"
          style={[styles.bgIcon, { bottom: 150, right: -20, opacity: 0.07 }]}
        />
        <Ionicons
          name="leaf"
          size={100}
          color="green"
          style={[styles.bgIcon, { bottom: 60, left: 40, transform: [{ rotate: "30deg" }] }]}
        />


        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.intro}>
              ♻ Here are the rewards you {"\n"}can redeem using your earned
              points:
            </Text>

            {/* Category Cards */}
            <View style={styles.cardContainer}>
              {rewards.map((item) => {
                const scaleAnim = useRef(new Animated.Value(1)).current;

                const handlePressIn = () => {
                  Animated.spring(scaleAnim, {
                    toValue: 0.95,
                    useNativeDriver: true,
                  }).start();
                };
                const handlePressOut = () => {
                  Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start();
                };

                return (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.cardWrapper,
                      { transform: [{ scale: scaleAnim }] },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => item.route && router.push(item.route)}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                    >
                      <LinearGradient
                        colors={["#CDEAC0", "#8ED081"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.card}
                      >
                        <Image source={item.icon} style={styles.icon} />
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>

                        {/* Redeem Button */}
                        <View style={styles.redeemButton}>
                          <Text style={styles.redeemText}>Redeem</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
  },
  scrollView: {
    flexGrow: 1,
    padding: 16,
  },
  content: {
    alignItems: "center",
  },
  intro: {
    fontSize: width < 400 ? 16 : 18,
    fontFamily: "Poppins_500Medium",
    marginBottom: 20,
    textAlign: "center",
    color: "#1A1A1A",
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
  cardWrapper: {
    margin: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  card: {
    width: width * 0.42,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  icon: {
    width: width * 0.18,
    height: width * 0.18,
    marginBottom: 10,
    resizeMode: "contain",
  },
  cardTitle: {
    fontSize: width < 400 ? 14 : 16,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
    textAlign: "center",
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: width < 400 ? 10 : 12,
    fontFamily: "Poppins_400Regular",
    color: "#444",
    marginBottom: 12,
    textAlign: "center",
  },
  redeemButton: {
    backgroundColor: "#008243",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    textAlign: "center",
  },
  // Eco background icons (subtle)
  bgIcon: {
    position: "absolute",
    opacity: 0.07,
  },
});

export default RedeemRewards;
