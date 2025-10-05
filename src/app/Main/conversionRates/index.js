
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { db } from "../../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function ConversionRatesPreview() {
  const [rates, setRates] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const router = useRouter();

  // 📡 Fetch realtime data
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "wasteConversionRates"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRates(data);
      }
    );
    return () => unsub();
  }, []);

  // group by category
  const groupedRates = rates.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const toggleCategory = (category) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversion Rates</Text>

      {Object.keys(groupedRates).length === 0 ? (
        <Text style={styles.noData}>No conversion rates yet.</Text>
      ) : (
        <View>
          {Object.keys(groupedRates).map((category) => {
            const items = groupedRates[category].slice(0, 5); // first 5 only
            return (
              <View key={category}>
                {/* Category Row */}
                <TouchableOpacity
                  style={styles.categoryRow}
                  onPress={() => toggleCategory(category)}
                >
                  <Text style={styles.categoryText}>
                    {category} {collapsedCategories[category] ? "▼" : "▲"}
                  </Text>
                </TouchableOpacity>

                {/* Rows */}
                {!collapsedCategories[category] &&
                  items.map((c, idx) => (
                    <View
                      key={c.id}
                      style={[
                        styles.row,
                        { backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#E3F6E3" },
                      ]}
                    >
                      <Text style={styles.cell}>{c.type}</Text>
                      <Text style={styles.cell}>{c.points} pts/kg</Text>
                    </View>
                  ))}
              </View>
            );
          })}
        </View>
      )}

      {/* Button to navigate to full list */}
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => router.push("/Main/conversionRates")}
      >
        <Text style={styles.viewAllText}>View All Conversion Rates →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    marginBottom: 12,
    color: "#117D2E",
  },
  noData: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
  },
  categoryRow: {
    paddingVertical: 8,
    backgroundColor: "#B6D799",
    borderRadius: 6,
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  cell: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  viewAllBtn: {
    marginTop: 12,
    alignSelf: "flex-end",
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#008243",
  },
});
