import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  ToastAndroid, // ✅ added for toast
  Modal, // ✅ added for modal
  Pressable, // ✅ added for close button
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth"; // ✅ added sendEmailVerification
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import CustomBgColor from "../components/customBgColor";
import { Menu, Provider as PaperProvider } from "react-native-paper";
import Checkbox from "react-native-paper/lib/commonjs/components/Checkbox/Checkbox"; // ✅ correct import path
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";

const Signup = () => {
  const { width } = Dimensions.get("window");

  // Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Gender dropdown
  const [gender, setGender] = useState("");
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);

  // Date picker
  const [dob, setDob] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Address
  const [street, setStreet] = useState("");
  const [region, setRegion] = useState(null);
  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);
  const [barangay, setBarangay] = useState(null);
  const [postalCode, setPostalCode] = useState("9000"); // auto-set

  // Address dropdown data
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [barangayMenu, setBarangayMenu] = useState(false);

  // ✅ Added loading state
  const [loading, setLoading] = useState(false);

  // ✅ Privacy consent states
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);

  // ✅ Privacy Policy modal visibility
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Preload API data to reduce lag (done at component mount)
  useEffect(() => {
    const preloadAddressData = async () => {
      try {
        const regionRes = await axios.get(
          "https://psgc.gitlab.io/api/regions/"
        );
        setRegions(regionRes.data);

        // Default selections
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

            const cagayanCity = cityRes.data.find(
              (c) => c.name === "City of Cagayan De Oro"
            );
            setCity(cagayanCity);

            if (cagayanCity) {
              const barangayRes = await axios.get(
                `https://psgc.gitlab.io/api/cities-municipalities/${cagayanCity.code}/barangays/`
              );
              setBarangays(barangayRes.data);
            }
          }
        }
      } catch (err) {
        console.error("Error preloading address data:", err);
      }
    };
    preloadAddressData();
  }, []);

  const handleSignup = async () => {
    if (!privacyChecked) {
      setPrivacyError(true);
      ToastAndroid.show(
        "Please agree to the privacy policy to proceed.",
        ToastAndroid.SHORT
      );
      return;
    }

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !contact ||
      !confirmPassword ||
      !gender ||
      !dob ||
      !street ||
      !region ||
      !province ||
      !city ||
      !barangay
    ) {
      ToastAndroid.show(
        "Please fill in all required fields.",
        ToastAndroid.SHORT
      );
      return;
    }

    if (password !== confirmPassword) {
      ToastAndroid.show("Passwords do not match.", ToastAndroid.SHORT);
      return;
    }

    try {
      setLoading(true);

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

  return (
    <PaperProvider>
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
              <Text style={styles.title}>Sign up to earn points!</Text>
              <Text style={styles.subtitle}>
                Create your ScrapBack account now
              </Text>

              {/* First Name & Last Name side by side */}
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
                label="Email"
                value={email}
                setValue={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <InputField
                label="Contact Number"
                value={contact}
                setValue={setContact}
                keyboardType="phone-pad"
              />

              <PasswordField
                label="Password"
                value={password}
                setValue={setPassword}
                visible={passwordVisible}
                setVisible={setPasswordVisible}
              />
              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                setValue={setConfirmPassword}
                visible={confirmPasswordVisible}
                setVisible={setConfirmPasswordVisible}
              />

              {/* Gender Dropdown */}
              <DropdownField
                label="Gender"
                visible={genderMenuVisible}
                setVisible={setGenderMenuVisible}
                selected={gender}
                setSelected={setGender}
                options={["Male", "Female", "Other"]}
              />

              {/* Date of Birth */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <Text
                    style={{
                      color: dob ? "#3A2E2E" : "#777",
                      fontSize: 15,
                      fontFamily: "Poppins_400Regular",
                    }}
                  >
                    {dob ? new Date(dob).toLocaleDateString() : "Select Date"}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={datePickerVisible}
                  mode="date"
                  onConfirm={(date) => {
                    setDob(date.toISOString());
                    setDatePickerVisible(false);
                  }}
                  onCancel={() => setDatePickerVisible(false)}
                />
              </View>

              {/* Address */}
              <Text style={styles.label}>Address</Text>

              <InputField
                label="Street, Building, House No., etc."
                value={street}
                setValue={setStreet}
                subLabel
              />

              <DropdownField
                label="Barangay"
                visible={barangayMenu}
                setVisible={setBarangayMenu}
                selected={barangay ? barangay.name : ""}
                setSelected={setBarangay}
                options={barangays}
                optionKey="name"
                subLabel
              />

              <DropdownField
                label="City"
                visible={false}
                setVisible={() => {}}
                selected={city ? city.name : ""}
                setSelected={() => {}}
                options={cities}
                optionKey="name"
                readOnly
                subLabel
              />

              <DropdownField
                label="Region"
                visible={false}
                setVisible={() => {}}
                selected={region ? region.name : ""}
                setSelected={() => {}}
                options={regions}
                optionKey="name"
                readOnly
                subLabel
              />
              <DropdownField
                label="Province"
                visible={false}
                setVisible={() => {}}
                selected={province ? province.name : ""}
                setSelected={() => {}}
                options={provinces}
                optionKey="name"
                readOnly
                subLabel
              />

              <View style={styles.inputContainer}>
                <Text style={styles.subLabel}>Postal Code</Text>
                <TextInput
                  value={postalCode}
                  editable={false}
                  style={styles.input}
                />
              </View>
              {/* ✅ Privacy Agreement Checkbox */}
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
                  activeOpacity={0.8}
                >
                  <Checkbox
                    status={privacyChecked ? "checked" : "unchecked"}
                    onPress={() => {
                      setPrivacyChecked(!privacyChecked);
                      if (privacyError) setPrivacyError(false);
                    }}
                    color="#008243"
                  />
                  <Text style={styles.checkboxLabel}>
                    I allow PACAFACO. to process my data in accordance with the{" "}
                    <Text
                      style={{
                        color: "#008243",
                        textDecorationLine: "underline",
                      }}
                      onPress={() => setShowPrivacyModal(true)} // ✅ open modal on click
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </TouchableOpacity>
                {privacyError && !privacyChecked && (
                  <Text style={styles.errorText}>
                    You must agree to continue.
                  </Text>
                )}
              </View>
              {/* ✅ Sign Up Button with loader */}
              <TouchableOpacity
                style={styles.signupButton}
                activeOpacity={0.85}
                onPress={handleSignup}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
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
            {/* ✅ Privacy Policy Modal */}
            <Modal
              visible={showPrivacyModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowPrivacyModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Privacy Policy</Text>
                  <ScrollView style={styles.modalContent}>
                    <Text style={styles.modalText}>
                      PACAFACO. respects your privacy and ensures your personal
                      information is protected. We collect and process your data
                      only to provide services and improve your experience.
                      {"\n\n"}
                      By signing up, you agree that PACAFACO. may store and
                      process your data in accordance with this Privacy Policy.
                    </Text>
                  </ScrollView>

                  <Pressable
                    style={styles.closeButton}
                    onPress={() => setShowPrivacyModal(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>

            {/* ✅ Success Modal */}
            <Modal
              visible={showSuccessModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowSuccessModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Verification Email Sent</Text>
                  <ScrollView style={styles.modalContent}>
                    <Text style={styles.modalText}>
                      A verification link has been sent to your email address.
                      {"\n\n"}
                      Please check your inbox and verify your account before
                      logging in.
                    </Text>
                  </ScrollView>

                  <Pressable
                    style={styles.closeButton}
                    onPress={() => {
                      setShowSuccessModal(false);
                      router.push("/login");
                    }}
                  >
                    <Text style={styles.closeButtonText}>OK</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </ScrollView>
        </SafeAreaView>
      </CustomBgColor>
    </PaperProvider>
  );
};

// ✅ Input, Password, Dropdown components remain unchanged
const InputField = ({
  label,
  value,
  setValue,
  keyboardType,
  containerStyle,
  subLabel,
  ...props
}) => (
  <View style={[styles.inputContainer, containerStyle]}>
    <Text style={subLabel ? styles.subLabel : styles.label}>{label}</Text>
    <TextInput
      placeholder={label}
      value={value}
      onChangeText={setValue}
      style={styles.input}
      placeholderTextColor="#777"
      keyboardType={keyboardType || "default"}
      {...props}
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
          <Text
            style={[
              styles.dropdownText,
              { color: selected ? "#3A2E2E" : "#777" },
            ]}
          >
            {selected || `Select ${label}`}
          </Text>
        </TouchableOpacity>
      }
      contentStyle={styles.menuContent}
    >
      {options.map((o) => (
        <Menu.Item
          key={optionKey ? o.code : o}
          onPress={() => {
            setSelected(o);
            setVisible(false);
          }}
          title={optionKey ? o[optionKey] : o}
          titleStyle={{
            fontSize: 15,
            fontFamily: "Poppins_400Regular",
            color: "#3A2E2E",
          }}
        />
      ))}
    </Menu>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: "center" },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  title: {
    fontSize: 30,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
  },
  row: { flexDirection: "row" },
  inputContainer: { marginBottom: 16 },
  label: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#3A2E2E",
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#71695B",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    borderWidth: 1,
    borderColor: "#E0D4C3",
    width: "100%",
  },
  passwordWrapper: { position: "relative" },
  eyeIcon: { position: "absolute", right: 16, top: 14, padding: 4 },
  menuContent: { backgroundColor: "#fff", borderRadius: 12 },
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
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  loginLink: { marginTop: 26, alignItems: "center", marginBottom: 30 },
  loginText: {
    fontSize: 14,
    color: "#3A2E2E",
    fontFamily: "Poppins_400Regular",
  },
  loginTextBold: {
    fontFamily: "Poppins_700Bold",
    textDecorationLine: "underline",
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  checkboxContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0D4C3",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#F1E3D3",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: "#3A2E2E",
    fontFamily: "Poppins_400Regular",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
    fontFamily: "Poppins_400Regular",
  },
  // ✅ Privacy Policy Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#008243",
    marginBottom: 12,
    textAlign: "center",
  },
  modalContent: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Poppins_400Regular",
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: "#008243",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
});

export default Signup;
