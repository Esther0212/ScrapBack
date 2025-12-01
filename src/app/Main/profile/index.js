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
  ActivityIndicator,
} from "react-native";
import CustomBgColor from "../../../components/customBgColor";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { useUser } from "../../../context/userContext";
import { useRouter } from "expo-router";
import { db } from "../../../../firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

const { height, width } = Dimensions.get("window");

const Profile = () => {
  const { userData } = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("points");
  const [logs, setLogs] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRewards, setLoadingRewards] = useState(true);

  const profileImageSource = userData?.profilePic
    ? { uri: userData.profilePic }
    : require("../../../assets/profile/defaultUser.png");

  // Helper: group by date
  const groupLogsByDate = (logs) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    return logs.reduce((groups, log) => {
      if (!log.createdAt?.seconds) return groups;

      const logDate = new Date(log.createdAt.seconds * 1000);
      const logDateStr = logDate.toDateString();
      const todayStr = today.toDateString();
      const yesterdayStr = yesterday.toDateString();

      let groupKey;
      if (logDateStr === todayStr) groupKey = "Today";
      else if (logDateStr === yesterdayStr) groupKey = "Yesterday";
      else {
        groupKey = logDate.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(log);
      return groups;
    }, {});
  };

  // 🔹 Fetch contribution logs
  useEffect(() => {
    if (!userData?.uid) return;
  
    console.log("🔄 Setting up real-time listener for contribution_logs...");
  
    const q = query(
      collection(db, "contribution_logs"),
      where("userId", "==", userData.uid)
    );
  
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("📡 Snapshot received for contribution_logs:", snapshot.size, "docs");
        const logsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(
          logsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
        );
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error in contribution_logs snapshot:", error);
      }
    );
  
    // 🧹 Cleanup
    return () => {
      console.log("🧹 Unsubscribing from contribution_logs listener");
      unsubscribe();
    };
  }, [userData?.uid]);
  

  // 🔹 Fetch redemption logs
  useEffect(() => {
    if (!userData?.uid) return;
  
    console.log("🔄 Setting up real-time listener for redemption_logs...");
  
    const q = query(
      collection(db, "redemption_logs"),
      where("userId", "==", userData.uid)
    );
  
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("📡 Snapshot received for redemption_logs:", snapshot.size, "docs");
        const rewardsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRewards(
          rewardsData.sort(
            (a, b) => b.createdAt?.seconds - a.createdAt?.seconds
          )
        );
        setLoadingRewards(false);
      },
      (error) => {
        console.error("❌ Error in redemption_logs snapshot:", error);
      }
    );
  
    // 🧹 Cleanup
    return () => {
      console.log("🧹 Unsubscribing from redemption_logs listener");
      unsubscribe();
    };
  }, [userData?.uid]);
  
