import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from "react-native";
import CustomBgColor from "../../../components/customBgColor";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "../../../context/userContext";

const { height, width } = Dimensions.get("window");

const Profile = () => {
  const { userData, setUserData } = useUser(); // context
  const [activeTab, setActiveTab] = useState("points"); // "points" | "rewards"
  const iconSize = Math.min(width * 0.07, 28); // 7% of width but max 28

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeAreaView}>
        <View style={styles.container}>
          {/* Box stays at the bottom */}
          <View style={styles.box}>
            {/* Profile image floating half in, half out */}
            <View style={styles.imageWrapper}>
              <Image
                source={require("../../../assets/profile/defaultUser.png")}
                style={styles.profileImage}
              />
            </View>

            {/* User Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.nameText}>
                {userData?.firstName} {userData?.lastName}
              </Text>
              <Text style={styles.emailText}>{userData?.email}</Text>
            </View>

            {/* Tab Section */}
            <View style={styles.tabContainer}>
              {/* Points Tab */}
              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab("points")}
              >
                <Image
                  source={
                    activeTab === "points"
                      ? require("../../../assets/profile/pointsActive.png")
                      : require("../../../assets/profile/inactivePoints.png")
                  }
                  style={[
                    styles.tabIcon,
                    {
                      tintColor: activeTab === "points" ? "#008243" : "#ADADAD",
                    }, // ensure color consistency
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Rewards Tab */}
              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab("rewards")}
              >
                <Ionicons
                  name="gift-sharp"
                  size={styles.tabIcon.width} // same size as points
                  color={activeTab === "rewards" ? "#008243" : "#ADADAD"}
                />
              </TouchableOpacity>
            </View>

            {/* Horizontal line below tabs */}
            <View style={styles.tabUnderlineContainer}>
              <View
                style={[
                  styles.tabUnderline,
                  {
                    backgroundColor:
                      activeTab === "points" ? "#008243" : "#ADADAD",
                  },
                ]}
              />
              <View
                style={[
                  styles.tabUnderline,
                  {
                    backgroundColor:
                      activeTab === "rewards" ? "#008243" : "#ADADAD",
                  },
                ]}
              />
            </View>

            {/* Tab Content */}
            <View style={styles.contentContainer}>
              {activeTab === "points" ? (
                <>
                  <Text style={styles.titleText}>No earned points yet</Text>
                  <Text style={styles.subtitleText}>
                    Recycle your first scrap and your points will appear here.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.titleText}>No redeemed rewards yet</Text>
                  <Text style={styles.subtitleText}>
                    Redeem rewards with your points and they’ll show up here.
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "flex-end", // Box always at bottom
  },
  box: {
    backgroundColor: "#F0F1C5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: height * 0.75, // responsive 3/4 screen height
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    paddingTop: width / 8, // leave space for half of profile image
  },
  imageWrapper: {
    position: "absolute",
    top: -width / 8, // move up by half of image height
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: width / 4,
    height: width / 4,
    borderRadius: width / 8, // make it circular
    resizeMode: "cover",
  },
  infoContainer: {
    marginTop: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  nameText: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
  },
  emailText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 8, // space before underline
    width: "100%",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    width: width * 0.07, // responsive size (7% of screen width)
    height: width * 0.07,
  },
  tabUnderlineContainer: {
    flexDirection: "row",
    paddingHorizontal: 20, // padding from left & right edges
    marginBottom: 10, // space below line
  },
  tabUnderline: {
    flex: 1,
    height: 2,
    borderRadius: 2,
  },
  contentContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  titleText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#555",
    textAlign: "center",
  },
});

export default Profile;
