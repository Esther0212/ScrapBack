import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import CustomBgColor from "../../../components/customBgColor";
import { useEducational } from "../../../context/educationalContext";

const { width } = Dimensions.get("window");

const Guides = () => {
  const router = useRouter();
  const { educationalContent, selectedType } = useEducational(); // 🔹 use selectedType from global state

  // Find guide by type (case-sensitive now)
  const guide = educationalContent.find((item) => item.type === selectedType);

  if (!guide) {
    return (
      <CustomBgColor>
        <SafeAreaView style={styles.center}>
          <Text style={[styles.emptyText, styles.justifiedText]}>
            No recycling guide found for {selectedType}
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
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: guide.recyclingImage }}
                  style={styles.scaledImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}

          <View style={styles.box}>
            {/* Title */}
            <View style={styles.headerContainer}>
              {guide.containerLabel && (
                <View style={styles.containerLabel}>
                  <Text
                    style={[styles.containerLabelText, styles.justifiedText]}
                  >
                    {guide.containerLabel}
                  </Text>
                </View>
              )}
            </View>

            {/* Guide Sections */}
            {guide.headings && guide.headings.length > 0 ? (
              guide.headings.map((h, hi) => (
                <View key={hi} style={styles.sectionWrapper}>
                  {/* Header */}
                  {h.header && (
                    <Text style={[styles.headerText, styles.justifiedText]}>
                      {h.header}
                    </Text>
                  )}

                  {/* Subtitles */}
                  {h.subtitles
                    ?.filter((s) => s && s.trim() !== "")
                    .map((s, si) => (
                      <Text
                        key={si}
                        style={[styles.subtitleText, styles.justifiedText]}
                      >
                        {s}
                      </Text>
                    ))}

                  {/* Descriptions with descriptionTitle */}
                  {h.descriptions
                    ?.filter((d) => d.description || d.descriptionTitle)
                    .map((d, di) => (
                      <Text
                        key={di}
                        style={[styles.descriptionText, styles.justifiedText]}
                      >
                        {d.descriptionTitle && (
                          <Text style={styles.descriptionTitleText}>
                            {d.descriptionTitle}:{" "}
                          </Text>
                        )}
                        {d.description}
                      </Text>
                    ))}

                  {/* Content */}
                  {h.contents &&
                    h.contents
                      .filter((c) => c.contentTitle || c.content)
                      .map((c, ci) => (
                        <View key={ci} style={styles.bulletRow}>
                          <Text style={[styles.bulletDot]}>• </Text>
                          <Text
                            style={[styles.contentText, styles.justifiedText]}
                          >
                            {c.contentTitle && (
                              <Text style={styles.contentTitleText}>
                                {c.contentTitle}:{" "}
                              </Text>
                            )}
                            {c.content}
                          </Text>
                        </View>
                      ))}
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, styles.justifiedText]}>
                No detailed guide sections available.
              </Text>
            )}

            {/* Button to Dos & Don’ts */}
            <Pressable
              style={styles.ctaButton}
              onPress={() => router.push("/Main/recyclingGuide/dosDonts")}
            >
              <Text style={styles.ctaText}>View Guidelines</Text>
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

  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  justifiedText: { textAlign: "justify" },

  imageWrapper: { alignItems: "center", padding: 20 },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden", // 🔹 Ensures image corners are clipped
  },
  scaledImage: {
    width: width * 0.9,
    height: undefined,
    aspectRatio: 1.5,
  },

  box: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  containerLabel: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  containerLabelText: { fontFamily: "Poppins_700Bold", fontSize: 14 },

  sectionWrapper: { marginBottom: 20 },

  headerText: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#222",
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#333",
    marginBottom: 4,
  },
  descriptionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 6,
  },
  descriptionTitleText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
    fontFamily: "Poppins_700Bold",
  },
  contentText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  contentTitleText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#333",
  },

  ctaButton: {
    backgroundColor: "#008243",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  ctaText: {
    fontFamily: "Poppins_700Bold",
    color: "white",
    fontSize: 16,
  },
});

export default Guides;
