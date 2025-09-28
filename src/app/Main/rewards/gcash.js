// src/app/Main/rewards/gcash.js
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

// ✅ Firestore
import { db } from "../../../../firebase";
import { collection, getDocs } from "firebase/firestore";

const { width } = Dimensions.get("window");

const Gcash = () => {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "reward"));
        const gcashRewards = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((r) => r.category === "gcash"); 

        setOffers(gcashRewards);
      } catch (err) {
        console.error("Error fetching GCash rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/Main/redeem_rewards")}>
            <Ionicons name="arrow-back" size={26} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ScrapBack GCash Offers</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Content */}
        {loading ? (
          <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 30 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.cardContainer}>
              {offers.map((offer) => (
                <TouchableOpacity
                  key={offer.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/Main/rewards/gcash_description",
                      params: { id: offer.id }, 
                    })
                  }
                >
                  {/* Image with Gradient Overlay */}
                  <View style={styles.imageWrapper}>
                    {offer.image && (
                      <Image source={{ uri: offer.image }} style={styles.image} />
                    )}
                    <LinearGradient
                      colors={["rgba(0,0,0,0.3)", "transparent"]}
                      style={styles.imageOverlay}
                    />
                    {/* Points Badge */}
                    <View style={styles.pointsBadge}>
                      <Image
                        source={require("../../../assets/home/lettermarkLogo.png")}
                        style={styles.logoIcon}
                      />
                      <Text style={styles.pointsText}>{offer.points} pts</Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={styles.cardTitle}>{offer.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default Gcash;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },
  scrollView: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: width * 0.46,
    borderRadius: 20,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: width * 0.38,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#1B5E20",
    paddingVertical: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  pointsBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  logoIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  pointsText: {
    color: "#2E7D32",
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    marginLeft: 6,
    marginTop: 2,
  },
});
