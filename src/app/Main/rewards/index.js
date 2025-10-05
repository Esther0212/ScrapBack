// src/app/Main/rewards/index.js
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../../components/customBgColor";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const RewardsIndex = () => {
  const router = useRouter();

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        {/* Body */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.descriptionText}>
            ♻️ Here are the rewards you can redeem using your earned points:
          </Text>

          <View style={styles.cardContainer}>
            {/* RICE */}
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push("/Main/rewards/sack")}
            >
              <LinearGradient
                colors={["#A5D6A7", "#E8F5E9"]}
                style={styles.gradientCard}
              >
                <Image
                  source={require("../../../assets/redeem/rice.png")}
                  style={styles.icon}
                />
                <Text style={styles.cardTitle}>Rice Sack</Text>
                <Text style={styles.cardSubtitle}>Redeemable Onsite</Text>
                <TouchableOpacity
                  style={styles.redeemButton}
                  onPress={() => router.push("/Main/rewards/sack")}
                >
                  <Text style={styles.redeemText}>Redeem</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>

            {/* LOAD */}
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push("/Main/rewards/load")}
            >
              <LinearGradient
                colors={["#A5D6A7", "#E8F5E9"]}
                style={styles.gradientCard}
              >
                <Image
                  source={require("../../../assets/redeem/load.png")}
                  style={styles.icon}
                />
                <Text style={styles.cardTitle}>Load</Text>
                <Text style={styles.cardSubtitle}>
                  Redeemable Onsite/Online
                </Text>
                <TouchableOpacity
                  style={styles.redeemButton}
                  onPress={() => router.push("/Main/rewards/load")}
                >
                  <Text style={styles.redeemText}>Redeem</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>

            {/* GCASH */}
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push("/Main/rewards/gcash")}
            >
              <LinearGradient
                colors={["#A5D6A7", "#E8F5E9"]}
                style={styles.gradientCard}
              >
                <Image
                  source={require("../../../assets/redeem/gcash.png")}
                  style={styles.icon}
                />
                <Text style={styles.cardTitle}>GCash</Text>
                <Text style={styles.cardSubtitle}>Redeemable Online</Text>
                <TouchableOpacity
                  style={styles.redeemButton}
                  onPress={() => router.push("/Main/rewards/gcash")}
                >
                  <Text style={styles.redeemText}>Redeem</Text>
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
            {/* OTHERS */}
<TouchableOpacity
  style={styles.card}
  activeOpacity={0.9}
  onPress={() => router.push("/Main/rewards/others")}
>
  <LinearGradient
    colors={["#A5D6A7", "#E8F5E9"]}
    style={styles.gradientCard}
  >
    <Image
      source={require("../../../assets/redeem/other.png")}
      style={styles.icon}
    />
    <Text style={styles.cardTitle}>Others</Text>
    <Text style={styles.cardSubtitle}>Redeemable Onsite/Online</Text>
    <TouchableOpacity
      style={styles.redeemButton}
      onPress={() => router.push("/Main/rewards/others")}
    >
      <Text style={styles.redeemText}>Redeem</Text>
    </TouchableOpacity>
  </LinearGradient>
</TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default RewardsIndex;

// ✅ Styles matching your rice.js
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
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#1B5E20",
    textAlign: "center",
    marginBottom: 20,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  card: {
    width: width * 0.44,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  gradientCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 20,
  },
  icon: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#1B5E20",
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#444",
    textAlign: "center",
    marginBottom: 10,
  },
  redeemButton: {
    backgroundColor: "#008243",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 22,
    marginTop: 5,
  },
  redeemText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
});
