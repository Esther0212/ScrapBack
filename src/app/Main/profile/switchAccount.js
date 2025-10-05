import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../../../../firebase";
import CustomBgColor from "../../../components/customBgColor";
import { Menu, Provider as PaperProvider } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const SwitchAccount = () => {
  const [showSignup, setShowSignup] = useState(false);

  // Shared state for Login
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  // Signup-specific states
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [contact, setContact] = useState("");
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
      Alert.alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "user", uid), {
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
      });

      Alert.alert("Account created successfully!");
      router.push("/");
    } catch (error) {
      Alert.alert("Signup Error", error.message);
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

const handleLogin = async () => {
  let tempErrors = { email: "", password: "" };
  let isValid = true;

  if (!email) {
    tempErrors.email = "Email is required";
    isValid = false;
  } else if (!validateEmail(email)) {
    tempErrors.email = "Enter a valid email address";
    isValid = false;
  }

  if (!password) {
    tempErrors.password = "Password is required";
    isValid = false;
  }

  setErrors(tempErrors);
  if (!isValid) return;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "user", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();

      // ✅ Always save to savedUsers (for Switch Account modal)
      let savedUsers = JSON.parse(await AsyncStorage.getItem("savedUsers")) || [];

      const exists = savedUsers.some((u) => u.uid === user.uid);
      if (!exists) {
        savedUsers.push({
          uid: user.uid,
          email,
          password, // ⚠️ (consider encrypting this in future)
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          profilePic: userData.profilePic || null,
        });
        await AsyncStorage.setItem("savedUsers", JSON.stringify(savedUsers));
      }

      // ✅ Save name for quick access (optional)
      await AsyncStorage.setItem("firstName", userData.firstName || "");

      // ✅ Only store "lastUsedUser" if Remember Me is checked
      if (rememberMe) {
        await AsyncStorage.setItem("lastUsedUser", JSON.stringify({
          uid: user.uid,
          email,
          password,
        }));
      }
    }

    Alert.alert("Login Success", "You have successfully logged in!");
    router.replace("/Main");
  } catch (error) {
    let message = "Login failed. Please try again.";

    if (error.code === "auth/invalid-email") {
      message = "Invalid email address.";
    } else if (error.code === "auth/user-not-found") {
      message = "User not found.";
    } else if (error.code === "auth/wrong-password") {
      message = "Incorrect password.";
    }

    Alert.alert("Login Error", message);
  }
};

  // 🔹 UI
  return (
    <PaperProvider>
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          {showSignup ? (
            // 🔹 Signup form
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <Text style={styles.title}>Sign up to earn points!</Text>
              <Text style={styles.subtitle}>
                Create your ScrapBack account now
              </Text>
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
                    style={{ color: dob ? "#3A2E2E" : "#777", fontSize: 16 }}
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
                label="Barangay"
                visible={barangayMenu}
                setVisible={setBarangayMenu}
                selected={barangay ? barangay.name : ""}
                setSelected={setBarangay}
                options={barangays}
                optionKey="name"
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
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleSignup}
              >
                <Text style={styles.loginButtonText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signupLink}
                onPress={() => setShowSignup(false)}
              >
                <Text style={styles.signupText}>
                  Already have an account?{" "}
                  <Text style={styles.signupTextBold}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            // 🔹 Login form
            <View style={styles.container}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Login to your account</Text>
              <InputField
                label="Email"
                value={email}
                setValue={setEmail}
                keyboardType="email-address"
              />
              <PasswordField
                label="Password"
                value={password}
                setValue={setPassword}
                visible={passwordVisible}
                setVisible={setPasswordVisible}
              />
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
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Log in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signupLink}
                onPress={() => setShowSignup(true)}
              >
                <Text style={styles.signupText}>
                  Don't have an account?{" "}
                  <Text style={styles.signupTextBold}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </CustomBgColor>
    </PaperProvider>
  );
};

// InputField
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

// PasswordField
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
        <Ionicons name={visible ? "eye-off" : "eye"} size={20} color="#555" />
      </TouchableOpacity>
    </View>
  </View>
);

// DropdownField
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
          <Text style={{ color: selected ? "#3A2E2E" : "#777", fontSize: 16 }}>
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
        />
      ))}
    </Menu>
  </View>
);

// 🔹 Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24 },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 17, fontWeight: "700", color: "#3A2E2E", marginBottom: 6 },
  input: {
    backgroundColor: "#F1E3D3",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#3A2E2E",
    borderWidth: 1,
    borderColor: "#E0D4C3",
    width: "100%",
  },
  passwordWrapper: { position: "relative" },
  eyeIcon: { position: "absolute", right: 16, top: 14, padding: 4 },
  rememberMe: { flexDirection: "row", alignItems: "center" },
  rememberText: { marginLeft: 6, fontSize: 14, color: "#3A2E2E" },
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
    marginTop: 20,
  },
  loginButtonText: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  signupLink: { marginTop: 24, alignItems: "center" },
  signupText: { fontSize: 14, color: "#3A2E2E" },
  signupTextBold: { fontWeight: "700", textDecorationLine: "underline" },
  menuContent: { backgroundColor: "#F1E3D3", borderRadius: 12 },
});

export default SwitchAccount;
