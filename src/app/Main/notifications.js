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

const PICKUP_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "in progress", label: "In Progress" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
];

const TERMINAL_STATUSES = ["cancelled", "not approved"];

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

  const PickupProgress = ({ status }) => {
    const currentIndex = PICKUP_STEPS.findIndex((s) => s.key === status);

    return (
      <View style={styles.progressContainer}>
        {PICKUP_STEPS.map((step, index) => {
          const isDone = index <= currentIndex;
          const isLast = index === PICKUP_STEPS.length - 1;

          return (
            <View key={step.key} style={styles.progressItem}>
              {/* Circle */}
              <View
                style={[
                  styles.progressCircle,
                  isDone && styles.progressCircleActive,
                ]}
              >
                <Text style={styles.progressNumber}>{index + 1}</Text>
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.progressLabel,
                  isDone && styles.progressLabelActive,
                ]}
              >
                {step.label}
              </Text>

              {/* Line */}
              {!isLast && (
                <View
                  style={[
                    styles.progressLine,
                    isDone && styles.progressLineActive,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
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
  // - collectionPoint → /Main/map with pointId (center on that point using Firestore lat/lng)
  // - scheduled pickup → /Main/map (center on scheduledCoords, no purple pin)
  // - other pickup statuses → /Main/requestPickup
  const handleModalAction = async (confirm) => {
    if (!confirm || !selectedNotif) {
      setModalVisible(false);
      setSelectedNotif(null);
      return;
    }

    const type = selectedNotif.type;

    // 🔵 COLLECTION POINT → deep-link to map with pointId
    if (
      type === "collectionPoint" ||
      selectedNotif.title?.includes("Collection Point")
    ) {
      try {
        const pointId = selectedNotif.pointId;

        if (pointId) {
          const navKey = `${pointId}_${Date.now()}`;

          router.push({
            pathname: "/Main/map",
            params: {
              from: "collectionPoint",
              pointId,
              navKey,
            },
          });
        } else {
          // Fallback (no pointId stored)
          router.push("/Main/map");
        }
      } catch (err) {
        console.error("Error handling collectionPoint notification:", err);
        router.push("/Main/map");
      }
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

    // ✅ CONTRIBUTION → scroll to points log
    else if (type === "contributionEarned") {
      const logId = selectedNotif.relatedId || null;

      router.push({
        pathname: "/Main/profile",
        params: {
          tab: "points",
          scrollTo: logId, // 👈 scroll only, no open
        },
      });
    }

    // ✅ REDEMPTION → scroll to rewards log
    else if (type === "redemptionStatus") {
      const logId = selectedNotif.relatedId || null;

      router.push({
        pathname: "/Main/profile",
        params: {
          tab: "rewards",
          scrollTo: logId,
        },
      });
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
      {item.type === "pickupStatus" &&
        !TERMINAL_STATUSES.includes(item.status) && (
          <PickupProgress status={item.status} />
        )}
      {item.type === "pickupStatus" &&
        TERMINAL_STATUSES.includes(item.status) && (
          <Text style={styles.cancelledText}>
            {item.status === "cancelled"
              ? "Pickup request was cancelled"
              : "Pickup request was not approved"}
          </Text>
        )}

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

        {/* 🧩 Notification Action Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setModalVisible(false);
            setSelectedNotif(null);
          }}
        >
          <View style={styles.modalOverlayCenter}>
            <View style={styles.confirmModal}>
              {/* Icon */}
              <Ionicons
                name="notifications"
                size={36}
                color="#008243"
                style={{ marginBottom: 8 }}
              />

              {/* Title */}
              <Text style={styles.confirmTitle}>{selectedNotif?.title}</Text>

              {/* Body */}
              <View style={{ marginBottom: 20 }}>
                {renderRichBody(
                  selectedNotif?.body || "",
                  !selectedNotif?.read
                )}
              </View>

              {/* Buttons */}
              <View style={styles.confirmButtons}>
                {/* Close */}
                <TouchableOpacity
                  style={[styles.cancelButton, { flex: 0.45 }]}
                  onPress={() => handleModalAction(false)}
                >
                  <Text style={styles.cancelText}>Close</Text>
                </TouchableOpacity>

                {/* Go */}
                {(selectedNotif?.type === "collectionPoint" ||
                  selectedNotif?.title?.includes("Collection Point") ||
                  selectedNotif?.type === "pickupStatus" ||
                  selectedNotif?.type === "redemptionStatus" ||
                  selectedNotif?.type === "pointsEarned" ||
                  selectedNotif?.type === "contributionEarned" ||
                  selectedNotif?.type === "redemptionStatus") && (
                  <TouchableOpacity
                    style={[styles.saveButton, { flex: 0.45 }]}
                    onPress={() => handleModalAction(true)}
                  >
                    <Text style={styles.saveText}>Go</Text>
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
  title: { fontSize: 17, fontFamily: "Poppins_700Bold", color: "#2E7D32" },
  titleUnread: { fontFamily: "Poppins_800ExtraBold", color: "#008243" },
  body: {
    fontSize: 15,
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
    fontSize: 12,
    color: "#666",
    fontFamily: "Poppins_400Regular",
    marginTop: 6,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, color: "#888" },

  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  confirmModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 24,
    width: "90%",
    alignItems: "center",

    // Shadow (Android + iOS)
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  confirmTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 10,
    textAlign: "center",
  },

  confirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  saveButton: {
    backgroundColor: "#008243",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },

  cancelButton: {
    backgroundColor: "#888",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },

  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  progressItem: {
    alignItems: "center",
    flex: 1,
  },

  progressCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  progressCircleActive: {
    backgroundColor: "#008243",
  },

  progressNumber: {
    fontSize: 12,
    color: "#fff",
    fontFamily: "Poppins_700Bold",
  },

  progressLabel: {
    fontSize: 11,
    marginTop: 4,
    color: "#999",
    textAlign: "center",
  },

  progressLabelActive: {
    color: "#008243",
    fontFamily: "Poppins_600SemiBold",
  },

  progressLine: {
    position: "absolute",
    top: 12,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: "#E0E0E0",
    zIndex: 1,
  },

  progressLineActive: {
    backgroundColor: "#008243",
  },
  cancelledText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#D22B2B",
    marginBottom: 6,
  },
});