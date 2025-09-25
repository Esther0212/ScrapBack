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
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useUser } from "../../context/userContext";

const { width } = Dimensions.get("window");
const router = useRouter();

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
  const { userData } = useUser(); // context
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [pressedIndex, setPressedIndex] = useState(null);
  const [eduImages, setEduImages] = useState([]); // 🔹 Array for educational images

  useEffect(() => {
    const loadFirstName = async () => {
      const name = await AsyncStorage.getItem("firstName");
      if (name) setFirstName(name);
    };
    loadFirstName();
  }, []);

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

  // 🔹 Fetch ALL educational content images
  useEffect(() => {
    const fetchEducationalContent = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "educationalContent")
        );
        const images = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.image) {
            // Add base64 prefix
            images.push(`data:image/png;base64,${data.image}`);
          }
        });

        setEduImages(images);
      } catch (error) {
        console.error("Error fetching educational content:", error);
      }
    };
    fetchEducationalContent();
  }, []);

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
              <View
                style={styles.redeemButton}
                onTouchStart={() => router.push("/Main/redeem_rewards")}
              >
                <Ionicons
                  name="gift-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.redeemText}>Redeem Rewards</Text>
              </View>
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
            {recyclingIcons.map((item, index) => (
              <Pressable
                key={index}
                style={[
                  styles.iconButton,
                  pressedIndex === index && styles.iconButtonHovered,
                  index !== 0 && index !== recyclingIcons.length - 1
                    ? { marginRight: 10, marginLeft: 0 }
                    : index === 0
                    ? { marginRight: 10 }
                    : { marginLeft: 0 },
                ]}
                onPress={() => router.replace(`/Main/recyclingGuide/stepsBenefits?type=${item.name}`)}

              >
                <Image source={item.source} style={styles.iconImage} />
                {pressedIndex === index && (
                  <Text style={styles.iconText}>{item.name}</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>

          {/* 🔹 Educational Content Banners */}
          {eduImages.length > 0 &&
            eduImages.map((img, idx) => (
              <View key={idx} style={styles.educationalContainer}>
                <Image
                  source={{ uri: img }}
                  style={styles.educationalImage}
                  resizeMode="cover"
                />
              </View>
            ))}
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
    alignItems: "flex-end",
  },
  leftContainer: {
    width: "50%",
    justifyContent: "flex-end",
  },
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
    flexDirection: "row", // 🔹 put icon and text side by side
    paddingVertical: 8,
  },
  redeemText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
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
  iconScroll: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#008243",
    elevation: 2,
    justifyContent: "center",
  },
  iconButtonHovered: {
    paddingHorizontal: 15,
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  iconText: {
    marginLeft: 8,
    color: "white",
    fontFamily: "Poppins_600SemiBold",
  },
  // 🔹 Educational banner styles
  educationalContainer: {
    marginTop: 24,
  },
  educationalImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
  },
});

export default Home;
