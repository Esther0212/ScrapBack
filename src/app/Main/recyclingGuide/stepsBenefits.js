import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";
import { useEducational } from "../../../context/educationalContext";

const { width } = Dimensions.get("window");

const StepsBenefits = () => {
  const { type } = useLocalSearchParams();
  const router = useRouter();
  const { educationalContent } = useEducational();

  // Get the guide for this type
  const guide = educationalContent.find(
    (item) => item.type.toLowerCase() === type.toLowerCase()
  );

  if (!guide) {
    return (
      <CustomBgColor>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emptyText}>
            No recycling guide found for {type}
          </Text>
        </SafeAreaView>
      </CustomBgColor>
    );
  }

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner */}
          {guide.recyclingImage && (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: guide.recyclingImage }}
                style={styles.scaledImage}
                resizeMode="contain"
              />
            </View>
          )}

          <View style={styles.box}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>How to Recycle {type}</Text>
              {guide.containerLabel && (
                <View style={styles.containerLabel}>
                  <Text style={styles.containerLabelText}>
                    {guide.containerLabel}
                  </Text>
                </View>
              )}
            </View>

            {/* Steps */}
            <View style={styles.steps}>
              {guide.steps && guide.steps.length > 0 ? (
                guide.steps.map((s, i) => (
                  <Text key={i} style={styles.step}>
                    <Text style={styles.bold}>{s.stepTitle}: </Text>
                    {s.stepContent}
                  </Text>
                ))
              ) : (
                <Text style={styles.emptyText}>No steps available.</Text>
              )}
            </View>

            {/* Benefits */}
            <Text style={styles.sectionTitle}>Benefits</Text>
            {guide.benefits && guide.benefits.length > 0 ? (
              guide.benefits.map((b, i) => (
                <View key={i}>
                  <Text style={styles.benefitTitle}>
                    {i + 1}. {b.benefitTitle}
                  </Text>
                  <Text style={styles.benefitText}>{b.benefitContent}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No benefits available.</Text>
            )}

            <Pressable
              style={styles.ctaButton}
              onPress={() =>
                router.push(`/Main/recyclingGuide/dosDonts?type=${type}`)
              }
            >
              <Text style={styles.ctaText}>View Dos & Don'ts</Text>
            </Pressable>
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
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#333" },
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
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 20, fontFamily: "Poppins_700Bold" },
  containerLabel: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  containerLabelText: { fontFamily: "Poppins_700Bold" },
  steps: { marginBottom: 20, marginTop: 10 },
  step: { fontFamily: "Poppins_400Regular", fontSize: 14, marginBottom: 6, color: "#333" },
  bold: { fontFamily: "Poppins_700Bold" },
  sectionTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", marginBottom: 12 },
  benefitTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", marginTop: 8, marginBottom: 4 },
  benefitText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "#555", marginBottom: 10 },
  ctaButton: {
    backgroundColor: "#008243",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  ctaText: { fontFamily: "Poppins_700Bold", color: "white", fontSize: 16 },
});

export default StepsBenefits;
