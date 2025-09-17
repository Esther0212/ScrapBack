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


const PlasticDetail = () => {
  const navigation = useNavigation();
  const [showGuidelinesPage, setShowGuidelinesPage] = useState(false);
  const [showDos, setShowDos] = useState(true);
  const router = useRouter();

  const slideAnim = useRef(new Animated.Value(-300)).current;

  const dosList = [
    "Do rinse plastic bottles before recycling.",
    "Do separate plastics by type if required by your local recycling program.",
    "Do remove caps and labels if specified by recycling guidelines.",
    "Do crush bottles to save space.",
    "Do reuse plastic containers whenever possible.",
  ];

  const dontsList = [
    "Don't throw plastic bags in regular recycling bins.",
    "Don't mix plastics with food waste.",
    "Don't recycle dirty or contaminated plastics.",
    "Don't recycle plastics that are not accepted by your local program.",
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
  onPress={() => router.push("/Main/Home")} // navigate directly to Home page
>
  <Ionicons name="arrow-back" size={22} color="#fff" />
</Pressable>

<Pressable
  style={styles.transparentBack}
  onPress={closeGuidelines} // closes overlay to reveal Recycling section
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
          <Text style={styles.title}>How to Recycle Plastic</Text>

          <Pressable style={styles.yellowButton}>
            <Text style={styles.yellowButtonText}>Yellow container</Text>
          </Pressable>

          <View style={styles.listContainer}>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Check:</Text> Find the recycling symbol (1–7) on the plastic.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Clean:</Text> Rinse off food or liquids.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Sort:</Text> Group by type if needed.
            </Text>
            <Text style={styles.listItem}>
              <Text style={styles.bold}>• Dispose:</Text> Use recycling bins or centers.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Benefit</Text>
          <Text style={styles.benefitItem}>
            1. <Text style={styles.bold}>Environmental Impact</Text>{"\n"}
            Recycling plastic reduces pollution, conserves resources, and lowers greenhouse gas emissions.
          </Text>
          <Text style={styles.benefitItem}>
            2. <Text style={styles.bold}>Economic Efficiency</Text>{"\n"}
            It saves costs, creates jobs in recycling industries, and supports a circular economy.
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
          {/* Back button that ONLY closes the overlay */}
          {!showGuidelinesPage ? (
  <Pressable
    style={styles.transparentBack}
    onPress={() => router.push("/Main/Home")} // Recycling page back button
  >
    <Ionicons name="arrow-back" size={22} color="#fff" />
  </Pressable>
) : (
  <Pressable
    style={styles.transparentBack}
    onPress={closeGuidelines} // Guidelines overlay back button
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

          <Animated.View
            style={[
              styles.card,
              { transform: [{ translateY: slideAnim }], marginTop: 15 },
            ]}
          >
            <View style={styles.guidelinesHeader}>
              <Text style={styles.title}>Plastic Guidelines</Text>
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

  topImageContainer: { alignItems: "center", marginBottom: -10, marginTop: 20 },
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

  yellowButton: {
    backgroundColor: "#ffdd6cff",
    borderRadius: 20,
    marginBottom: 20,
    marginTop: -45,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: "flex-end",
  },
  yellowButtonText: { color: "#ffffffff", fontWeight: "400" },

  listContainer: { marginBottom: 16 },
  listItem: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
    color: "#333",
  },
  bold: { fontWeight: "700" },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: "#000",
  },
  benefitItem: { fontSize: 13, marginBottom: 8, lineHeight: 20, color: "#333" },

  transparentBack: {
    position: "absolute",
    top: 20,
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
    marginBottom: 40,
  },
  viewGuidelinesText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

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

  listRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

  guidelinesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 25,
  },
  activeDos: { backgroundColor: "#388E3C" },
  activeDonts: { backgroundColor: "#D32F2F" },
  toggleText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

export default PlasticDetail;
