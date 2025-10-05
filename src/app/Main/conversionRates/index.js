import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { db } from "../../../../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import CustomBgColor from "../../../components/customBgColor";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConversionRates() {
  const [rates, setRates] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // 📡 Fetch realtime data
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "wasteConversionRates"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {Object.keys(groupedRates).length === 0 ? (
              <Text style={styles.noData}>No conversion rates yet.</Text>
            ) : (
              <View>
                {/* 🔹 Explanation */}
                <Text style={styles.explanation}>
                  These are PACAFACO’s conversion rates. Each kilo of recyclable
                  waste is given a specific number of points based on its type.
                </Text>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.headerText}>Waste Type</Text>
                  <Text style={styles.headerText}>Points/kg</Text>
                </View>

                {Object.keys(groupedRates).map((category) => {
                  const items = groupedRates[category].slice(0, 5);
                  return (
                    <View key={category}>
                      <TouchableOpacity
                        style={styles.categoryRow}
                        onPress={() => toggleCategory(category)}
                      >
                        <Text style={styles.categoryText}>
                          {category} {collapsedCategories[category] ? "▼" : "▲"}
                        </Text>
                      </TouchableOpacity>

                      {!collapsedCategories[category] &&
                        items.map((c, idx) => {
                          const isLast = idx === items.length - 1;
                          return (
                            <View
                              key={c.id}
                              style={[styles.row, isLast && styles.lastRow]}
                            >
                              <Text style={styles.cell}>{c.type}</Text>
                              <Text style={styles.cell}>{c.points} pts/kg</Text>
                            </View>
                          );
                        })}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { padding: 16 },
  container: {
    borderRadius: 10,
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
  explanation: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#444",
    marginBottom: 30,
    lineHeight: 20,
    textAlign: "justify", // ✅ makes the text justified
  },

  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#008243",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
  categoryRow: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#E3F6E3",
  },
  categoryText: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF", // ✅ plain white rows
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  cell: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  lastRow: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomWidth: 0, // remove the bottom line
  },
});
