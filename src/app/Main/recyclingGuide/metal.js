import React, { useState, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, Image, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

const MetalDetail = () => {
  const [showGuidelinesPage, setShowGuidelinesPage] = useState(false);
  const [showDos, setShowDos] = useState(true);

  const slideAnim = useRef(new Animated.Value(-300)).current;

  const dosList = [
    "Do recycle aluminum cans and foil.",
    "Do rinse containers to remove food residues.",
    "Do recycle steel cans and metal lids.",
    "Do check for local scrap metal recycling programs.",
    "Do separate metals from non-metal recyclables."
  ];

  const dontsList = [
    "Don't throw metal in regular trash.",
    "Don't recycle metal items contaminated with chemicals or paint.",
    "Don't mix small metal scraps with non-metal waste.",
    "Don't burn metal waste.",
    "Don't recycle hazardous metal items like batteries in the metal bin."
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Image for Main Section */}
        <View style={styles.topImageContainer}>
          <Image
            source={require('../../../assets/bin.png')} // temporary image
            style={styles.topImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>How to Recycle Metal</Text>

          <Pressable style={styles.redButton}>
            <Text style={styles.redButtonText}>Metal bin</Text>
          </Pressable>

          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Separate clean metals from contaminated items.</Text>
            <Text style={styles.listItem}>• Flatten metal cans if possible.</Text>
            <Text style={styles.listItem}>• Donate scrap metal for reuse if suitable.</Text>
            <Text style={styles.listItem}>• Avoid mixing with non-metal recyclables.</Text>
          </View>

          <Text style={styles.sectionTitle}>Benefit</Text>
          <Text style={styles.benefitItem}>
            1. Environmental Impact{"\n"}Recycling metal reduces mining demand and energy consumption.
          </Text>
          <Text style={styles.benefitItem}>
            2. Economic Efficiency{"\n"}Supports metal recycling industries and lowers production costs.
          </Text>

          <Pressable
            style={styles.viewGuidelinesButton}
            onPress={openGuidelines}
          >
            <Text style={styles.viewGuidelinesText}>View Guidelines</Text>
          </Pressable>
        </View>

        {showGuidelinesPage && (
          <View style={styles.fullOverlay}>
            <Pressable style={styles.backArrow} onPress={closeGuidelines}>
              <Ionicons name="arrow-back" size={24} color="#388E3C" />
            </Pressable>

            {/* Top Image for Guidelines Overlay */}
            <View style={styles.topImageContainer}>
              <Image
                source={require('../../../assets/g2.png')} // same temporary image
                style={styles.topImage}
                resizeMode="contain"
              />
            </View>

            {/* Animated Guidelines Card */}
            <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }], marginTop: 20 }]}>
              <View style={styles.guidelinesHeader}>
                <Text style={styles.title}>Metal Guidelines</Text>
                <Pressable
                  style={[styles.toggleButton, showDos ? styles.activeDos : styles.activeDonts]}
                  onPress={() => setShowDos(!showDos)}
                >
                  <Text style={styles.toggleText}>{showDos ? "✔ Dos" : "✖ Don'ts"}</Text>
                </Pressable>
              </View>

              <View style={{ paddingHorizontal: 10, paddingBottom: 3 }}>
                {(showDos ? dosList : dontsList).map((item, index) => (
                  <View key={index} style={styles.listRow}>
                    <Ionicons
                      name={showDos ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={showDos ? "#388E3C" : "#D32F2F"}
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.listItem}>{item}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6E9" },
  scrollContent: { padding: 16 },
  topImageContainer: { alignItems: "center", marginBottom: 16 },
  topImage: { width: 150, height: 150 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, marginTop: 90 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  redButton: { backgroundColor: "#D32F2F", borderRadius: 8, padding: 8, alignSelf: "flex-start", marginBottom: 12 },
  redButtonText: { color: "#fff", fontWeight: "600" },
  listContainer: { marginBottom: 16 },
  listItem: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  benefitItem: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  viewGuidelinesButton: { backgroundColor: "#008243", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 12 },
  viewGuidelinesText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  fullOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F6F6E9",
    zIndex: 999,
    justifyContent: "flex-start",
    padding: 16,
  },
  backArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DFF5E1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  guidelinesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 25 },
  activeDos: { backgroundColor: "#388E3C" },
  activeDonts: { backgroundColor: "#D32F2F" },
  toggleText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default MetalDetail;
