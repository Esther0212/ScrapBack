import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const ClothesDetail = () => {
  const [showGuidelinesPage, setShowGuidelinesPage] = useState(false);
  const [showDos, setShowDos] = useState(true);
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-300)).current;

  const dosList = [
    "Do separate clothes by material type.",
    "Do check for items that can be donated.",
    "Do wash heavily soiled clothes before recycling.",
    "Do fold or bundle clothes for donation or recycling centers.",
    "Do recycle textiles through local textile programs if available.",
  ];

  const dontsList = [
    "Don't throw clothes with mold or pests into recycling bins.",
    "Don't mix textiles with non-recyclable trash.",
    "Don't burn textiles.",
    "Don't include items that cannot be recycled by local programs.",
  ];

  const openGuidelines = () => {
    setShowGuidelinesPage(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const closeGuidelines = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowGuidelinesPage(false));
  };

  return (
    <SafeAreaView style={styles.container}>
      {!showGuidelinesPage && (
        <Pressable
          style={styles.transparentBack}
          onPress={() => router.push("/Main/Home")}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
      )}

      <View style={styles.topImageContainer}>
        <Image
          source={require("../../../assets/f1.png")}
          style={styles.topImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={styles.title}>How to Recycle Clothes</Text>

          <Pressable style={styles.yellowButton}>
            <Text style={styles.yellowButtonText}>Gray container</Text>
          </Pressable>

          <View style={styles.listContainer}>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>{"\u00A0\u00A0\u00A0"}• Sort:</Text> Separate by fabric type.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>{"\u00A0\u00A0\u00A0"}• Clean:</Text> Wash if dirty or soiled.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>{"\u00A0\u00A0\u00A0"}• Bundle:</Text> Fold or tie clothes neatly.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>{"\u00A0\u00A0\u00A0"}• Donate/Recycle:</Text> Place in textile recycling or donation
              {"\u00A0\u00A0\u00A0"} bins.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Benefit</Text>
          <Text style={styles.benefitItem}>
            {"\u00A0\u00A0\u00A0"}1. <Text style={styles.bold}>Environmental Impact</Text>{"\n"}
            Recycling clothes reduces landfill waste and lowers environmental pollution.
          </Text>
          <Text style={styles.benefitItem}>
            {"\u00A0\u00A0\u00A0"}2. <Text style={styles.bold}>Social Benefit</Text>{"\n"}
            Donated clothes help those in need and promote a circular economy.
          </Text>
        </ScrollView>

        <Pressable style={styles.viewGuidelinesButton} onPress={openGuidelines}>
          <Text style={styles.viewGuidelinesText}>View Guidelines</Text>
        </Pressable>
      </View>

      {showGuidelinesPage && (
        <View style={styles.fullOverlay}>
          <Pressable style={styles.transparentBack} onPress={closeGuidelines}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>

          <View style={styles.topImageContainer}>
            <Image
              source={require("../../../assets/f1.png")}
              style={styles.topImage}
              resizeMode="contain"
            />
          </View>

          <Animated.View
            style={[
              styles.card,
              { transform: [{ translateY: slideAnim }], marginTop: 15 },
            ]}
          >
            <View style={styles.guidelinesHeader}>
              <Text style={styles.title}>Clothes Guidelines</Text>
              <Pressable
                style={[
                  styles.toggleButton,
                  showDos ? styles.activeDos : styles.activeDonts,
                ]}
                onPress={() => setShowDos(!showDos)}
              >
                <Text style={styles.toggleText}>
                  {showDos ? "✔ Dos" : "✖ Don'ts"}
                </Text>
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 10, paddingBottom: 3 }}>
              {(showDos ? dosList : dontsList).map((item, index) => (
                <View key={index} style={styles.listRow}>
                  <Ionicons
                    name={showDos ? "checkmark-circle" : "close-circle"}
                    size={20}
                    color={showDos ? "#388E3C" : "#D32F2F"}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.listItem}>{item}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6E9" },
  topImageContainer: { alignItems: "center", marginBottom: -30, marginTop: 20 },
  topImage: { width: 280, height: 250 },
  card: {
    minHeight: "64%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 35,
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 15, marginTop: 10, color: "#000" },
  yellowButton: {
    backgroundColor: "#aca8a7ff",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: -45,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: "flex-end",
  },
  yellowButtonText: { color: "#fff", fontWeight: "400" },
  listContainer: { marginBottom: 16 },
  listItem: { fontSize: 13, lineHeight: 20, marginBottom: 4, color: "#333" },
  bold: { fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8, color: "#000" },
  benefitItem: { fontSize: 13, marginBottom: 8, lineHeight: 20, color: "#333" },
  transparentBack: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 1000,
  },
  viewGuidelinesButton: { backgroundColor: "#0ba45aff", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 25 },
  viewGuidelinesText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  fullOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#F6F6E9", zIndex: 999, justifyContent: "flex-start", padding: 16 },
  listRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  guidelinesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 25 },
  activeDos: { backgroundColor: "#388E3C" },
  activeDonts: { backgroundColor: "#D32F2F" },
  toggleText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default ClothesDetail;
