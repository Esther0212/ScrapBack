// src/app/Main/notifications/index.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
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
} from "firebase/firestore";
import CustomBgColor from "../../components/customBgColor";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 🔔 Realtime listener for notifications for this user
    const q = query(
      collection(db, "userNotifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort newest first
      setNotifications(data.sort((a, b) => b.createdAt - a.createdAt));
    });

    return unsubscribe;
  }, []);

  // ✅ Mark all as read
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
      console.log("✅ All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // ✅ Mark one notification as read
  const markOneAsRead = async (notifId) => {
    try {
      const notifRef = doc(db, "userNotifications", notifId);
      await updateDoc(notifRef, { read: true });
      console.log(`✅ Notification ${notifId} marked as read`);
    } catch (err) {
      console.error("Failed to mark single notif as read:", err);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => !item.read && markOneAsRead(item.id)}
    >
      {/* Accent bar for unread */}
      {!item.read && <View style={styles.unreadBar} />}

      <Ionicons
        name={item.read ? "notifications-outline" : "notifications"}
        size={24}
        color={item.read ? "gray" : "#0047AB"}
        style={{ marginRight: 10 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, !item.read && styles.titleUnread]}>
          {item.title}
        </Text>
        <Text style={[styles.body, !item.read && styles.bodyUnread]}>
          {item.body}
        </Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Notifications</Text>
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
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: { fontSize: 20, fontFamily: "Poppins_700Bold" },
  clearBtn: { color: "#0047AB", fontFamily: "Poppins_400Regular" },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    overflow: "hidden",
  },
  cardUnread: {
    backgroundColor: "#F0F6FF", // light blue for unread
  },
  unreadBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#1E66F5",
  },
  title: { fontSize: 16, fontFamily: "Poppins_700Bold" },
  titleUnread: {
    fontFamily: "Poppins_800ExtraBold",
  },
  body: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "#333" },
  bodyUnread: {
    color: "#1b3a57",
  },
  date: {
    fontSize: 12,
    color: "gray",
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: "gray" },
});
