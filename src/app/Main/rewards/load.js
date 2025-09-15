// src/app/Main/rewards/load.js
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// Sample offers (pwede i-fetch gikan sa backend later)
const offers = [
  {
    id: 1,
    title: "₱50 Load",
    points: 100,
    image: require("../../../assets/redeem/load.png"),
  },
  {
    id: 2,
    title: "₱100 Load",
    points: 200,
    image: require("../../../assets/redeem/load.png"),
  },
  {
    id: 3,
    title: "₱200 Load",
    points: 400,
    image: require("../../../assets/redeem/load.png"),
  },
  {
    id: 4,
    title: "₱500 Load",
    points: 1000,
    image: require("../../../assets/redeem/load.png"),
  },
];

const Load = () => {
  const router = useRouter();

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/Main/redeem_rewards")}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ScrapBack Load Offers</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.cardContainer}>
            {offers.map((offer) => (
              <TouchableOpacity
                key={offer.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => {
                  router.push({
                    pathname: "/Main/rewards/load_description",
                    params: { id: offer.id },
                  });
                }}
              >
                {/* Full-width Image */}
                <Image source={offer.image} style={styles.image} />
                {/* Title */}
                <Text style={styles.cardTitle}>{offer.title}</Text>
                {/* Points Display */}
                <View style={styles.pointsButton}>
                  <Text style={styles.pointsText}>{offer.points} Points</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default Load;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  scrollView: {
    padding: 16,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  card: {
    width: width * 0.42,
    backgroundColor: "#B6D799",
    borderRadius: 12,
    overflow: "hidden",
    margin: 8,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: width * 0.3,
    resizeMode: "cover",
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    marginVertical: 8,
    textAlign: "center",
    color: "#333",
  },
  pointsButton: {
    backgroundColor: "#008243",
    borderRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 12,
    marginBottom: 12,
    width: "80%",
  },
  pointsText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    textAlign: "center",
  },
});
