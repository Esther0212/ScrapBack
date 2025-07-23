import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import LogoImage from "../assets/login.png"; // Update path if needed

const { width } = Dimensions.get("window");

const Splash = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image source={LogoImage} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Explore the app</Text>
        <Text style={styles.description}>
          All your recyclables in one place,
          {"\n"}rewarding you every step of the way.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1EECF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 400,
    height: 200,
    resizeMode: "contain",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 26,           // bigger subtitle
    fontWeight: "800",      // bolder
    color: "#3A2E2E",
    marginTop: 12,
    letterSpacing: 0.5,
  },
  description: {
    textAlign: "center",
    fontSize: 18,           // bigger description
    color: "#4A4A4A",
    marginVertical: 16,
    lineHeight: 26,         // more line height for clarity
    letterSpacing: 0.3,
  },
  loginButton: {
    backgroundColor: "#008243",
    paddingVertical: 16,
    width: "80%",
    borderRadius: 10,
    marginTop: 28,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,           // bigger button text
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  signUpButton: {
    borderWidth: 1.5,
    borderColor: "#008243",
    paddingVertical: 16,
    width: "80%",
    borderRadius: 10,
    marginTop: 14,
    alignItems: "center",
  },
  signUpButtonText: {
    color: "#008243",
    fontSize: 18,           // bigger button text
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default Splash;
