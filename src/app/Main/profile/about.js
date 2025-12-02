import React from "react";
// Using a slightly adjusted import to help the bundler resolve the module path
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Linking,
  Image,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import CustomBgColor from "../../../components/customBgColor";

const { width } = Dimensions.get("window");
const paddingHorizontal = width * 0.05;

// --- Color Definitions (Moved outside the component for clean styling) ---
const Colors = {
  primary: "#008243", // Deep Blue (Similar to the banner)
  secondary: "#38761D", // Deep Green (For agriculture/ecology)
  lightGray: "#F5F5F5",
  darkText: "#333333",
  lightText: "#FFFFFF",
  blue: "#007ACC", // Clean Blue for VISION
  gold: "#C79E4B", // Dark Gold for GOAL
  green: "#8CA34A", // Sea Green for MISSION
};

// --- Utility Functions ---

/**
 * Initiates a phone call to the given number.
 * @param {string} phone The phone number to call.
 */
const callNumber = (phone) => {
  const phoneNumber = `tel:${phone}`;

  Linking.openURL(phoneNumber).catch((err) => {
    console.error("Error opening phone link:", err);
    // Optional: show something to user
    // Alert.alert("Error", "Unable to place a call on this device.");
  });
};

/**
 * Opens a given URL in the device's default browser.
 * @param {string} url The URL to open.
 */
const openLink = (url) => {
  Linking.openURL(url).catch((err) => {
    console.error("Error opening URL link:", err);
    // Optional: show something to user
    // Alert.alert("Error", "Unable to open this link on this device.");
  });
};

// --- Reusable Components ---

/**
 * Section component
 * title - string
 * children - content
 * color - color for title and left border
 * icon - JSX element (icon component)
 */
const Section = ({ title, children, color, icon }) => (
  <View style={[styles.section, { borderLeftColor: color }]}>
    <View style={styles.sectionTitleRow}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={[styles.sectionTitle, { color: color }]}>{title}</Text>
    </View>
    <Text style={styles.sectionBody}>{children}</Text>
  </View>
);

/**
 * ServiceProductCard component
 * title - string
 * items - array of strings
 * icon - JSX element (icon component)
 */
const ServiceProductCard = ({ title, items, icon }) => (
  <View style={styles.serviceCard}>
    <View style={styles.serviceIconWrapper}>{icon}</View>
    <Text style={styles.serviceTitle}>{title}</Text>
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  </View>
);

/**
 * ContactDetail component
 * name - string
 * role - string
 * phone - string
 * onPress - function
 */
const ContactDetail = ({ name, role, phone, onPress }) => (
  <View style={styles.contactRow}>
    <View style={styles.contactLeft}>
      <Text style={styles.contactName}>{name}</Text>
      <Text style={styles.contactRole}>{role}</Text>
    </View>
    <TouchableOpacity
      style={styles.contactRight}
      onPress={onPress}
      // Ensure the button width/height matches the SocialLink component
    >
      <View style={styles.contactPhoneWrapper}>
        <FontAwesome6 name="phone" size={18} color={Colors.lightText} />
        <Text style={styles.contactPhone}>{phone}</Text>
      </View>
    </TouchableOpacity>
  </View>
);

/**
 * SocialLink component (New component for social media links)
 * name - string (e.g., "Facebook")
 * url - string (the full URL)
 * icon - JSX element (icon component)
 */
const SocialLink = ({ name, url, icon }) => (
  <View style={styles.socialRow}>
    <View style={styles.socialLeft}>
      <Text style={styles.contactName}>{name}</Text>
    </View>
    <TouchableOpacity
      style={styles.socialRight}
      onPress={() => openLink(url)}
      // Ensure the button width/height matches the ContactDetail component
    >
      <View style={styles.contactPhoneWrapper}>
        {icon}
        <Text style={styles.socialLinkText}>Go to {name}</Text>
      </View>
    </TouchableOpacity>
  </View>
);

