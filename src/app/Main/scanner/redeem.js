import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

export default function RedeemRewardsQR() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Redeem Rewards QR Code</Text>
      <View style={styles.qrContainer}>
        <Text style={styles.description}>
          Generate your QR code for staff to scan and deduct points for your reward.
        </Text>

        <Image
          source={require("../../../assets/scanner/sample-qr.png")}
          style={styles.qrImage}
        />

        <Text style={styles.expiryText}>This QR code will expire in 2:35 minutes</Text>

        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>CLOSE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF3D3",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  qrContainer: {
    backgroundColor: "#D4F2B4",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  qrImage: {
    width: 180,
    height: 180,
    marginBottom: 15,
  },
  expiryText: {
    color: "red",
    fontWeight: "500",
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: "#A5C78A",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  closeButtonText: {
    fontWeight: "bold",
    color: "#000",
  },
});
