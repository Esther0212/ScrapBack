// src/app/Main/rewards/load_description.js 
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
import CustomBgColor from "../../../components/customBgColor";

// Reward descriptions for Load
const rewardDescriptions = {
  1: {
    title: "₱50 Load",
    points: 100,
    image: require("../../../assets/redeem/load.png"),
    description:
      "Redeem ₱3 worth of mobile load using your ScrapBack points. This is perfect for quick top-ups and is available for all major Philippine networks (Globe, Smart, TNT, TM, DITO).",
  },
  2: {
    title: "₱100 Load",
    points: 200,
    image: require("../../../assets/redeem/load.png"),
    description:
      "Redeem ₱3 worth of mobile load using your ScrapBack points. This is perfect for quick top-ups and is available for all major Philippine networks (Globe, Smart, TNT, TM, DITO).",
  },
  3: {
    title: "₱200 Load",
    points: 400,
    image: require("../../../assets/redeem/load.png"),
    description:
      "Redeem ₱3 worth of mobile load using your ScrapBack points. This is perfect for quick top-ups and is available for all major Philippine networks (Globe, Smart, TNT, TM, DITO).",
  },
  4: {
    title: "₱500 Load",
    points: 1000,
    image: require("../../../assets/redeem/load.png"),
    description:
      "Redeem ₱3 worth of mobile load using your ScrapBack points. This is perfect for quick top-ups and is available for all major Philippine networks (Globe, Smart, TNT, TM, DITO).",
  },
};

const LoadDescription = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);

  const reward = rewardDescriptions[id];

  if (!reward) {
    return (
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <Text>No description found for this reward.</Text>
        </SafeAreaView>
      </CustomBgColor>
    );
  }

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/Main/rewards/load")}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{reward.title}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Image */}
          <Image source={reward.image} style={styles.image} />

          {/* Card Content */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.text}>
              <Text style={styles.bold}>ABOUT ScrapBack{"\n"}</Text>
              ScrapBack is a digital recycling rewards system developed for
              PACAFACO residents and contributors. It encourages proper waste
              disposal by converting recyclable materials into reward points
              which users can redeem for goods like rice, mobile load, or
              vouchers.
            </Text>

            <Text style={styles.sectionTitle}>ABOUT THIS REWARD</Text>
            <Text style={styles.text}>{reward.description}</Text>

            <Text style={styles.sectionTitle}>HOW TO REDEEM REWARDS</Text>
            <Text style={styles.text}>
              1. Go to any designated PACAFACO collection point.{"\n"}
              2. Show your QR code from the ScrapBack app to the staff.{"\n"}
              3. Staff will scan your QR and validate your points.{"\n"}
              4. Choose your reward and confirm redemption.{"\n"}
              5. Once approved, receive your reward on the spot or be notified
              for scheduled claiming.{"\n\n"}
              <Text style={styles.bold}>
                Note: Ensure you meet the minimum points required for the
                specific reward before attempting to redeem.
              </Text>
            </Text>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.ctaText}>
                Redeem for {reward.points} Points
              </Text>
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

export default LoadDescription;

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
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  scrollContainer: {
    padding: 16,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginTop: 10,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#444",
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontFamily: "Poppins_700Bold",
  },
  ctaButton: {
    backgroundColor: "#008243",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: "center",
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
});
