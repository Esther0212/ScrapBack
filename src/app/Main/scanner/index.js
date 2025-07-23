import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Scanner() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Generate a QR code to earn points for accumulation or redeem rewards by deducting points.
      </Text>

      <TouchableOpacity
        style={[styles.button, styles.buttonGreen]}
        onPress={() => router.push("/Main/scanner/earn")}
      >
        <Text style={styles.buttonText}>Generate QR to Earn Points</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonDarkGreen]}
        onPress={() => router.push("/Main/scanner/redeem")}
      >
        <Text style={styles.buttonText}>Generate QR to Redeem Rewards</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF3D3",
    padding: 20,
    justifyContent: "center",
    alignItems: "center", // horizontally center content
  },
  subtitle: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
    maxWidth: 300,
  },
  button: {
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    width: 260,
  },
  buttonGreen: {
    backgroundColor: "#A5C78A",
  },
  buttonDarkGreen: {
    backgroundColor: "#6FA45D",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
});
