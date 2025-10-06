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
  TextInput,
  Modal,
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

const RequestPickup = () => {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);

  // cancel modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelTargetId, setCancelTargetId] = useState(null);

  // Load current user's pickup requests
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "pickupRequests"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // ✅ keep ALL requests (only filter archived)
      const active = data
        .filter((d) => !d.archived)
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        );

      setRequests(active);
      setLoading(false);
    });

    return () => unsub();
  }, []);

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

  const showToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert(msg);
    }
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert(
        "Reason Required",
        "Please provide a reason for cancellation."
      );
      return;
    }

    try {
      await updateDoc(doc(db, "pickupRequests", cancelTargetId), {
        status: "cancelled",
        cancelReason,
        reasonBy: "user",
      });
      showToast("Pickup request cancelled.");
      setCancelReason("");
      setCancelTargetId(null);
      setCancelModalVisible(false);
    } catch (err) {
      console.error("Error cancelling request:", err);
      showToast("Failed to cancel request.");
    }
  };

  const handleCancel = (id) => {
    setCancelTargetId(id);
    setCancelModalVisible(true);
  };

  const handleEdit = (item) => {
    Alert.alert("Edit Pickup", "Do you want to edit this pickup request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: () => {
          router.push({
            pathname: "Main/requestPickup/PickupRequestForm",
            params: { requestId: item.id },
          });
        },
      },
    ]);
  };

  const handleArchive = (id) => {
    Alert.alert("Archive Pickup", "Move this request to archive?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "pickupRequests", id), { archived: true });
            showToast("Pickup request archived.");
          } catch (err) {
            console.error("Error archiving request:", err);
            showToast("Failed to archive request.");
          }
        },
      },
    ]);
  };

  const toggleCollapse = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderCard = (item) => {
    const imageUrl = item.photoUrl || null;
    const isCollapsed = collapsed[item.id];
    const isMenuOpen = menuOpen === item.id;

    // ✅ disable buttons for completed/cancelled/not approved
    const disableActions = ["completed", "cancelled", "not approved"].includes(
      item.status?.toLowerCase()
    );

    return (
      <Animatable.View animation="fadeInUp" duration={600} style={styles.card}>
        <View>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ color: "#999", marginBottom: 10 }}>
              No image available
            </Text>
          )}

          {/* Three dots menu */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuOpen(isMenuOpen ? null : item.id)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>

          {isMenuOpen && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity onPress={() => handleArchive(item.id)}>
                <Text style={styles.menuItem}>Archive</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Status + Toggle Row */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusTag,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusLabel}>
              {item.status
                ? item.status.charAt(0).toUpperCase() +
                  item.status.slice(1).toLowerCase()
                : "Pending"}
            </Text>
          </View>

          {/* Show/Hide Button */}
          <TouchableOpacity
            onPress={() => toggleCollapse(item.id)}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleText}>
              {isCollapsed ? "Show Details" : "Hide Details"}
            </Text>
            <Ionicons
              name={isCollapsed ? "chevron-down" : "chevron-up"}
              size={18}
              color="#ADADAD"
            />
          </TouchableOpacity>
        </View>

        {/* Details */}
        {!isCollapsed && (
          <>
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
              {/* ✅ Show reason only if provided */}
              {(item.reason || item.cancelReason) && (
                <Text style={styles.cardText}>
                  <Text style={styles.bold}>Reason:</Text>{" "}
                  {item.reason || item.cancelReason}{" "}
                  {item.reasonBy &&
                    `(${item.reasonBy === "admin" ? "by Admin" : "by You"})`}
                </Text>
              )}
            </View>

            {/* ✅ Hide cancel/edit buttons if final status */}
            {!disableActions && (
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
            )}
          </>
        )}
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
                No pickup requests yet.
              </Text>
            }
          />
        )}

        {/* Cancel Modal */}
        <Modal visible={cancelModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cancel Pickup</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter reason for cancellation"
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalBtnCancel}
                  onPress={() => {
                    setCancelModalVisible(false);
                    setCancelReason("");
                  }}
                >
                  <Text style={styles.modalBtnTextCancel}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBtnConfirm}
                  onPress={confirmCancel}
                >
                  <Text style={styles.modalBtnTextConfirm}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  safeArea: { flex: 1 },
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
  photo: { width: "100%", height: 180, borderRadius: 10, marginBottom: 10 },
  menuBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
  },
  menuDropdown: {
    position: "absolute",
    top: 32,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  menuItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    color: "#333",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusLabel: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },
  toggleBtn: { flexDirection: "row", alignItems: "center" },
  toggleText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#ADADAD",
    marginRight: 4,
  },
  cardContent: { marginBottom: 10, marginTop: 10 },
  cardText: { fontSize: 15, fontFamily: "Poppins_400Regular", color: "#333" },
  bold: { flex: 1, fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  cancelBtn: {
    backgroundColor: "#888",
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 2,
  },
  cancelText: { color: "#fff", fontSize: 15, fontFamily: "Poppins_700Bold" },
  editBtn: {
    backgroundColor: "#7ac47f",
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 2,
  },
  editText: { color: "#fff", fontSize: 15, fontFamily: "Poppins_700Bold" },
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginBottom: 12,
    color: "#333",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end" },
  modalBtnCancel: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  modalBtnTextCancel: {
    color: "#333",
    fontFamily: "Poppins_700Bold",
  },
  modalBtnConfirm: {
    backgroundColor: "#d9534f",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnTextConfirm: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
  },
});
