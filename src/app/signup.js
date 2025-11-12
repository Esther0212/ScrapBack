import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPhoneNumber,
} from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth, db } from "../../firebase";
import CustomBgColor from "../components/customBgColor";
import { Menu, Provider as PaperProvider } from "react-native-paper";
import Checkbox from "react-native-paper/lib/commonjs/components/Checkbox/Checkbox";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";

// ✅ store confirmation inside file (not utils)
let tempConfirmationResult = null;
export const getTempConfirmation = () => tempConfirmationResult;

const Signup = () => {
  // states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [gender, setGender] = useState("");
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);
  const [dob, setDob] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [street, setStreet] = useState("");
  const [region, setRegion] = useState(null);
  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);
  const [barangay, setBarangay] = useState(null);
  const [postalCode, setPostalCode] = useState("9000");
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [barangayMenu, setBarangayMenu] = useState(false);

  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const recaptchaVerifier = useRef(null);

  // preload addresses
  useEffect(() => {
    const preloadAddressData = async () => {
      try {
        const regionRes = await axios.get("https://psgc.gitlab.io/api/regions/");
        setRegions(regionRes.data);

        const northernMindanao = regionRes.data.find(
          (r) => r.name === "Northern Mindanao"
        );
        setRegion(northernMindanao);

        if (northernMindanao) {
          const provinceRes = await axios.get(
            `https://psgc.gitlab.io/api/regions/${northernMindanao.code}/provinces/`
          );
          setProvinces(provinceRes.data);

          const misamis = provinceRes.data.find(
            (p) => p.name === "Misamis Oriental"
          );
          setProvince(misamis);

          if (misamis) {
            const cityRes = await axios.get(
              `https://psgc.gitlab.io/api/provinces/${misamis.code}/cities-municipalities/`
            );
            setCities(cityRes.data);

            const cdo = cityRes.data.find(
              (c) => c.name === "City of Cagayan De Oro"
            );
            setCity(cdo);

            if (cdo) {
              const brgyRes = await axios.get(
                `https://psgc.gitlab.io/api/cities-municipalities/${cdo.code}/barangays/`
              );
              setBarangays(brgyRes.data);
            }
          }
        }
      } catch (err) {
        console.error("Error preloading address:", err);
      }
    };
    preloadAddressData();
  }, []);

  // signup handler
  const handleSignup = async () => {
    if (!privacyChecked) {
      setPrivacyError(true);
      ToastAndroid.show("Please agree to the privacy policy", ToastAndroid.SHORT);
      return;
    }
    if (!dob) {
      ToastAndroid.show(
        "Please select your date of birth.",
        ToastAndroid.SHORT
      );
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      ToastAndroid.show(
        `You must be 18 or older to sign up. Your age is ${age}.`,
        ToastAndroid.LONG
      );
      return;
    }

    if (
      !firstName ||
      !lastName ||
      (!email && !contact) ||
      !password ||
      !confirmPassword ||
      !gender ||
      !dob ||
      !street ||
      !region ||
      !province ||
      !city ||
      !barangay
    ) {
      ToastAndroid.show("Please fill all required fields", ToastAndroid.SHORT);
      return;
    }
    if (password !== confirmPassword) {
      ToastAndroid.show("Passwords do not match.", ToastAndroid.SHORT);
      return;
    }

    // ✅ Check for strong password before signup
    const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPass.test(password)) {
      ToastAndroid.show(
        "Password must be at least 8 characters, include uppercase, lowercase, and number.",
        ToastAndroid.LONG
      );
      return;
    }

    try {
      setLoading(true);

      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (!phoneRegex.test(contact)) {
        ToastAndroid.show(
          "Please enter a valid phone number.",
          ToastAndroid.LONG
        );
        return;
      }

      // ✅ Create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // ✅ Send email verification
      await sendEmailVerification(user);

      // ✅ Store user info in Firestore
      await setDoc(doc(db, "user", user.uid), {
        firstName,
        lastName,
        email,
        contact,
        gender,
        dob,
        userType: "user",
        address: {
          street,
          region: region.name,
          province: province.name,
          city: city.name,
          barangay: barangay.name,
          postalCode,
        },
        createdAt: new Date(),
        points: 0,
        online: false,
      });

      // ✅ Show success modal only (no toast)
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Signup Error:", error);

      // 🎯 Friendlier error messages
      let message = "Signup failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered. Please log in instead.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak. Use at least 6 characters.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again later.";
      }

      ToastAndroid.show(message, ToastAndroid.LONG);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Password validation function
  const validatePassword = (pass) => {
    const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (pass.length === 0) {
      setPasswordError("");
    } else if (!strongPass.test(pass)) {
      setPasswordError(
        "Password must be at least 8 characters, include uppercase, lowercase, and number."
      );
    } else {
      setPasswordError("");
    }
  };
  const isFormValid =
    firstName &&
    lastName &&
    email &&
    contact &&
    password &&
    confirmPassword &&
    gender &&
    dob &&
    street &&
    barangay &&
    privacyChecked;

  return (
    <PaperProvider>
      <CustomBgColor>
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={auth.app.options}
        />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
              <Text style={styles.title}>Sign up to earn points!</Text>
              <Text style={styles.subtitle}>
                Create your Scrapback account now
              </Text>

              {/* Name */}
              <View style={styles.row}>
                <InputField
                  label="First Name"
                  value={firstName}
                  setValue={setFirstName}
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <InputField
                  label="Last Name"
                  value={lastName}
                  setValue={setLastName}
                  containerStyle={{ flex: 1, marginLeft: 8 }}
                />
              </View>

              <InputField
                label="Email (optional)"
                value={email}
                setValue={setEmail}
                keyboardType="email-address"
              />
              <InputField
                label="Contact Number (optional)"
                value={contact}
                setValue={(text) => {
                  let cleaned = text.replace(/[^0-9+]/g, "");
                  if (cleaned.includes("+") && !cleaned.startsWith("+")) {
                    cleaned = cleaned.replace("+", "");
                  }
                  if (cleaned.startsWith("+")) {
                    if (cleaned.length <= 13) setContact(cleaned);
                  } else {
                    if (cleaned.length <= 11) setContact(cleaned);
                  }
                }}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  contact && !/^(09|\+639)\d{9}$/.test(contact)
                    ? { borderColor: "red" } // highlight invalid number
                    : {},
                ]}
              />

              {/* ✅ Password with live validation */}
              <View>
                <PasswordField
                  label="Password"
                  value={password}
                  setValue={(text) => {
                    setPassword(text);
                    validatePassword(text);
                  }}
                  visible={passwordVisible}
                  setVisible={setPasswordVisible}
                />
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </View>

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                setValue={setConfirmPassword}
                visible={confirmPasswordVisible}
                setVisible={setConfirmPasswordVisible}
              />

              <DropdownField
                label="Gender"
                visible={genderMenuVisible}
                setVisible={setGenderMenuVisible}
                selected={gender}
                setSelected={setGender}
                options={["Male", "Female", "Other"]}
              />

              {/* DOB */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <Text style={{ color: dob ? "#3A2E2E" : "#777" }}>
                    {dob ? new Date(dob).toLocaleDateString() : "Select Date"}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={datePickerVisible}
                  mode="date"
                  maximumDate={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 18)
                    )
                  } // ✅ limit
                  onConfirm={(date) => {
                    setDob(date.toISOString());
                    setDatePickerVisible(false);
                  }}
                  onCancel={() => setDatePickerVisible(false)}
                />
              </View>

              {/* Address */}
              <Text style={styles.label}>Address</Text>
              <InputField label="Street" value={street} setValue={setStreet} subLabel />
              <DropdownField label="Region" visible={false} selected={region ? region.name : ""} readOnly subLabel />
              <DropdownField label="Province" visible={false} selected={province ? province.name : ""} readOnly subLabel />
              <DropdownField label="City" visible={false} selected={city ? city.name : ""} readOnly subLabel />
              <DropdownField
                label="Barangay"
                visible={barangayMenu}
                setVisible={setBarangayMenu}
                selected={barangay ? barangay.name || barangay : ""}
                setSelected={setBarangay}
                options={barangays || []}
                optionKey="name"
                subLabel
              />
              <View style={styles.inputContainer}>
                <Text style={styles.subLabel}>Postal Code</Text>
                <TextInput value={postalCode} editable={false} style={styles.input} />
              </View>

              {/* Privacy */}
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  onPress={() => {
                    setPrivacyChecked(!privacyChecked);
                    if (privacyError) setPrivacyError(false);
                  }}
                  style={[
                    styles.checkboxRow,
                    privacyError && !privacyChecked && { borderColor: "red" },
                  ]}
                >
                  <Checkbox
                    status={privacyChecked ? "checked" : "unchecked"}
                    onPress={() => setPrivacyChecked(!privacyChecked)}
                    color="#008243"
                  />
                  <Text style={styles.checkboxLabel}>
                    I allow PACAFACO to process my data per{" "}
                    <Text
                      style={{ color: "#008243", textDecorationLine: "underline" }}
                      onPress={() => setShowPrivacyModal(true)}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
              {/* ✅ Sign Up Button with loader */}
              <TouchableOpacity
                style={[styles.signupButton, { opacity: loading ? 0.6 : 1 }]}
                activeOpacity={0.85}
                onPress={handleSignup}
                disabled={loading} // ✅ prevents re-press
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.signupButtonText}>Sign Up</Text>
                )}
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
    </PaperProvider>
  );
};

