import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useUser } from "../../context/userContext";
import { useEducational } from "../../context/educationalContext";

const { width } = Dimensions.get("window");

const Home = () => {
  const { userData } = useUser(); // context
  const { educationalContent, setSelectedType } = useEducational(); // 🔹 now includes setSelectedType
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [pressedIndex, setPressedIndex] = useState(null);
  const [recyclingTypes, setRecyclingTypes] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const checkNotifications = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const docRef = doc(db, "notifications", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHasNewNotification(data.unreadCount > 0);
      }
    };
    checkNotifications();
  }, []);

  // 🔹 Extract recycling types from context
  useEffect(() => {
    if (educationalContent && educationalContent.length > 0) {
      const types = educationalContent.map((item) => item.type);
      setRecyclingTypes(types);
    }
  }, [educationalContent]);

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
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
          <Text style={styles.greeting}>
            Hi, {userData?.firstName || "Guest"}
          </Text>
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
              <Pressable
                style={styles.redeemButton}
                onPress={() => router.push("/Main/rewards/")}
              >
                <Ionicons
                  name="gift-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.redeemText}>Redeem Rewards</Text>
              </Pressable>
            </View>
          </View>

          {/* Recycling Guide */}
          <Text style={styles.sectionTitle}>Recycling Guide</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.iconScroll}
          >
            {recyclingTypes.map((type, index) => (
              <Pressable
                key={index}
                style={[
                  styles.typeButton,
                  pressedIndex === index && styles.typeButtonPressed,
                  index !== 0 ? { marginLeft: 10 } : { marginLeft: 0 },
                ]}
                onPress={() => {
                  setSelectedType(type); // 🔹 save selected type globally
                  router.push("/Main/recyclingGuide/guides"); // 🔹 no params anymore
                }}
              >
                <Text style={styles.typeButtonText}>{type}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmarkLogo: { width: 120, height: 40 },
  greeting: { fontSize: 20, fontFamily: "Poppins_700Bold", marginTop: 8 },
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
    alignItems: "flex-end",
  },
  leftContainer: { width: "50%", justifyContent: "flex-end" },
  pointsLabel: {
    fontSize: 14,
    color: "#444",
    fontFamily: "Poppins_400Regular",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    flex: 1,
  },
  lettermarkLogo: { width: 28, height: 28 },
  pointsValueText: {
    fontSize: 28,
    color: "#2E7D32",
    fontFamily: "Poppins_800ExtraBold",
    lineHeight: 32,
  },
  rightContainer: { width: "50%" },
  redeemButton: {
    flex: 1,
    backgroundColor: "#008243",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingVertical: 8,
  },
  redeemText: { color: "white", fontFamily: "Poppins_700Bold", fontSize: 14 },
  sectionTitle: {
    marginTop: 24,
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginBottom: 12,
  },
  iconScroll: { flexDirection: "row", alignItems: "center" },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#008243",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  typeButtonPressed: { backgroundColor: "#005f1a" },
  typeButtonText: { color: "white", fontFamily: "Poppins_700Bold" },
});

export default Home;
