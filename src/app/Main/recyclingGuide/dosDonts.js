import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Animated,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";
import { useEducational } from "../../../context/educationalContext";

const { width } = Dimensions.get("window");

const CustomToggleSwitch = ({ value, onToggle }) => {
  const [animValue] = useState(new Animated.Value(value ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const thumbPosition = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 39.5],
  });

  const thumbText = value ? "Donts" : "Dos";
  const thumbColor = value ? "#E08282" : "#90C67C";

  return (
    <Pressable style={styles.toggleContainer} onPress={() => onToggle(!value)}>
      <View style={styles.toggleBackground}>
        <Text style={styles.backgroundLabelLeft}>Dos</Text>
        <Text style={styles.backgroundLabelRight}>Donts</Text>
      </View>

      <Animated.View
        style={[
          styles.thumb,
          { left: thumbPosition, backgroundColor: thumbColor },
        ]}
      >
        <Text style={styles.thumbText}>{thumbText}</Text>
      </Animated.View>
    </Pressable>
  );
};

const DosDonts = () => {
  const { type } = useLocalSearchParams();
  const { educationalContent } = useEducational();
  const guide = educationalContent.find(
    (item) => item.type.toLowerCase() === type.toLowerCase()
  );
  const [showDos, setShowDos] = useState(true);

  if (!guide) {
    return (
      <CustomBgColor bgColor={showDos ? "#90C67C" : "#E08282"}>
        <SafeAreaView style={styles.center}>
          <Text style={[styles.emptyText, styles.justifiedText]}>
            No recycling guide found for {type}
          </Text>
        </SafeAreaView>
      </CustomBgColor>
    );
  }

  return (
    <CustomBgColor bgColor={showDos ? "#90C67C" : "#E08282"}>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {showDos && guide.doImage ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: guide.doImage }}
                style={styles.scaledImage}
                resizeMode="contain"
              />
            </View>
          ) : !showDos && guide.dontImage ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: guide.dontImage }}
                style={styles.scaledImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          <View style={styles.box}>
            <View style={styles.headerContainer}>
              <Text style={styles.guidelinesTitle}>{type}</Text>
              <CustomToggleSwitch
                value={!showDos}
                onToggle={() => setShowDos(!showDos)}
              />
            </View>

            <View style={styles.contentSection}>
              {showDos
                ? guide.dos?.map((d, i) => (
                    <View key={i} style={styles.iconRow}>
                      <Feather name="check" size={24} color="#90C67C" />
                      <Text style={[styles.guidelineText, styles.justifiedText]}>
                        {d.doContent}
                      </Text>
                    </View>
                  ))
                : guide.donts?.map((d, i) => (
                    <View key={i} style={styles.iconRow}>
                      <Feather name="x" size={24} color="#E08282" />
                      <Text style={[styles.guidelineText, styles.justifiedText]}>
                        {d.dontContent}
                      </Text>
                    </View>
                  ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeAreaView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  justifiedText: { textAlign: "justify" },
  imageWrapper: { alignItems: "center", padding: 20 },
  scaledImage: {
    width: width * 0.9,
    height: undefined,
    aspectRatio: 1.5,
    borderRadius: 12,
  },
  box: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20, // padding inside the box
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  guidelinesTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    color: "#333",
  },
  contentSection: { marginTop: 20 },
  iconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  guidelineText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#333",
    flex: 1, // ensures text wraps within available space
  },
  toggleContainer: {
    width: 90,
    height: 25,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#ddd",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    alignItems: "center",
  },
  backgroundLabelLeft: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: "#555",
  },
  backgroundLabelRight: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: "#555",
  },
  thumb: {
    position: "absolute",
    width: 48,
    height: 20,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#fff" },
});

export default DosDonts;
