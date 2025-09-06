// src/app/Main/redeem_rewards.js
import React from "react";
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

const { width } = Dimensions.get("window");

const rewards = [
  {
    id: 1,
    name: "Rice Sack",
    subtitle: "Redeemable Onsite",
    icon: require("../../assets/redeem/rice.png"),
    route: "/Main/rewards/rice",
  },
  {
    id: 2,
    name: "Load",
    subtitle: "Redeemable Onsite/Online",
    icon: require("../../assets/redeem/load.png"),
    route: "/Main/rewards/load",
  },
  {
    id: 3,
    name: "GCash",
    subtitle: "Redeemable Online",
    icon: require("../../assets/redeem/gcash.png"),
  },
];

const RedeemRewards = () => {
  const router = useRouter();

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

            <View style={styles.cardContainer}>
              {rewards.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => item.route && router.push(item.route)}
                >
                  <Image source={item.icon} style={styles.icon} />
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.subtitle}>{item.subtitle}</Text>
                  <View style={styles.redeemButton}>
                    <Text style={styles.redeemText}>Redeem</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  content: {
    alignItems: "center",
  },
  intro: {
    fontSize: width < 400 ? 16 : 20,
    fontFamily: "Poppins_700Bold",
    marginBottom: 30,
    textAlign: "center",
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  card: {
    width: width * 0.28,
    backgroundColor: "#B6D799",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 5,
  },
  icon: {
    width: width * 0.15,
    height: width * 0.15,
    marginBottom: 10,
    resizeMode: "contain",
  },
  cardTitle: {
    fontSize: width < 400 ? 14 : 16,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: width < 400 ? 10 : 12,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  redeemButton: {
    backgroundColor: "#008243",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    textAlign: "center",
  },
});

export default RedeemRewards;
