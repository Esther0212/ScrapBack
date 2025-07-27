import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";

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
    recyclables: "Plastic, Metal, Glass",
    weight: "2.5 kg",
    datetime: "7 Sept, 13:00",
    address: "123 Green Street, Brooklyn",
  },
  {
    id: "3",
    status: "Pending",
    statusColor: "#f4c430",
    recyclables: "Plastic, Metal, Glass",
    weight: "2.5 kg",
    datetime: "7 Sept, 13:00",
    address: "123 Green Street, Brooklyn",
  },
];

const RequestPickup = () => {
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
          size={20}
          color="#fff"
        />
      </TouchableOpacity>

      {showStatus && (
        <FlatList
          data={dummyData}
          renderItem={({ item }) => renderCard(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 150 }}
        />
      )}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RequestPickup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f6c8",
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
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusToggleText: {
    fontWeight: "600",
    fontSize: 16,
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
  
  fab: {
    backgroundColor: "#2fa64f",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
  },
});
