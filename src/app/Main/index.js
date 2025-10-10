import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useUser } from "../../context/userContext";
import { useEducational } from "../../context/educationalContext";

const { width } = Dimensions.get("window");

const Home = () => {
  const { userData } = useUser();
  const { educationalContent, setSelectedType } = useEducational();
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [pressedIndex, setPressedIndex] = useState(null);
  const [recyclingTypes, setRecyclingTypes] = useState([]);

  // conversion rates
  const [conversionRates, setConversionRates] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});
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

  // recycling types
  useEffect(() => {
    if (educationalContent && educationalContent.length > 0) {
      const types = educationalContent.map((item) => item.type);
      setRecyclingTypes(types);
    }
  }, [educationalContent]);

  // fetch conversion rates
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "wasteConversionRates"),
      (snapshot) => {
        const rates = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setConversionRates(rates);
      }
    );
    return () => unsub();
  }, []);

  // group by category
  const groupedRates = conversionRates.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const toggleCategory = (category) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

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

          {/* Points */}
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
                  setSelectedType(type);
                  router.push("/Main/recyclingGuide/guides");
                }}
              >
                <Text style={styles.typeButtonText}>{type}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Conversion Rates */}
          <Text style={styles.sectionTitle}>Conversion Rates</Text>

          <TouchableOpacity
            onPress={() => router.push("/Main/conversionRates")}
            activeOpacity={0.8}
          >
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.headerText}>Waste Type</Text>
              <Text style={styles.headerText}>Points/kg</Text>
            </View>

            {Object.keys(groupedRates)
              .slice(0, 5)
              .map((category) => {
                const rows = groupedRates[category];
                const firstRow = rows[0]; // still only showing first row per category

                return (
                  <View key={category}>
                    {/* Category Row */}
                    <View style={styles.categoryRow}>
                      <Text style={styles.categoryText}>{category}</Text>
                    </View>

                    {/* First Row */}
                    {firstRow && (
                      <View style={styles.tableRow}>
                        <Text style={styles.rowType}>{firstRow.type}</Text>
                        <Text style={styles.rowPoints}>
                          {firstRow.points} pts/kg
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

            {/* Footer to show it's preview */}
            <View style={styles.previewFooter}>
              <Text style={styles.previewText}>See all conversion rates</Text>
              <Ionicons name="chevron-forward" size={18} color="#008243" />
            </View>
          </TouchableOpacity>
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

  // table styles
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#008243",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  categoryRow: {
    backgroundColor: "#E3F6E3",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  categoryText: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: "#fff",
  },
  rowType: { fontSize: 15, fontFamily: "Poppins_400Regular", color: "#333" },
  rowPoints: { fontSize: 15, fontFamily: "Poppins_400Regular", color: "#333" },
  toggleText: { fontSize: 12, color: "#666" },

  previewContainer: {
    borderRadius: 8,
    overflow: "hidden", // ✅ makes header and footer radius clip properly
    backgroundColor: "#fff",
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  
  previewFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#E3F6E3",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  previewText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#008243",
    marginRight: 6,
  },
});

export default Home;
