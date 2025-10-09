import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  Dimensions,
  Pressable,
  findNodeHandle,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import { Ionicons } from "@expo/vector-icons";
import { Provider as PaperProvider } from "react-native-paper";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RewardsConversionTable = () => {
  const [conversionData, setConversionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [expandedCards, setExpandedCards] = useState({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const anchorRef = useRef(null);
  const [anchorLayout, setAnchorLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "wasteConversionRates")
        );
        const tempData = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const category = data.category || "Uncategorized";

          if (!tempData[category]) {
            tempData[category] = [];
          }

          tempData[category].push({
            type: data.type,
            points: `${data.points} points`,
          });
        });

        const formattedData = Object.keys(tempData).map((key) => ({
          category: `${key} Conversion`,
          items: tempData[key].sort((a, b) => a.type.localeCompare(b.type)),
        }));

        // ✅ Expand all initially
        const expandedInit = {};
        formattedData.forEach((item) => {
          expandedInit[item.category] = true;
        });

        setConversionData(formattedData);
        setExpandedCards(expandedInit);
      } catch (error) {
        console.error("Error fetching Firestore data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter logic
  const filteredData =
    filter === "All"
      ? conversionData
      : conversionData.filter((section) =>
          section.category.includes(filter)
        );

  // Toggle card expand/collapse
  const toggleCard = (category) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2FA64F" />
        <Text style={{ color: "#4D5D52", marginTop: 10 }}>
          Loading data...
        </Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Conversion Table of Different Types of Waste
        </Text>

        {/* Filter Dropdown (Modal based) */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Category:</Text>

          <TouchableOpacity
            ref={anchorRef}
            style={styles.dropdownAnchor}
            onLayout={(e) => setAnchorLayout(e.nativeEvent.layout)}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text
              style={[
                styles.dropdownText,
                { color: filter === "All" ? "#777" : "#3A2E2E" },
              ]}
            >
              {filter}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Modal for Filter */}
        <Modal
          transparent
          visible={filterModalVisible}
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          {/* Dim background */}
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setFilterModalVisible(false)}
          >
            <View
              style={[
                styles.modalContent,
                {
                  position: "absolute",
                  top: anchorLayout.y + anchorLayout.height + 120, // place below anchor
                  left: anchorLayout.x + 16,
                  width: anchorLayout.width,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setFilter("All");
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>All</Text>
              </TouchableOpacity>
              {conversionData.map((section, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setFilter(section.category.replace(" Conversion", ""));
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {section.category.replace(" Conversion", "")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Conversion Cards */}
        {filteredData.map((section, index) => (
          <View key={index} style={styles.card}>
            <TouchableOpacity
              style={styles.headerBar}
              onPress={() => toggleCard(section.category)}
              activeOpacity={0.8}
            >
              <Text style={styles.category}>{section.category}</Text>
              <Ionicons
                name={
                  expandedCards[section.category]
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={22}
                color="#fff"
              />
            </TouchableOpacity>

            {expandedCards[section.category] && (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.cellHeader, { flex: 2 }]}>
                    Type of Waste
                  </Text>
                  <Text style={styles.cellHeader}>Points per KG</Text>
                </View>

                {section.items.map((item, i) => (
                  <View
                    key={i}
                    style={[
                      styles.row,
                      { backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#E3F6E3" },
                    ]}
                  >
                    <Text style={[styles.cell, { flex: 2 }]}>{item.type}</Text>
                    <Text style={styles.cell}>{item.points}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <Text style={styles.footerText}>
          Earn points while keeping the planet clean!
        </Text>
      </ScrollView>
    </PaperProvider>
  );
};

export default RewardsConversionTable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F1C5",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F1C5",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  filterContainer: { marginBottom: 16 },
  filterLabel: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 6,
  },
  dropdownAnchor: {
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0D4C3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)", // dim background
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    elevation: 6,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalItemText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
  },
  card: {
    backgroundColor: "#F6F8F0",
    borderRadius: 14,
    marginBottom: 15,
    overflow: "hidden",
  },
  headerBar: {
    backgroundColor: "#008243",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  table: { borderTopWidth: 1, borderTopColor: "#DDE3DA" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#CDE3B1",
    borderBottomWidth: 1,
    borderBottomColor: "#BBD39F",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#D6DEC8",
  },
  cellHeader: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
  },
  cell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  footerText: {
    textAlign: "center",
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginTop: 10,
    marginBottom: 30,
  },
});
