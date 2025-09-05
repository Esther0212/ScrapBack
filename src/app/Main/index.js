import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

const recyclingIcons = [
  { name: "Plastic", source: require("../../assets/home/plastic.png") },
  { name: "Paper", source: require("../../assets/home/paper.png") },
  { name: "Metal", source: require("../../assets/home/metal.png") },
  { name: "Glass", source: require("../../assets/home/glass.png") },
  { name: "eWaste", source: require("../../assets/home/eWaste.png") },
  { name: "Clothes", source: require("../../assets/home/clothes.png") },
  { name: "Organic", source: require("../../assets/home/organic.png") },
  { name: "Batteries", source: require("../../assets/home/batteries.png") },
  { name: "Carton", source: require("../../assets/home/carton.png") },
  {
    name: "Construction",
    source: require("../../assets/home/constriction.png"),
  },
];

const Home = () => {
  const [firstName, setFirstName] = useState("");
  const [hasNewNotification, setHasNewNotification] = useState(false); // <-- NEW STATE

  useEffect(() => {
    const loadFirstName = async () => {
      const name = await AsyncStorage.getItem("firstName");
      if (name) {
        setFirstName(name);
      }
    };
    loadFirstName();
  }, []);

  // Simulate checking for new notifications
  useEffect(() => {
    const checkNotifications = async () => {
      // Replace this logic with your actual Firestore call
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "notifications", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Suppose it has a field like: { unreadCount: number }
        setHasNewNotification(data.unreadCount > 0);
      }
    };

    checkNotifications();
  }, []);

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/home/wordmarkLogo.png")}
              style={styles.wordmarkLogo}
              resizeMode="contain"
            />
            <Ionicons
              name={
                hasNewNotification ? "notifications" : "notifications-outline"
              }
              size={24}
              color="black"
            />
          </View>

          {/* Greeting */}
          <Text style={styles.greeting}>Hi, {firstName}</Text>
          <Text style={styles.subGreeting}>
            Every action counts—start recycling today!
          </Text>

          {/* Points and Rewards */}
          <View style={styles.pointsContainer}>
            <View style={styles.leftContainer}>
              <Text style={styles.pointsLabel}>Your Total Points</Text>
              <View style={styles.rowContainer}>
                <Image
                  source={require("../../assets/home/lettermarkLogo.png")}
                  style={styles.lettermarkLogo}
                  resizeMode="cover"
                />
                <Text style={styles.pointsValueText}>500</Text>
              </View>
            </View>

            <View style={styles.rightContainer}>
              <TouchableOpacity style={styles.redeemButton}>
                <Text style={styles.redeemText}>🎁 Redeem Rewards</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recycling Guide */}
          <Text style={styles.sectionTitle}>Recycling Guide</Text>
          <View style={styles.iconGrid}>
            {recyclingIcons.map((item, index) => (
              <TouchableOpacity key={index} style={styles.iconButton}>
                <Image source={item.source} style={styles.iconImage} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmarkLogo: {
    width: 120,
    height: 40,
  },
  greeting: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    marginTop: 8,
  },
  subGreeting: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Poppins_400Regular",
    marginBottom: 16,
  },
  pointsContainer: {
    width: "100%",
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#B6D799",
    borderRadius: 10,
    alignItems: "flex-end", // aligns left and right containers at bottom
  },
  leftContainer: {
    width: "50%",
    justifyContent: "flex-end", // pushes inner content (pointsLabel + rowContainer) to the bottom
  },
  pointsLabel: {
    fontSize: 14,
    color: "#444",
    fontFamily: "Poppins_400Regular",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-end", // aligns text and icon to the bottom
    gap: 6, // optional spacing between icon and number
    flex: 1,
  },
  lettermarkLogo: {
    width: 28,
    height: 28,
  },
  pointsValueText: {
    fontSize: 28,
    color: "#2E7D32",
    fontFamily: "Poppins_800ExtraBold",
    lineHeight: 32,
  },
  rightContainer: {
    width: "50%",
  },
  redeemButton: {
    flex: 1,
    backgroundColor: "#008243",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  redeemText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  iconButton: {
    width: "18%",
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#008243",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  iconImage: {
    width: 18,
    height: 18,
  },
});

export default Home;
