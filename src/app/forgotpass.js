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

import CustomBgColor from "../components/customBgColor";

const ForgotPass = () => {
  const [email, setEmail] = useState("");

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email to reset your password
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              placeholder="Your email"
              placeholderTextColor="#666"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            activeOpacity={0.85}
            onPress={() => console.log("Reset password pressed")}
          >
            <Text style={styles.resetButtonText}>Reset Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginText}>
              Back to{" "}
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
    fontSize: 34,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    color: "#555",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 42,
  },
  inputContainer: {
    marginBottom: 26,
  },
  label: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    borderWidth: 1,
    borderColor: "#E0D4C3",
  },
  resetButton: {
    backgroundColor: "#008243",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
    marginTop: 10,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  loginLink: {
    marginTop: 28,
    alignItems: "center",
  },
  loginText: {
    fontFamily: "Poppins_400Regular",
  },
  loginTextBold: {
    fontFamily: "Poppins_700Bold",
    textDecorationLine: "underline",
  },
});

export default ForgotPass;