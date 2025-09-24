import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";

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
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={dummyData}
          renderItem={({ item }) => renderCard(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16,}}
          ListHeaderComponent={
            <View style={styles.statusBar}>
              <Text style={styles.statusBarText}>Status</Text>
            </View>
          }
        />

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
    padding: 20,
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
