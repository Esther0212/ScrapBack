import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, setDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import CustomBgColor from "../components/customBgColor";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleSignup = async () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !contact ||
      !address ||
      !confirmPassword
    ) {
      Alert.alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "user", uid), {
        firstName,
        lastName,
        email,
        contact,
        address,
        createdAt: new Date()
      });

      Alert.alert("Account created successfully!");
      router.push("/"); // redirect to homepage or login
    } catch (error) {
      Alert.alert("Signup Error", error.message);
    }
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.title}>Sign up to earn points!</Text>
            <Text style={styles.subtitle}>Create your ScrapBack account now</Text>

            {/* Name Row */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  placeholder="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor="#777"
                  style={styles.input}
                />
              </View>
              <View style={[styles.inputContainer, styles.halfInput, { marginLeft: 12 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  placeholder="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor="#777"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="Your email"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#777"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                placeholder="Your contact number"
                value={contact}
                onChangeText={setContact}
                placeholderTextColor="#777"
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                placeholder="Your address"
                value={address}
                onChangeText={setAddress}
                placeholderTextColor="#777"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Create a password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholderTextColor="#777"
                  style={styles.input}
                  secureTextEntry={!confirmPasswordVisible}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                >
                  <Ionicons
                    name={confirmPasswordVisible ? "eye-off" : "eye"}
                    size={20}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.signupButton}
              activeOpacity={0.85}
              onPress={handleSignup}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>

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
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
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
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 1,
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
