// src/app/Main/Home.jsx
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
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useUser } from "../../context/userContext";
import { useEducational } from "../../context/educationalContext";

const { width } = Dimensions.get("window");

const Home = () => {
  const { userData } = useUser();
  const { educationalContent, setSelectedType } = useEducational();
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pressedIndex, setPressedIndex] = useState(null);
  const [recyclingTypes, setRecyclingTypes] = useState([]);

  // conversion rates
  const [conversionRates, setConversionRates] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const router = useRouter();

  // 🔔 Realtime listener for user notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "userNotifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => doc.data());
      const unread = docs.filter((d) => !d.read).length;

      setUnreadCount(unread);
      setHasNewNotification(unread > 0);
    });

    return unsubscribe;
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
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/home/wordmarkLogo.png")}
              style={styles.wordmarkLogo}
              resizeMode="contain"
            />
            <View style={{ position: "relative" }}>
              <Ionicons
                name="notifications-outline"
                size={28}
                color="black"
                onPress={() => {
                  router.push("/Main/notifications");
                }}
              />
              {hasNewNotification && (
                <View style={styles.badgeNumber}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
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
              <TouchableOpacity
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
              </TouchableOpacity>
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
              <TouchableOpacity
                key={index}
                style={[
                  styles.typeButton,
                  pressedIndex === index && styles.typeButtonPressed,
                  index !== 0 ? { marginLeft: 10 } : { marginLeft: 0 },
                ]}
                onPress={() => {
                  setSelectedType(type);
                  router.push("/Main/recyclingGuide/guides");
                  setSelectedType(type);
                  router.push("/Main/recyclingGuide/guides");
                }}
              >
                <Text style={styles.typeButtonText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Conversion Rates */}
          <Text style={styles.sectionTitle}>Conversion Rates</Text>

          {Object.keys(groupedRates)
            .slice(0, 5)
            .map((category, catIdx) => {
              const rows = groupedRates[category];
              const firstRow = rows[0];

              return (
                <TouchableOpacity
                  key={catIdx}
                  onPress={() => router.push("/Main/conversionTable")}
                >
                  <View style={styles.card}>
                    {/* Header Bar */}
                    <View style={styles.headerBar}>
                      <Text style={styles.category}>{category} Conversion</Text>
                      <Ionicons name="chevron-forward" size={20} color="#fff" />
                    </View>

                    {/* Table preview with only first row */}
                    <View style={styles.table}>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.cellHeader, { flex: 2 }]}>
                          Type of Waste
                        </Text>
                        <Text style={styles.cellHeader}>Points/kg</Text>
                      </View>

                      {firstRow && (
                        <View
                          style={[styles.row, { backgroundColor: "#FFFFFF" }]}
                        >
                          <Text style={[styles.cell, { flex: 2 }]}>
                            {firstRow.type}
                          </Text>
                          <Text style={styles.cell}>{firstRow.points} pts</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeArea: { flexGrow: 1 },
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
  badgeNumber: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "red",
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },

  // conversion cards (same as staff styling)
  card: {
    backgroundColor: "#F6F8F0",
    borderRadius: 14,
    marginBottom: 15,
    overflow: "hidden",
  },
  headerBar: {
    backgroundColor: "#008243",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: { borderTopWidth: 1, borderTopColor: "#DDE3DA" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#CDE3B1",
    borderBottomWidth: 1,
    borderBottomColor: "#BBD39F",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#D6DEC8",
  },
  cellHeader: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
  },
  cell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
});

export default Home;
