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

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={archived}
            renderItem={({ item }) => (
              <Animatable.View
                animation="fadeInUp"
                duration={600}
                style={styles.card}
              >
                <Text style={styles.cardText}>
                  <Text style={styles.bold}>Recyclables:</Text>{" "}
                  {item.types?.join(", ") || "N/A"}
                </Text>
                <Text style={styles.cardText}>
                  <Text style={styles.bold}>Datetime:</Text>{" "}
                  {item.pickupDateTime || "N/A"}
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.unarchiveBtn}
                    onPress={() => handleUnarchive(item.id)}
                  >
                    <Text style={styles.unarchiveText}>Unarchive</Text>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListHeaderComponent={
              <View style={styles.statusBar}>
                <Text style={styles.statusBarText}>Archived Requests</Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            }
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
  statusBar: {
    backgroundColor: "#666",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusBarText: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardText: { fontSize: 15, fontFamily: "Poppins_400Regular", color: "#333" },
  bold: { flex: 1, fontSize: 15, fontFamily: "Poppins_700Bold", color: "#333" },
  buttonRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "flex-end",
  },
  unarchiveBtn: { backgroundColor: "#2fa64f", padding: 10, borderRadius: 8 },
  unarchiveText: { color: "#fff", fontSize: 15, fontFamily: "Poppins_700Bold" },
});
