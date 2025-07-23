import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import CustomBgColor from "../components/customBgColor";

const { width } = Dimensions.get("window");

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              placeholder="Your email"
              placeholderTextColor="#888"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#888"
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

<View style={styles.row}>
  <TouchableOpacity
    style={styles.rememberMe}
    onPress={() => setRememberMe(!rememberMe)}
  >
    <Ionicons
      name={rememberMe ? "checkmark-circle" : "ellipse-outline"}
      size={20}
      color={rememberMe ? "#008243" : "#555"}
    />
    <Text style={styles.rememberText}>Remember me</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => router.push("/forgotpass")}>
    <Text style={styles.forgotText}>Forgot password?</Text>
  </TouchableOpacity>
</View>

          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.8}
            onPress={() => router.push("Main")}
          >
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.signupText}>
              Don't have an account?{" "}
              <Text style={styles.signupTextBold}>Sign up</Text>
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
    fontWeight: "800",
    color: "#3A2E2E",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 17,
    color: "#555",
    textAlign: "center",
    marginBottom: 42,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3A2E2E",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 14,
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 42,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#3A2E2E",
  },
  forgotText: {
    fontSize: 14,
    color: "#3A2E2E",
    textDecorationLine: "underline",
  },
  loginButton: {
    backgroundColor: "#008243",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  signupLink: {
    marginTop: 24,
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    color: "#3A2E2E",
  },
  signupTextBold: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

export default Login;