// components
const InputField = ({ label, value, setValue, keyboardType, containerStyle, subLabel }) => (
  <View style={[styles.inputContainer, containerStyle]}>
    <Text style={subLabel ? styles.subLabel : styles.label}>{label}</Text>
    <TextInput
      placeholder={label}
      value={value}
      onChangeText={setValue}
      style={styles.input}
      placeholderTextColor="#777"
      keyboardType={keyboardType || "default"}
    />
  </View>
);

const PasswordField = ({ label, value, setValue, visible, setVisible }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.passwordWrapper}>
      <TextInput
        placeholder={label}
        value={value}
        onChangeText={setValue}
        style={styles.input}
        placeholderTextColor="#777"
        secureTextEntry={!visible}
      />
      <TouchableOpacity
        style={styles.eyeIcon}
        onPress={() => setVisible(!visible)}
      >
        <Ionicons name={visible ? "eye" : "eye-off"} size={20} color="#555" />
      </TouchableOpacity>
    </View>
  </View>
);

const DropdownField = ({
  label,
  visible,
  setVisible,
  selected,
  setSelected,
  options,
  optionKey,
  readOnly = false,
  subLabel,
}) => (
  <View style={styles.inputContainer}>
    <Text style={subLabel ? styles.subLabel : styles.label}>{label}</Text>
    <Menu
      visible={visible && !readOnly}
      onDismiss={() => setVisible(false)}
      anchor={
        <TouchableOpacity
          style={[styles.input, { alignItems: "flex-start" }]}
          onPress={() => !readOnly && setVisible(true)}
        >
          <Text style={{ color: selected ? "#3A2E2E" : "#777" }}>
            {selected || `Select ${label}`}
          </Text>
        </TouchableOpacity>
      }
      contentStyle={styles.menuContent}
    >
      {Array.isArray(options) &&
        options.map((o) => (
          <Menu.Item
            key={optionKey ? o.code : o}
            onPress={() => {
              setSelected(o);
              setVisible(false);
            }}
            title={optionKey ? o[optionKey] : o}
          />
        ))}
    </Menu>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
  title: { fontSize: 30, fontWeight: "700", textAlign: "center", marginTop: 20, color: "#3A2E2E" },
  subtitle: { fontSize: 16, textAlign: "center", color: "#555", marginBottom: 40 },
  row: { flexDirection: "row" },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 17, fontWeight: "700", color: "#3A2E2E", marginBottom: 6 },
  subLabel: { fontSize: 13, fontWeight: "700", color: "#71695B", marginBottom: 6 },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#3A2E2E",
    borderWidth: 1,
    borderColor: "#E0D4C3",
  },
  passwordWrapper: { position: "relative" },
  eyeIcon: { position: "absolute", right: 16, top: 14 },
  signupButton: {
    backgroundColor: "#008243",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  signupButtonText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  loginLink: { marginTop: 26, alignItems: "center", marginBottom: 30 },
  loginText: { fontSize: 14, color: "#3A2E2E" },
  loginTextBold: { fontWeight: "700", textDecorationLine: "underline" },
  checkboxContainer: { marginTop: 10 },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D4C3",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#F1E3D3",
  },
  checkboxLabel: { flex: 1, fontSize: 13, color: "#3A2E2E" },
});

export default Signup;
