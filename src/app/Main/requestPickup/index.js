import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const dummyData = [
  {
    id: "1",
    status: "Requested",
    statusColor: "#2da9ef",
    recyclables: "Plastic, Metal, Glass",
    weight: "2.5 kg",
    datetime: "7 Sept, 13:00",
    address: "123 Green Street, Brooklyn",
  },
  {
    id: "2",
    status: "Requested",
    statusColor: "#2da9ef",
    recyclables: "Paper, Glass",
    weight: "1.2 kg",
    datetime: "9 Sept, 10:30",
    address: "456 Eco Avenue, Queens",
  },
  {
    id: "3",
    status: "Pending",
    statusColor: "#f4c430",
    recyclables: "Plastic, Metal",
    weight: "3.0 kg",
    datetime: "10 Sept, 09:15",
    address: "789 Reuse Blvd, Manhattan",
  },
  {
    id: "4",
    status: "Completed",
    statusColor: "#2fa64f",
    recyclables: "Glass, Paper",
    weight: "4.5 kg",
    datetime: "5 Sept, 14:00",
    address: "321 Green Lane, Bronx",
  },
];

const RequestPickup = () => {
  const router = useRouter();
  const [showStatus, setShowStatus] = useState(true);

  const renderCard = (item) => (
    <Animatable.View animation="fadeInUp" duration={600} style={styles.card}>
      <View style={[styles.statusTag, { backgroundColor: item.statusColor }]}>
        <Text style={styles.statusLabel}>{item.status}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Recyclables:</Text> {item.recyclables}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Weight:</Text> {item.weight}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Datetime:</Text> {item.datetime}
        </Text>
        <Text style={styles.cardText}>
          <Text style={styles.bold}>Address:</Text> {item.address}
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Request for Pickup</Text>

      <TouchableOpacity
        style={styles.statusToggle}
        onPress={() => setShowStatus(!showStatus)}
      >
        <Text style={styles.statusToggleText}>Status</Text>
        <Ionicons
          name={showStatus ? "chevron-up" : "chevron-down"}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>

      {showStatus ? (
        <FlatList
          data={dummyData}
          renderItem={({ item }) => renderCard(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 150 }}
        />
      ) : (
        <Animatable.View
          animation="fadeIn"
          duration={500}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryHint}>
            Tap "Status" above to expand and view details
          </Text>
        </Animatable.View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("Main/requestPickup/PickupRequestForm")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default RequestPickup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F6C8",
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  statusToggle: {
    backgroundColor: "#7ac47f",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusToggleText: {
    fontWeight: "700",
    fontSize: 18, // bigger text
    color: "#fff",
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
  summaryCard: {
    flex: 1,
    backgroundColor: "#F8F6C8",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryHint: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
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
