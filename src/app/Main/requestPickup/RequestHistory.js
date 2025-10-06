import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ToastAndroid,
  Platform,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";

// 🔥 Firebase
import { db } from "../../../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const ArchivedRequests = () => {
  const router = useRouter();
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "pickupRequests"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const archivedReqs = data.filter((d) => d.archived);
      setArchived(archivedReqs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const showToast = (msg) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

  const handleUnarchive = async (id) => {
    try {
      await updateDoc(doc(db, "pickupRequests", id), { archived: false });
      showToast("Request moved back to active.");
    } catch (err) {
      console.error("Error unarchiving request:", err);
      showToast("Failed to unarchive request.");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#f4c430";
      case "in progress":
        return "#2da9ef";
      case "scheduled":
        return "#9370db";
      case "not approved":
        return "#ff8c00";
      case "completed":
        return "#2fa64f";
      case "cancelled":
        return "#d9534f";
      default:
        return "#999";
    }
  };

  const renderCard = (item) => {
    return (
      <Animatable.View animation="fadeInUp" duration={600} style={styles.card}>
        {/* Status Badge */}
        <View
          style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}
        >
          <Text style={styles.statusLabel}>
            {item.status
              ? item.status.charAt(0).toUpperCase() +
                item.status.slice(1).toLowerCase()
              : "N/A"}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardContent}>
          <Text style={styles.cardText}>
            <Text style={styles.bold}>Recyclables:</Text>{" "}
            {item.types?.join(", ") || "N/A"}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.bold}>Datetime:</Text>{" "}
            {item.pickupDateTime || "N/A"}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.bold}>Address:</Text>{" "}
            {item.pickupAddress || "N/A"}
          </Text>
          {/* ✅ Reason Display */}
          <Text style={styles.cardText}>
            <Text style={styles.bold}>Reason:</Text>{" "}
            {item.reason || item.cancelReason
              ? `${item.reason || item.cancelReason} (${
                  item.reasonBy === "admin" ? "by Admin" : "by You"
                })`
              : "No reason provided"}
          </Text>
        </View>

        {/* ✅ Always show Unarchive button */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.unarchiveBtn}
            onPress={() => handleUnarchive(item.id)}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.unarchiveText}>Unarchive</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={archived}
            renderItem={({ item }) => renderCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 40,
                  color: "#333",
                  fontSize: 15,
                  fontFamily: "Poppins_400Regular",
                }}
              >
                No archived requests
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default ArchivedRequests;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  statusTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  statusLabel: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
  cardContent: { marginBottom: 12 },
  cardText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 4,
  },
  bold: { fontFamily: "Poppins_700Bold", color: "#333" },
  buttonRow: { flexDirection: "row", justifyContent: "flex-end" },
  unarchiveBtn: {
    flexDirection: "row",
    backgroundColor: "#2fa64f",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  unarchiveText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    marginLeft: 6,
  },
});