// 🔹 Render grouped list
const renderGroupedList = (groupedData, type = "points") => (
  <FlatList
    data={Object.entries(groupedData)}
    keyExtractor={([date]) => date}
    contentContainerStyle={{ paddingBottom: 40 }}
    renderItem={({ item }) => {
      const [date, items] = item;
      return (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.dateHeader}>{date}</Text>

          {items.map((log) => {
            const status = (log.status || "").toLowerCase().trim();
            const isVoided =
              status === "voided" || status === "void" || log.void === true;

            return (
              <TouchableOpacity
                key={log.id}
                style={[
                  styles.logCard,
                  type === "points" && { borderColor: "#3cd38aff" },
                  type === "rewards" && { borderColor: "#FF6B6B" },
                  isVoided && {
                    opacity: 0.7,
                    backgroundColor: "#FFF1F1",
                    borderColor: "#E57373",
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname:
                      type === "points"
                        ? "/Main/profile/contributionLogs"
                        : "/Main/profile/redemptionLogs",
                    params: { id: log.id },
                  })
                }
                disabled={isVoided} // 🧱 disable tap on voided
              >
                {/* LEFT SIDE IMAGE */}
                <View style={styles.leftSide}>
                  <Image
                    source={
                      type === "points"
                        ? log.staffPhotoUrl
                          ? { uri: log.staffPhotoUrl }
                          : require("../../../assets/profile/noImage.png")
                        : log.proofPhotoUrl
                        ? { uri: log.proofPhotoUrl }
                        : require("../../../assets/profile/noImage.png")
                    }
                    style={styles.staffPhoto}
                  />
                </View>

                {/* RIGHT SIDE CONTENT */}
                <View style={styles.rightSide}>
                  {type === "points" ? (
                    <>
                      <View style={styles.pointsRow}>
                        <Text
                          style={[
                            styles.pointsText,
                            isVoided && {
                              textDecorationLine: "line-through",
                              color: "#A00",
                            },
                          ]}
                        >
                          +{log.totalPoints || 0} pts
                        </Text>

                        {isVoided && (
                          <Text style={styles.voidedTag}>VOIDED</Text>
                        )}
                      </View>

                      {log.selectedTypes && (
                        <View style={styles.typeContainer}>
                          {log.selectedTypes.map((type) => (
                            <View key={type} style={styles.typeRow}>
                              <Text style={styles.typeLabel}>{type}</Text>
                              <Text style={styles.typeValue}>
                                {log.weights?.[type]
                                  ? `${log.weights[type]} kg`
                                  : "0 kg"}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      <View style={styles.pointsRow}>
                        <Text
                          style={[
                            styles.pointsTextRed,
                            isVoided && {
                              textDecorationLine: "line-through",
                              color: "#A00",
                            },
                          ]}
                        >
                          -{log.points || 0} pts
                        </Text>

                        {isVoided && (
                          <Text style={styles.voidedTag}>VOIDED</Text>
                        )}
                      </View>

                      <Text style={styles.smallText}>
                        {log.rewardName || "Reward"}
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }}
  />
);

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

            {/* Content */}
            <View style={styles.contentContainer}>
              {activeTab === "points" ? (
                loading ? (
                  <ActivityIndicator color="#008243" size="large" />
                ) : logs.length > 0 ? (
                  renderGroupedList(groupLogsByDate(logs), "points")
                ) : (
                  <Text style={styles.titleText}>No earned points yet</Text>
                )
              ) : loadingRewards ? (
                <ActivityIndicator color="#008243" size="large" />
              ) : rewards.length > 0 ? (
                renderGroupedList(groupLogsByDate(rewards), "rewards")
              ) : (
                <Text style={styles.titleText}>No redeemed rewards yet</Text>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeAreaView: { flex: 1 },
  container: { flex: 1, justifyContent: "flex-end" },
  box: {
    backgroundColor: "#F0F1C5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: height * 0.65,
    elevation: 3,
    alignItems: "center",
    paddingTop: width / 8,
  },
  imageWrapper: { position: "absolute", top: -width / 8, alignItems: "center" },
  profileImage: {
    width: width / 4,
    height: width / 4,
    borderRadius: width / 8,
  },
  infoContainer: { marginTop: 10, alignItems: "center", marginBottom: 20 },
  nameText: { fontSize: 20, fontFamily: "Poppins_700Bold" },
  emailText: { fontSize: 16, fontFamily: "Poppins_400Regular" },
  tabContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 8,
    width: "100%",
  },
  tab: { flex: 1, alignItems: "center" },
  tabIcon: { width: width * 0.07, height: width * 0.07 },
  tabUnderlineContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tabUnderline: { flex: 1, height: 2, borderRadius: 2 },
  contentContainer: { flex: 1, width: "100%", paddingHorizontal: 20 },
  titleText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginTop: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 8,
  },
  logCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#3cd38aff",
    justifyContent: "flex-start",
  },
  leftSide: { marginRight: 14, justifyContent: "center" },
  staffPhoto: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  rightSide: { flex: 1 },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#008243",
    marginBottom: 6,
  },
  pointsTextRed: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#D22B2B",
    marginBottom: 6,
  },
  smallText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  typeContainer: {
    width: "100%",
  },
  
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // keeps left & right apart
    width: "100%",
  },
  
  typeLabel: {
    flexShrink: 1, // ✅ allows long text to wrap or truncate if needed
    flex: 1, // ✅ lets it take remaining space
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginRight: 10, // ✅ adds breathing room before the kg value
  },
  
  typeValue: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    textAlign: "right",
    minWidth: 50, // ✅ keeps a consistent width for the right column
  },
  voidedTag: {
  fontSize: 12,
  fontFamily: "Poppins_700Bold",
  color: "#D22B2B",
  backgroundColor: "#FADBD8",
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 6,
  textAlign: "center",
  marginLeft: 8,
  overflow: "hidden",
},

});

export default Profile;
