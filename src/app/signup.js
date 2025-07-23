import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import CustomBgColor from "../components/customBgColor";

const Signup = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Sign up to earn points!</Text>
          <Text style={styles.subtitle}>Create your ScrapBack account now</Text>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="Your name"
              placeholderTextColor="#777"
              style={styles.input}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Your email"
              placeholderTextColor="#777"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Contact Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              placeholder="Your contact number"
              placeholderTextColor="#777"
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Create a password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#777"
                style={styles.input}
                secureTextEntry={!passwordVisible}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                <Ionicons
                  name={passwordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={styles.signupButton}
            activeOpacity={0.85}
            onPress={() => router.push("/")}
          >
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Log in Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginTextBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#3A2E2E",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3A2E2E",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#3A2E2E",
    borderWidth: 1,
    borderColor: "#E0D4C3",
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 14,
    padding: 4,
  },
  signupButton: {
    backgroundColor: "#008243",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
    marginTop: 12,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: 26,
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#3A2E2E",
  },
  loginTextBold: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default Signup;
