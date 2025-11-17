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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cancelItemId, setCancelItemId] = useState(null);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [archiveItemId, setArchiveItemId] = useState(null);
  const [confirmCancelModalVisible, setConfirmCancelModalVisible] =
    useState(false);

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
    setConfirmCancelModalVisible(true); // 👈 open the first "Are you sure?" modal
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditModalVisible(true);
  };

  const handleArchive = (id) => {
    setArchiveItemId(id);
    setArchiveModalVisible(true);
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
                <Text style={styles.bold}>Estimated Weight:</Text>{" "}
                {item.estimatedWeight ? `${item.estimatedWeight} kg` : "N/A"}
              </Text>
              <Text style={styles.cardText}>
                <Text style={styles.bold}>Estimated Points:</Text>{" "}
                {item.estimatedPoints ? `${item.estimatedPoints} pts` : "N/A"}
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
                  <Text style={{ color: "#d9534f" }}>
                    {item.reason || item.cancelReason}{" "}
                    {item.reasonBy &&
                      `(${item.reasonBy === "admin" ? "by Admin" : "by You"})`}
                  </Text>
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
        
        {/* ✅ Edit Confirmation Modal */}
        {editModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Ionicons name="create-outline" size={40} color="#0E9247" />
              <Text style={styles.modalTitle}>Edit Pickup</Text>
              <Text style={styles.modalText}>
                Do you want to edit this pickup request?
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalConfirmBtn]}
                  onPress={() => {
                    setEditModalVisible(false);
                    router.push({
                      pathname: "Main/requestPickup/PickupRequestForm",
                      params: { requestId: selectedItem?.id },
                    });
                  }}
                >
                  <Text style={styles.modalConfirmText}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
      {/* STEP 1: Confirm Cancel Modal */}
      {confirmCancelModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="alert-circle-outline" size={40} color="#d9534f" />
            <Text style={styles.modalTitle}>Cancel Pickup</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel this request?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setConfirmCancelModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={() => {
                  setConfirmCancelModalVisible(false);
                  setCancelModalVisible(true); // 👈 open the reason modal next
                }}
              >
                <Text style={styles.modalConfirmText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {archiveModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="archive-outline" size={40} color="#9370db" />
            <Text style={styles.modalTitle}>Archive Pickup</Text>
            <Text style={styles.modalText}>
              Do you want to move this request to archive?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setArchiveModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={async () => {
                  try {
                    await updateDoc(doc(db, "pickupRequests", archiveItemId), {
                      archived: true,
                    });
                    showToast("Pickup request archived.");
                  } catch (err) {
                    console.error("Error archiving request:", err);
                    showToast("Failed to archive request.");
                  } finally {
                    setArchiveModalVisible(false);
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
  toggleBtn: { flexDirection: "row", alignItems: "center" },
  toggleText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#ADADAD",
    marginRight: 4,
  },
  cardContent: { marginBottom: 10, marginTop: 10 },
  cardText: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "#333" },
  bold: { flex: 1, fontSize: 13, fontFamily: "Poppins_700Bold", color: "#333" },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 10, // perfect spacing between buttons
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#888",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelText: { color: "#fff", fontSize: 12, fontFamily: "Poppins_700Bold" },
  editBtn: {
    flex: 1,
    backgroundColor: "#7ac47f",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  editText: { color: "#fff", fontSize: 12, fontFamily: "Poppins_700Bold" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#008243",
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
  // 🧭 Modal Styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "85%",
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#222",
    marginTop: 10,
  },
  modalText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    textAlign: "center",
    marginVertical: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalCancelBtn: {
    backgroundColor: "#888",
  },
  modalConfirmBtn: {
    backgroundColor: "#0E9247",
  },
  modalCancelText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  modalConfirmText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
});
