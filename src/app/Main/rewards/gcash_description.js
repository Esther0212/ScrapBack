// src/app/Main/rewards/gcash_description.js
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import CustomBgColor from "../../../components/customBgColor";

// Reward descriptions for GCash
const rewardDescriptions = {
  1: {
    title: "₱50 GCash",
    points: 100,
    image: require("../../../assets/redeem/gcash.png"),
    description:
      "Exchange your ScrapBack points for real cash! With just 10 points, you’ll receive ₱10 straight to your GCash wallet — no hassle, no waiting too long.",
  },
  2: {
    title: "₱100 GCash",
    points: 200,
    image: require("../../../assets/redeem/gcash.png"),
    description:
      "Exchange your ScrapBack points for real cash! With just 10 points, you’ll receive ₱10 straight to your GCash wallet — no hassle, no waiting too long.",
  },
  3: {
    title: "₱200 GCash",
    points: 400,
    image: require("../../../assets/redeem/gcash.png"),
    description:
      "Exchange your ScrapBack points for real cash! With just 10 points, you’ll receive ₱10 straight to your GCash wallet — no hassle, no waiting too long.",
  },
  4: {
    title: "₱500 GCash",
    points: 1000,
    image: require("../../../assets/redeem/gcash.png"),
    description:
      "Exchange your ScrapBack points for real cash! With just 10 points, you’ll receive ₱10 straight to your GCash wallet — no hassle, no waiting too long.",
  },
};

const GcashDescription = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);

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
          <TouchableOpacity onPress={() => router.push("/Main/rewards/gcash")}>
            <Ionicons name="arrow-back" size={24} color="#008243" />
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
              ScrapBack is a digital recycling rewards system developed for PACAFACO residents and contributors. It encourages proper waste disposal by converting recyclable materials into reward points which users can redeem for goods like rice, mobile load, or vouchers.
            </Text>

            <Text style={styles.sectionTitle}>About this Reward</Text>
            <Text style={styles.text}>{reward.description}</Text>

            <Text style={styles.sectionTitle}>How to Redeem Rewards</Text>
            <Text style={styles.text}>
              1. Go to any designated PACAFACO collection point.{"\n"}
              2. Show your QR code from the ScrapBack app to the staff.{"\n"}
              3. Staff will scan your QR and validate your points.{"\n"}
              4. Choose your reward and confirm redemption.{"\n"}
              5. Once approved, receive your reward on the spot or be notified for scheduled claiming.{"\n\n"}
              <Text style={styles.bold}>
                Note: Ensure you meet the minimum points required for the specific reward before attempting to redeem.
              </Text>
            </Text>

            {/* CTA Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setModalVisible(true)}
              style={styles.ctaButtonSolid}
            >
              <Text style={styles.ctaText}>Redeem for {reward.points} Points</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal */}
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
                onPress={() => setModalVisible(false)}
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

export default GcashDescription;

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