// --- Main Component ---
export default function App() {
  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Image
              source={require("../../../assets/splash/pacafacoLogo.png")}
              style={styles.pacafacoLogo}
            />
            <Text style={styles.title}>
              PAGATPAT CAGAYAN DE ORO FARMER'S AGRICULTURE COOPERATIVE{" "}
            </Text>
            <Text style={styles.subtitle}>(PACAFACO)</Text>
          </View>

          {/* Vision, Goal, Mission Section */}
          <Section
            title="VISION"
            color={Colors.blue}
            icon={<Ionicons name="bulb" size={24} color={Colors.blue} />}
          >
            PACAFACO envisioned to produce science based bio-compost, innovative
            technology in vegetable production, rendered efficient solid waste
            management services and microfinance services that promotd healthy
            life and environment.
          </Section>

          <Section
            title="GOAL"
            color={Colors.gold}
            icon={
              <MaterialCommunityIcons
                name="bullseye-arrow"
                size={24}
                color={Colors.gold}
              />
            }
          >
            The goals of this Cooperative are to help improve the quality of
            life of its members and thereby contribute to inclusive growth,
            enterprise development & employment.
          </Section>

          <Section
            title="MISSION"
            color={Colors.green}
            icon={
              <FontAwesome6
                name="handshake-simple"
                size={24}
                color={Colors.green}
              />
            }
          >
            PACAFACO was organized to establish vegetables and livestock
            production & marketing, production and sale of organic fertilizer
            out of Biodegradable waste, Hydroponics or Aquaponics, Microlending
            for all members, and promoting and advancing the economic & social
            status of the members.
          </Section>

          {/* About Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ABOUT PACAFACO</Text>
            <Text style={styles.bodyText}>
              PACAFACO - Pagatpat Cagayan de Oro City Farmers Agriculture
              Cooperative formerly a Pagatpat Cagayan de Oro Farmers Association
              established last November 2011, last June 26, 2023 Cooperative
              Development Authority approved its registration, with 18 farmers
              from Brgy. Pagatpat, Cagayan de Oro City.
            </Text>
            <Text style={styles.bodyText}>
              PACAFACO adopted a social enterprise and improved the system that
              provide innovative technology together with its partner, CLENRO
              Cagayan de Oro LGU, DA 10, APOO Cagayan de Oro, DOST 10, USTP,
              DOLE 10, PCA, CDA and Pagatpat LGU. To provide farmers and
              customers an affordable organic fertilizer, healthy vegetables,
              credit services and employment, rendering solid waste management
              services.
            </Text>
          </View>

          {/* Services & Products Section */}
          <View style={styles.gridContainer}>
            <ServiceProductCard
              title="SERVICES"
              items={[
                "Micro-lending for members only",
                "Partner of Brgy. Pagatpat Cagayan de Oro City in Solid Waste Management",
              ]}
              icon={<FontAwesome6 name="toolbox" size={28} color="#DD2E44" />}
            />

            <ServiceProductCard
              title="PRODUCT"
              items={[
                "Lettuce Production and Organically Grown Vegetables",
                "Bio-compost / Organic Compost",
              ]}
              icon={<FontAwesome6 name="box-open" size={28} color="#A66258" />}
            />
          </View>

          {/* Address and Registration */}
          <View style={[styles.card, styles.addressCard]}>
            <Text style={styles.cardTitle}>REGISTRATION & LOCATION</Text>
            <Text style={styles.bodyText}>
              <Text style={styles.label}>Address:</Text> Zone 2 Tondo, Pagatpat,
              Cagayan De Oro City
            </Text>
            <Text style={styles.bodyText}>
              <Text style={styles.label}>CDA Registration No:</Text>{" "}
              9520-1010000034508
            </Text>
            <Text style={styles.assistedByText}>
              <Text style={styles.label}>Assisted by:</Text> Agricultural
              Productivity Operation Office, DA-10, DOLE-10, CDA, CLENRO, DOST,
              USTP, ATI, PCA, Pagatpat BRGY. Council
            </Text>
          </View>

          {/* Contact Footer */}
          <View style={styles.contactFooter}>
            <Text style={styles.contactHeader}>CONTACT PERSONS</Text>
            <ContactDetail
              name="Albert Bitang"
              role="Chairman"
              phone="09266699554"
              onPress={() => callNumber("09266699554")}
            />
            <ContactDetail
              name="Ronny V. Obsioma"
              role="Manager"
              phone="09531894468"
              onPress={() => callNumber("09531894468")}
            />

            {/* --- SOCIALS SECTION (New) --- */}
            <View style={styles.socialsSeparator} />
            <Text style={styles.contactHeader}>SOCIALS</Text>
            <SocialLink
              name="Facebook"
              url="https://www.facebook.com/pagatpat.cagayan.de.oro.farmer.s.agricul"
              icon={<FontAwesome6 name="facebook-f" size={24} color="white" />}
            />
            {/* --- END SOCIALS SECTION --- */}
          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
}

