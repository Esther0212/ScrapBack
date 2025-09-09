import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import CustomBgColor from "../../../components/customBgColor";

const rewardDescriptions = {
  1: {
    title: "1 Kilo Rice",
    image: require("../../../assets/redeem/rice.png"),
    description:
      "This reward allows you to redeem 1 kilo of rice in exchange for 45 ScrapBack points. Points are earned by submitting recyclable waste like plastic bottles, paper, and glass at designated collection points.",
    howTo:
      "1. Go to any designated PACAFACO collection point.\n" +
      "2. Show your QR code from the ScrapBack app to the staff.\n" +
      "3. Staff will scan your QR and validate your points.\n" +
      "4. Choose your reward and confirm redemption.\n" +
      "5. Once approved, receive your reward on the spot or be notified for scheduled claiming.\n\n" +
      "Note: Ensure you meet the minimum points required for the specific reward before attempting to redeem.",
  },
  2: {
    title: "5 Kilos Rice",
    image: require("../../../assets/redeem/dog.png"),
    description:
      "This reward allows you to redeem 5 kilos of rice in exchange for 200 ScrapBack points. Points are earned by submitting recyclable waste like plastic bottles, paper, and glass at designated collection points.",
    howTo:
      "1. Go to any designated PACAFACO collection point.\n" +
      "2. Show your QR code from the ScrapBack app to the staff.\n" +
      "3. Staff will scan your QR and validate your points.\n" +
      "4. Choose your reward and confirm redemption.\n" +
      "5. Once approved, receive your reward on the spot or be notified for scheduled claiming.\n\n" +
      "Note: Ensure you meet the minimum points required for the specific reward before attempting to redeem.",
  },
};

const Description = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const reward = rewardDescriptions[id];

  if (!reward) {
    return (
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.notFoundText}>No description found for this reward.</Text>
        </SafeAreaView>
      </CustomBgColor>
    );
  }

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/Main/rewards/rice")}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{reward.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Image with gradient background */}
          <LinearGradient colors={["#E8F5E9", "#FFFFFF"]} style={styles.imageWrapper}>
            <Image source={reward.image} style={styles.image} />
          </LinearGradient>

          {/* Card Content */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.text}>
              <Text style={styles.bold}>ABOUT ScrapBack{"\n"}</Text>
              ScrapBack is a digital recycling rewards system developed for PACAFACO residents. It encourages proper waste disposal by converting recyclable materials into reward points which users can redeem for goods like rice, mobile load, or vouchers.
            </Text>

            <Text style={styles.sectionTitle}>About this Reward</Text>
            <Text style={styles.text}>{reward.description}</Text>

            <Text style={styles.sectionTitle}>How to Redeem Rewards</Text>
            <Text style={styles.text}>{reward.howTo}</Text>

            {/* CTA Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("Main/map/MapSelector")}
              style={styles.ctaButtonSolid}
            >
              <Text style={styles.ctaText}>Go to Nearest PACAFACO Point</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default Description;

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
  notFoundText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#888",
    textAlign: "center",
    marginTop: 40,
  },
});
