import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";

const initialData = [
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
  const [dataList, setDataList] = useState(initialData);
  const [editingItem, setEditingItem] = useState(null);
  const [showStatus, setShowStatus] = useState(true);

  const handleCancel = (id) => {
    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this pickup request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            const updatedList = dataList.filter((entry) => entry.id !== id);
            setDataList(updatedList);
          },
        },
      ]
    );
  };

  const EditForm = ({ item }) => {
    const [selectedTypes, setSelectedTypes] = useState(item.recyclables.split(", "));
    const [weight, setWeight] = useState(item.weight.replace(" kg", ""));
    const [datetime, setDatetime] = useState(item.datetime);
    const [address, setAddress] = useState(item.address);

    const toggleType = (type) => {
      setSelectedTypes((prev) =>
        prev.includes(type)
          ? prev.filter((t) => t !== type)
          : [...prev, type]
      );
    };

    const handleSave = () => {
      const updatedItem = {
        ...item,
        recyclables: selectedTypes.join(", "),
        weight: `${weight} kg`,
        datetime,
        address,
      };

      const updatedList = dataList.map((entry) =>
        entry.id === updatedItem.id ? updatedItem : entry
      );

      setDataList(updatedList);
      setEditingItem(null);
    };

    return (
      <View style={styles.editContainer}>
        <Text style={styles.sectionTitle}>Select all that applies</Text>
        {["Plastic", "Paper", "Metal", "Glass"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.selectable,
              selectedTypes.includes(type) && styles.selected,
            ]}
            onPress={() => toggleType(type)}
          >
            <Text style={{ color: selectedTypes.includes(type) ? "#fff" : "#000" }}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Estimated weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <Text style={styles.sectionTitle}>Pickup Date & Time</Text>
        <TextInput
          style={styles.input}
          value={datetime}
          onChangeText={setDatetime}
        />

        <Text style={styles.sectionTitle}>Pickup Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
        />

        <View style={{ flexDirection: "row", marginTop: 20 }}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: "#ccc", flex: 1, marginRight: 5 }]}
            onPress={() => setEditingItem(null)}
          >
            <Text style={{ color: "#000", fontWeight: "bold" }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { flex: 1, marginLeft: 5 }]}
            onPress={handleSave}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => handleCancel(item.id)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setEditingItem(item)}
        >
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

      {editingItem ? (
        <EditForm item={editingItem} />
      ) : (
        showStatus && (
          <FlatList
            data={dataList}
            renderItem={({ item }) => renderCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 150 }}
          />
        )
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
  editContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    color: "#333",
  },
  selectable: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginVertical: 4,
  },
  selected: {
    backgroundColor: "#7ac47f",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    backgroundColor: "#fff",
  },
  saveBtn: {
    backgroundColor: "#2fa64f",
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
  },
});
