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
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase"; // ✅ make sure firebase.js exports auth & db
import CustomBgColor from "../components/customBgColor";

// ...imports remain the same

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    password: "",
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  const handleSignup = async () => {
    let tempErrors = { firstName: "", lastName: "", email: "", contact: "", password: "" };
    let isValid = true;

    // First Name validation
    if (!firstName.trim()) {
      tempErrors.firstName = "First name is required";
      isValid = false;
    }

    // Last Name validation
    if (!lastName.trim()) {
      tempErrors.lastName = "Last name is required";
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      tempErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      tempErrors.email = "Enter a valid email";
      isValid = false;
    }

    // Contact validation
    if (!contact.trim()) {
      tempErrors.contact = "Contact number is required";
      isValid = false;
    } else if (!/^\d{11}$/.test(contact)) {
      tempErrors.contact = "Contact number must be 11 digits";
      isValid = false;
    }

    // Password validation
    if (!password) {
      tempErrors.password = "Password is required";
      isValid = false;
    } else if (!validatePassword(password)) {
      tempErrors.password =
        "Password must be at least 8 chars, include 1 uppercase & 1 number";
      isValid = false;
    }

    setErrors(tempErrors);

    if (!isValid) {
      Alert.alert("❌ Error", "Please fix the highlighted fields.");
      return;
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save extra info in Firestore
      await setDoc(doc(db, "user", user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        contact: contact,
        userType: "user", // default
        createdAt: new Date(),
      });

      Alert.alert("✅ Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.push("/") },
      ]);
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("⚠️ Signup Failed", error.message);
    }
  };

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.title}>Sign up to earn points!</Text>
            <Text style={styles.subtitle}>Create your ScrapBack account now</Text>

            {/* First Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                placeholder="First name"
                placeholderTextColor="#777"
                style={styles.input}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  setErrors({ ...errors, firstName: "" });
                }}
              />
              {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                placeholder="Last name"
                placeholderTextColor="#777"
                style={styles.input}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  setErrors({ ...errors, lastName: "" });
                }}
              />
              {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
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
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: "" });
                }}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Contact Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                placeholder="Your contact number"
                placeholderTextColor="#777"
                style={styles.input}
                keyboardType="phone-pad"
                value={contact}
                maxLength={11}
                onChangeText={(text) => {
                  setContact(text.replace(/[^0-9]/g, ""));
                  setErrors({ ...errors, contact: "" });
                }}
              />
              {errors.contact ? <Text style={styles.errorText}>{errors.contact}</Text> : null}
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
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrors({ ...errors, password: "" });
                  }}
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
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Sign Up Button */}
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
                Already have an account? <Text style={styles.loginTextBold}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CustomBgColor>
  );
};

// Styles remain the same, just make sure you add styles for errorText
const styles = StyleSheet.create({
  errorText: {
    color: "red",
    marginTop: 4,
    fontSize: 13,
  },
  safeArea: { flex: 1 },
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
  inputContainer: { marginBottom: 22 },
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