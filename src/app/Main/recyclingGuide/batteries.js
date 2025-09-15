import React, { useState, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, Image, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

const BatteriesDetail = () => {
  const [showGuidelinesPage, setShowGuidelinesPage] = useState(false);
  const [showDos, setShowDos] = useState(true);

  const slideAnim = useRef(new Animated.Value(-300)).current;

  const dosList = [
    "Do store used batteries in a cool, dry place before recycling.",
    "Do take batteries to certified battery recycling centers.",
    "Do keep different battery types separate (AA, AAA, lithium, etc.).",
    "Do use protective tape on terminals to prevent short-circuits.",
    "Do follow local regulations for hazardous waste disposal."
  ];

  const dontsList = [
    "Don't throw batteries in regular trash bins.",
    "Don't burn or incinerate batteries.",
    "Don't mix used and new batteries in devices.",
    "Don't puncture or crush batteries.",
    "Don't dispose of batteries in water or soil."
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
        {/* Top Image */}
        <View style={styles.imageContainer}>
          <Image source={require('../../../assets/bin.png')} style={styles.topImage} resizeMode="contain" />
        </View>

        {/* Original Steps & Benefits */}
        <View style={styles.card}>
          <Text style={styles.title}>How to Recycle Batteries</Text>

          <Pressable style={styles.redButton}>
            <Text style={styles.redButtonText}>Battery drop-off</Text>
          </Pressable>

          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Store batteries in a cool, dry place before recycling.</Text>
            <Text style={styles.listItem}>• Separate different types of batteries.</Text>
            <Text style={styles.listItem}>• Use protective tape on terminals.</Text>
            <Text style={styles.listItem}>• Take batteries to certified recycling centers.</Text>
          </View>

          <Text style={styles.sectionTitle}>Benefit</Text>
          <Text style={styles.benefitItem}>
            1. Environmental Impact{"\n"}Recycling batteries prevents toxic chemicals from contaminating soil and water.
          </Text>
          <Text style={styles.benefitItem}>
            2. Resource Efficiency{"\n"}Recovered metals like lithium, nickel, and cadmium can be reused in new batteries.
          </Text>

          <Pressable
            style={styles.viewGuidelinesButton}
            onPress={openGuidelines}
          >
            <Text style={styles.viewGuidelinesText}>View Guidelines</Text>
          </Pressable>
        </View>

        {/* Guidelines Overlay */}
        {showGuidelinesPage && (
          <View style={styles.fullOverlay}>
            {/* Back Arrow */}
            <Pressable style={styles.backArrow} onPress={closeGuidelines}>
              <Ionicons name="arrow-back" size={24} color="#388E3C" />
            </Pressable>

            {/* Centered Overlay Image */}
            <View style={styles.imageContainer}>
              <Image source={require('../../../assets/g2.png')} style={styles.topImage} resizeMode="contain" />
            </View>

            {/* Animated Guidelines Card */}
            <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }], marginTop: 20 }]}>
              <View style={styles.guidelinesHeader}>
                <Text style={styles.title}>Battery Guidelines</Text>
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
  imageContainer: { alignItems: "center", marginBottom: 16 },
  topImage: { width: 150, height: 150 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, marginTop: 20 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  redButton: { backgroundColor: "#D32F2F", borderRadius: 8, padding: 8, alignSelf: "flex-start", marginBottom: 12 },
  redButtonText: { color: "#fff", fontWeight: "600" },
  listContainer: { marginBottom: 16 },
  listItem: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  benefitItem: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  viewGuidelinesButton: { backgroundColor: "#008243", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 12 },
  viewGuidelinesText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // Overlay
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

export default BatteriesDetail;
