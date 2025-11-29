// src/app/Main/notifications/index.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../firebase";
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  writeBatch,
  doc,
  updateDoc,
  orderBy,
  getDoc,
} from "firebase/firestore";
import CustomBgColor from "../../components/customBgColor";
import { useRouter } from "expo-router";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const router = useRouter();

  // 🔹 Format <b> and <br> tags in body text
  const renderRichBody = (body, isUnread) => {
    if (!body) return null;

    const decoded = body
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

    const withLineBreaks = decoded.replace(/<br\s*\/?>/gi, "\n");
    const segments = withLineBreaks.replace(/<\/?b>/gi, "§§").split("§§");

    const result = [];
    segments.forEach((segment, i) => {
      const parts = segment.split("\n");
      parts.forEach((part, j) => {
        const textEl = (
          <Text
            key={`${i}-${j}`}
            style={[
              i % 2 === 1
                ? { fontFamily: "Poppins_700Bold", color: "#000" }
                : { color: "#333" },
            ]}
          >
            {part}
          </Text>
        );
        result.push(textEl);
        if (j < parts.length - 1)
          result.push(<Text key={`br-${i}-${j}`}>{"\n"}</Text>);
      });
    });

    return (
      <Text style={[styles.body, isUnread && styles.bodyUnread]}>{result}</Text>
    );
  };

  // 🔹 Real-time notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notifRef = collection(
      db,
      "notifications",
      user.uid,
      "userNotifications"
    );
    const q = query(notifRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      data.sort((a, b) => {
        const getTime = (d) =>
          d?.createdAt?.toDate
            ? d.createdAt.toDate().getTime()
            : typeof d?.createdAt === "number"
            ? d.createdAt
            : 0;
        return getTime(b) - getTime(a);
      });

      setNotifications(data);
    });

    return unsubscribe;
  }, []);

  // 🔹 Mark all as read
  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const notifRef = collection(
        db,
        "notifications",
        user.uid,
        "userNotifications"
      );
      const snapshot = await getDocs(notifRef);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        if (!docSnap.data().read) batch.update(docSnap.ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // 🔹 Mark one as read
  const markOneAsRead = async (notifId) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const notifRef = doc(
        db,
        "notifications",
        user.uid,
        "userNotifications",
        notifId
      );
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error("Failed to mark single notif as read:", err);
    }
  };

  // 🔹 Handle notification tap (open modal)
  const handleNotificationPress = (item) => {
    if (!item.read) markOneAsRead(item.id);
    setSelectedNotif(item);
    setModalVisible(true);
  };

  // 🔹 Handle modal action (Go / Close)
  // ✅ FINAL LOGIC:
  // - scheduled → /Main/map (center on scheduledCoords)
  // - pending, in progress, not approved, completed, cancelled → /Main/requestPickup
  const handleModalAction = async (confirm) => {
    if (!confirm || !selectedNotif) {
      setModalVisible(false);
      setSelectedNotif(null);
      return;
    }

    const type = selectedNotif.type;

    // 🔵 Collection point
    if (selectedNotif.title?.includes("Collection Point")) {
      router.push("/Main/map");
    }

    // ✅ PICKUP STATUS
    else if (type === "pickupStatus") {
      try {
        const requestId =
          selectedNotif.requestId || selectedNotif.pickupRequestId;

        if (!requestId) {
          router.push("/Main/requestPickup");
          setModalVisible(false);
          setSelectedNotif(null);
          return;
        }

        const reqRef = doc(db, "pickupRequests", requestId);
        const reqSnap = await getDoc(reqRef);

        if (!reqSnap.exists()) {
          router.push("/Main/requestPickup");
          setModalVisible(false);
          setSelectedNotif(null);
          return;
        }

        const reqData = reqSnap.data();
        const status = (reqData.status || "").toLowerCase();

        // ✅ SCHEDULED → MAP TAB, CENTER ON scheduledCoords, NO PURPLE PIN
        if (
          status === "scheduled" &&
          reqData.scheduledCoords?.latitude != null &&
          reqData.scheduledCoords?.longitude != null
        ) {
          const navKey = `${requestId}_${Date.now()}`;

          router.push({
            pathname: "/Main/map",
            params: {
              from: "pickupScheduled",
              pickupRequestId: requestId,
              lat: String(reqData.scheduledCoords.latitude),
              lng: String(reqData.scheduledCoords.longitude),
              address: reqData.scheduledAddress || "",
              date: reqData.scheduledDate || "",
              time: reqData.scheduledTime || "",
              navKey,
            },
          });
        } else {
          // 🟡 ALL OTHER STATUSES (pending, in progress, not approved, completed, cancelled)
          // → REQUEST PICKUP PAGE
          router.push({
            pathname: "/Main/requestPickup",
            params: {
              pickupRequestId: requestId,
              lat:
                reqData.coords?.latitude != null
                  ? String(reqData.coords.latitude)
                  : "",
              lng:
                reqData.coords?.longitude != null
                  ? String(reqData.coords.longitude)
                  : "",
              address: reqData.pickupAddress || "",
              date: reqData.pickupDateTime || "",
            },
          });
        }
      } catch (err) {
        console.error("Error handling pickupStatus:", err);
        router.push("/Main/requestPickup");
      }
    }

    // ✅ OTHER TYPES
    else if (type === "redemptionStatus" || type === "pointsEarned") {
      router.push("/Main/profile");
    } else if (type === "staff_redemption" || type === "staff_contribution") {
      router.push("/pages/Transactions");
    }

    setModalVisible(false);
    setSelectedNotif(null);
  };

  // 🔹 Render each notification card
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.9}
    >
      {!item.read && <View style={styles.unreadBar} />}

      {/* 🔸 Title Row */}
      <View style={styles.titleRow}>
        <Ionicons
          name={item.read ? "notifications-outline" : "notifications"}
          size={22}
          color={item.read ? "gray" : "#F5A25D"}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.title, !item.read && styles.titleUnread]}>
          {item.title}
        </Text>
      </View>

      {/* 🔸 Body and optional thumbnail */}
      {item.photoUrl ? (
        <View style={styles.rowWithImage}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            {renderRichBody(item.body, !item.read)}
          </View>
          <Image
            source={{ uri: item.photoUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View>{renderRichBody(item.body, !item.read)}</View>
      )}

      {/* 🔸 Date */}
      <Text style={styles.date}>
        {(() => {
          const c = item.createdAt;
          if (!c) return "";
          if (c.toDate) return c.toDate().toLocaleString();
          if (typeof c === "number") return new Date(c).toLocaleString();
          return "";
        })()}
      </Text>
    </TouchableOpacity>
  );

  // 🔹 UI Render
  return (
    <CustomBgColor>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>

          <Text style={styles.topHeaderText}>Notifications</Text>

          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.clearBtn}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}

        {/* 🧩 Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Ionicons name="notifications" size={36} color="#008243" />
              <Text style={styles.modalTitle}>{selectedNotif?.title}</Text>

              {/* Rich Text Body */}
              <View style={{ marginVertical: 10 }}>
                {renderRichBody(
                  selectedNotif?.body || "",
                  !selectedNotif?.read
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#ccc" }]}
                  onPress={() => handleModalAction(false)}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>

                {(selectedNotif?.title?.includes("Collection Point") ||
                  selectedNotif?.type === "pickupStatus" ||
                  selectedNotif?.type === "redemptionStatus" ||
                  selectedNotif?.type === "pointsEarned" ||
                  selectedNotif?.type === "staff_redemption" ||
                  selectedNotif?.type === "staff_contribution") && (
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#008243" }]}
                    onPress={() => handleModalAction(true)}
                  >
                    <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                      Go
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </CustomBgColor>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4, marginRight: 8 },
  topHeaderText: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "black",
  },
  clearBtn: {
    color: "#008243",
    fontFamily: "Poppins_400Regular",
  },

  card: {
    flexDirection: "column",
    alignItems: "flex-start",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#E3F6E3",
    width: "100%",
  },
  cardUnread: { backgroundColor: "#F4FBF4" },
  unreadBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#008243",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  rowWithImage: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: { fontSize: 14, fontFamily: "Poppins_700Bold", color: "#2E7D32" },
  titleUnread: { fontFamily: "Poppins_800ExtraBold", color: "#008243" },
  body: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginTop: 4,
    textAlign: "justify",
  },
  bodyUnread: { color: "#004d26" },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  date: {
    fontSize: 11,
    color: "#666",
    fontFamily: "Poppins_400Regular",
    marginTop: 6,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, color: "#888" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#008243",
    marginTop: 10,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  modalBtnText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#000",
  },
});