// --- Style Definitions ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingBottom: 0,
  },
  // --- Header Styles ---
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: 30,
    paddingHorizontal: paddingHorizontal,
    alignItems: "center",
    marginBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  pacafacoLogo: {
    width: 250,
    height: 250,
    marginBottom: 10,
    resizeMode: "contain",
  },
  logoContainer: {
    backgroundColor: Colors.secondary,
    borderRadius: 50,
    padding: 10,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 23,
    fontFamily: "Poppins_700Bold",
    color: Colors.lightText,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 19,
    fontFamily: "Poppins_700Bold",
    color: Colors.lightText,
    textAlign: "center",
    opacity: 0.8,
  },
  // --- Section Styles (Vision, Goal, Mission) ---
  section: {
    marginHorizontal: paddingHorizontal,
    marginBottom: 20,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 12,
    borderLeftWidth: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  sectionBody: {
    fontSize: 16,
    color: Colors.darkText,
    fontFamily: "Poppins_400Regular",
    textAlign: "justify",
  },
  // --- General Card Styles ---
  card: {
    marginHorizontal: paddingHorizontal,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 5,
  },
  bodyText: {
    fontSize: 16,
    color: Colors.darkText,
    marginBottom: 10,
    fontFamily: "Poppins_400Regular",
    textAlign: "justify",
  },
  label: {
    fontFamily: "Poppins_400Regular",
    textAlign: "justify",
  },
  assistedByText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    textAlign: "justify",
    color: Colors.darkText,
    marginTop: 10,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  // --- Grid & Service Styles ---
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: paddingHorizontal,
    marginBottom: 20,
  },
  serviceCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  serviceIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: Colors.lightGray,
  },
  serviceIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  serviceTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
    marginBottom: 8,
  },
  list: {
    marginTop: 5,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  listBullet: {
    fontSize: 16,
    color: Colors.secondary,
    marginRight: 5,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkText,
    fontFamily: "Poppins_400Regular",
    textAlign: "justify",
  },
  // --- Contact Footer Styles ---
  contactFooter: {
    backgroundColor: Colors.darkText,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 20,
  },
  contactHeader: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.gold,
    marginBottom: 15,
    textAlign: "center",
  },
  // --- Contact & Social Row Styles (Shared for layout) ---
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  contactLeft: {
    flex: 1,
  },
  socialLeft: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.lightText,
  },
  contactRole: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.lightGray,
  },
  contactPhoneWrapper: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  contactRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: "45%", // Slightly wider to accommodate "Go to Facebook" text
    height: 44, // Explicit height for size matching
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  socialRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: "45%",
    height: 44,
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  contactPhone: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: Colors.lightText,
    marginLeft: 8,
    alignItems: "center",
    textAlignVertical: "center",
  },
  socialLinkText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: Colors.lightText,
    marginLeft: 8,
    alignItems: "center",
    textAlignVertical: "center",
  },
  socialsSeparator: {
    height: 1,
    backgroundColor: "#444",
    marginVertical: 15,
  },
  addressCard: {},
});
