// src/app/Main/notifications/index.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  writeBatch,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import CustomBgColor from "../../components/customBgColor";
import { useRouter } from "expo-router";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "userNotifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const toMillis = (c) => {
        if (!c) return 0;
        if (typeof c === "number") return c; // epoch millis
        if (c.toDate) return c.toDate().getTime(); // Firestore Timestamp
        if (c.seconds != null)
          return c.seconds * 1000 + Math.floor((c.nanoseconds || 0) / 1e6);
        return 0;
      };

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Safe sort
      data.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

      setNotifications(data);
    });

    return unsubscribe;
  }, []);

  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "userNotifications"),
        where("userId", "==", user.uid),
        where("read", "==", false)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markOneAsRead = async (notifId) => {
    try {
      const notifRef = doc(db, "userNotifications", notifId);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error("Failed to mark single notif as read:", err);
    }
  };

  const handleNotificationPress = (item) => {
    if (!item.read) {
      markOneAsRead(item.id);
    }

    if (item.title?.includes("Collection Point")) {
      Alert.alert(
        "Go to Collection Point?",
        "Do you want to view the collection points page?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: () => router.push("/Main/map"),
          },
        ]
      );
    } else if (
      item.title?.includes("Pickup Request Created") ||
      item.title?.includes("Pickup Request Updated")
    ) {
      Alert.alert(
        "Go to Pickup Requests?",
        "Do you want to view your pickup requests?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: () => router.push("/Main/requestPickup"),
          },
        ]
      );
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => handleNotificationPress(item)}
    >
      {!item.read && <View style={styles.unreadBar} />}

      <Ionicons
        name={item.read ? "notifications-outline" : "notifications"}
        size={20}
        color={item.read ? "gray" : "#F5A25D"}
        style={{ marginRight: 8 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, !item.read && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text
          style={[styles.body, !item.read && styles.bodyUnread]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text style={styles.date}>
          {(() => {
            const c = item.createdAt;
            if (!c) return "";
            if (c.toDate) return c.toDate().toLocaleString();
            if (typeof c === "number") return new Date(c).toLocaleString();
            return "";
          })()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>

          <Text style={styles.topHeaderText}>Notifications</Text>

          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.clearBtn}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

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
    flexDirection: "row",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    minHeight: 65,
    borderWidth: 1,
    borderColor: "#E3F6E3",
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
  title: { fontSize: 14, fontFamily: "Poppins_700Bold", color: "#2E7D32" },
  titleUnread: { fontFamily: "Poppins_800ExtraBold", color: "#008243" },
  body: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginTop: 2,
  },
  bodyUnread: { color: "#004d26" },
  date: {
    fontSize: 11,
    color: "#666",
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 14, color: "#888" },
});
