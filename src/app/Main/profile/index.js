import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import CustomBgColor from "../../../components/customBgColor";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "../../../context/userContext";
import { db } from "../../../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const { height, width } = Dimensions.get("window");

const Profile = () => {
  const { userData } = useUser();
  const [activeTab, setActiveTab] = useState("points");
  const [logs, setLogs] = useState([]);
  const [rewards, setRewards] = useState([]); // ✅ rewards state
  const [loading, setLoading] = useState(true);
  const [loadingRewards, setLoadingRewards] = useState(true);

  // ✅ Profile image source
  const profileImageSource = userData?.profilePic
    ? { uri: userData.profilePic }
    : require("../../../assets/profile/defaultUser.png");

  // ✅ Fetch contribution logs
  useEffect(() => {
    const fetchLogs = async () => {
      if (!userData?.uid) return;
      try {
        const q = query(
          collection(db, "contribution_logs"),
          where("userId", "==", userData.uid)
        );
        const querySnapshot = await getDocs(q);
        const logsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(
          logsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
        );
      } catch (error) {
        console.error("Error fetching contribution logs: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [userData?.uid]);

  // ✅ Fetch redemption logs
  useEffect(() => {
    const fetchRewards = async () => {
      if (!userData?.uid) return;
      try {
        const q = query(
          collection(db, "redemption_logs"),
          where("userId", "==", userData.uid)
        );
        const querySnapshot = await getDocs(q);
        const rewardsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRewards(
          rewardsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
        );
      } catch (error) {
        console.error("Error fetching redemption logs: ", error);
      } finally {
        setLoadingRewards(false);
      }
    };

    fetchRewards();
  }, [userData?.uid]);

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeAreaView}>
        <View style={styles.container}>
          <View style={styles.box}>
            {/* Profile Image */}
            <View style={styles.imageWrapper}>
              <Image source={profileImageSource} style={styles.profileImage} />
            </View>

            {/* User Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.nameText}>
                {userData?.firstName || "Guest"} {userData?.lastName || ""}
              </Text>
              <Text style={styles.emailText}>
                {userData?.email || "Not signed in"}
              </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
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
                    },
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tab}
                onPress={() => setActiveTab("rewards")}
              >
                <Ionicons
                  name="gift-sharp"
                  size={styles.tabIcon.width}
                  color={activeTab === "rewards" ? "#008243" : "#ADADAD"}
                />
              </TouchableOpacity>
            </View>

            {/* Tab Underline */}
            <View style={styles.tabUnderlineContainer}>
              <View
                style={[
                  styles.tabUnderline,
                  { backgroundColor: activeTab === "points" ? "#008243" : "#ADADAD" },
                ]}
              />
              <View
                style={[
                  styles.tabUnderline,
                  { backgroundColor: activeTab === "rewards" ? "#008243" : "#ADADAD" },
                ]}
              />
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              {activeTab === "points" ? (
                loading ? (
                  <Text>Loading logs...</Text>
                ) : logs.length > 0 ? (
                  <FlatList
                    data={logs}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    renderItem={({ item }) => (
                      <View style={styles.logItem}>
                        {/* Category Title */}
                        <Text style={styles.logCategory}>
                          {item.category || "Uncategorized"}
                        </Text>

                        {/* Points */}
                        <Text style={styles.logPoints}>
                          +{item.points || 0} pts
                        </Text>

                        {/* Date */}
                        <Text style={styles.logDate}>
                          {item.createdAt?.seconds
                            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                            : "No date"}
                        </Text>
                      </View>
                    )}
                  />
                ) : (
                  <>
                    <Text style={styles.titleText}>No earned points yet</Text>
                    <Text style={styles.subtitleText}>
                      Recycle your first scrap and your points will appear here.
                    </Text>
                  </>
                )
              ) : loadingRewards ? (
                <Text>Loading rewards...</Text>
              ) : rewards.length > 0 ? (
                <FlatList
                  data={rewards}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <View style={styles.logItem}>
                      {/* Reward Name */}
                      <Text style={styles.logCategory}>
                        {item.rewardCategory || "Unknown Reward"}
                      </Text>

                      {/* Points spent */}
                      <Text style={styles.logPoints}>
                        -{item.points || 0} pts
                      </Text>

                      {/* Date */}
                      <Text style={styles.logDate}>
                        {item.createdAt?.seconds
                          ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                          : "No date"}
                      </Text>
                    </View>
                  )}
                />
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
    minHeight: height * 0.75,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    paddingTop: width / 8,
  },
  imageWrapper: {
    position: "absolute",
    top: -width / 8,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: width / 4,
    height: width / 4,
    borderRadius: width / 8,
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
    marginBottom: 8,
    width: "100%",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    width: width * 0.07,
    height: width * 0.07,
  },
  tabUnderlineContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tabUnderline: {
    flex: 1,
    height: 2,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 20,
  },
  logItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logPoints: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#008243",
  },
  logDate: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#777",
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
  logCategory: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold", // bold for emphasis
    marginBottom: 6,
  },
});

export default Profile;
