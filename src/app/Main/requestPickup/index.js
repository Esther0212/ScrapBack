import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Image,
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
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const RequestPickup = () => {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load current user's pickup requests
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "pickupRequests"), where("userId", "==", user.uid));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "requested":
        return "#2da9ef"; // blue
      case "pending":
        return "#f4c430"; // yellow
      case "completed":
        return "#2fa64f"; // green
      case "cancelled":
        return "#d9534f"; // red
      default:
        return "#999"; // gray
    }
  };

  const showToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert(msg);
    }
  };

  const handleCancel = (id) => {
    Alert.alert(
      "Cancel Pickup",
      "Are you sure you want to cancel this request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "pickupRequests", id), { status: "cancelled" });
              showToast("Pickup request cancelled.");
            } catch (err) {
              console.error("Error cancelling request:", err);
              showToast("Failed to cancel request.");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item) => {
    Alert.alert(
      "Edit Pickup",
      "Do you want to edit this pickup request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            // Navigate to form with request data
            router.push({
              pathname: "Main/requestPickup/PickupRequestForm",
              params: { requestId: item.id }, // pass id, you can fetch inside form
            });
          },
        },
      ]
    );
  };

  const renderCard = (item) => {
    // decode URL in case of %2F issues
    const imageUrl = item.photoUrl || null;
    console.log("Rendering photo URL:", imageUrl);

    return (
      <Animatable.View animation="fadeInUp" duration={600} style={styles.card}>
        {/* Waste photo */}
       {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.photo}
          resizeMode="cover"
          onError={(e) =>
            console.error("Image failed to load:", e.nativeEvent.error)
          }
        />
      ) : (
        <Text style={{ color: "#999", marginBottom: 10 }}>
          No image available
        </Text>
      )}

        {/* Status tag */}
        <View
          style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) }]}
        >
          <Text style={styles.statusLabel}>
            {item.status
              ? item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase()
              : "Pending"}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.cardContent}>
          <Text style={styles.cardText}>
            <Text style={styles.bold}>Recyclables:</Text>{" "}
            {item.types?.join(", ") || "N/A"}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.bold}>Weight:</Text>{" "}
            {item.estimatedWeight ? `${item.estimatedWeight} kg` : "N/A"}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.bold}>Datetime:</Text>{" "}
            {item.pickupDateTime || "N/A"}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.bold}>Address:</Text>{" "}
            {item.pickupAddress || "N/A"}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.editText}>Edit</Text>
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
            data={requests}
            renderItem={({ item }) => renderCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListHeaderComponent={
              <View style={styles.statusBar}>
                <Text style={styles.statusBarText}>Status</Text>
              </View>
            }
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 40, color: "#555" }}>
                No pickup requests yet.
              </Text>
            }
          />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("Main/requestPickup/PickupRequestForm")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </CustomBgColor>
  );
};

export default RequestPickup;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  statusBar: {
    backgroundColor: "#7ac47f",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusBarText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#fff",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  statusTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  statusLabel: {
    color: "#fff",
    fontWeight: "bold",
  },
  cardContent: {
    marginBottom: 10,
  },
  cardText: {
    marginBottom: 4,
    color: "#555",
  },
  bold: {
    fontWeight: "bold",
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  cancelBtn: {
    backgroundColor: "#e0e0e0",
    flex: 1,
    padding: 10,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#000",
    fontWeight: "bold",
  },
  editBtn: {
    backgroundColor: "#7ac47f",
    flex: 1,
    padding: 10,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: "center",
  },
  editText: {
    color: "#fff",
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#2fa64f",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
