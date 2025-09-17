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
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";

const OrganicDetail = () => {
  const navigation = useNavigation();
  const [showGuidelinesPage, setShowGuidelinesPage] = useState(false);
  const [showDos, setShowDos] = useState(true);
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(-300)).current;

  const dosList = [
    "Do compost fruit and vegetable scraps.",
    "Do separate garden waste from regular trash.",
    "Do use biodegradable bags for organic waste.",
    "Do keep organic waste dry when possible.",
    "Do turn compost piles regularly for better decomposition.",
  ];

  const dontsList = [
    "Don't throw plastics or metals in organic waste.",
    "Don't mix cooked food with garden waste if not composting.",
    "Don't include toxic substances or chemicals.",
    "Don't let organic waste rot in open trash for too long.",
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
      {/* Overlay back button */}
      <Pressable
        style={styles.transparentBack}
        onPress={() => router.push("/Main/Home")}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </Pressable>

      <Pressable
        style={styles.transparentBack}
        onPress={closeGuidelines}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </Pressable>

      {/* Top Image */}
      <View style={styles.topImageContainer}>
        <Image
          source={require("../../../assets/f1.png")}
          style={styles.topImage}
          resizeMode="contain"
        />
      </View>

      {/* White Card */}
      <View style={styles.card}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={styles.title}>How to Recycle Organic</Text>

          <Pressable style={styles.greenButton}>
            <Text style={styles.greenButtonText}>Brown container</Text>
          </Pressable>

          <View style={styles.listContainer}>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>{"\u00A0\u00A0\u00A0"}• Separate:</Text> Keep organic waste separate from other trash.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>{"\u00A0\u00A0\u00A0"}• Compost:</Text> Turn fruit, vegetable, and garden waste into compost.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>{"\u00A0\u00A0\u00A0"}• Dispose:</Text> Use the green organic bin for collection.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Benefit</Text>
          <Text style={styles.benefitItem}>
            {"\u00A0\u00A0\u00A0"}1. <Text style={styles.bold}>Soil Improvement</Text>{"\n"}
            Composting organic  waste enriches soil and reduces landfill usage.
          </Text>
          <Text style={styles.benefitItem}>
            {"\u00A0\u00A0\u00A0"}2. <Text style={styles.bold}>Environmental Impact</Text>{"\n"}
            Proper handling reduces greenhouse gas emissions and prevents contamination.
          </Text>
        </ScrollView>

        {/* Open Guidelines */}
        <Pressable style={styles.viewGuidelinesButton} onPress={openGuidelines}>
          <Text style={styles.viewGuidelinesText}>View Guidelines</Text>
        </Pressable>
      </View>

      {/* Guidelines Overlay */}
      {showGuidelinesPage && (
        <View style={styles.fullOverlay}>
          <Pressable
            style={styles.transparentBack}
            onPress={closeGuidelines}
          >
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
              <Text style={styles.title}>Organic Guidelines</Text>
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
  container: { flex: 1, backgroundColor: "#F6F6E9" }, // light green for organic

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

  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
    marginTop: 10,
    color: "#000",
  },

  greenButton: {
    backgroundColor: "#8d5620ff",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: -45,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: "flex-end",
  },
  greenButtonText: { color: "#fff", fontWeight: "400" },

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

  viewGuidelinesButton: {
    backgroundColor: "#0ba45aff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  viewGuidelinesText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  fullOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#E6F5E6",
    zIndex: 999,
    justifyContent: "flex-start",
    padding: 16,
  },

  listRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

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

export default OrganicDetail;
