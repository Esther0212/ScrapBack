import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  ToastAndroid,
  Modal,
  Pressable,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase";

import CustomBgColor from "../components/customBgColor";
import { Provider as PaperProvider } from "react-native-paper";
import Checkbox from "react-native-paper/lib/commonjs/components/Checkbox/Checkbox";

import DateTimePickerModal from "react-native-modal-datetime-picker";

import MapView, { Marker, Polygon, Polyline } from "react-native-maps";
import * as Location from "expo-location";

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

// NAMRIA polygons
import cdoGeoJSON from "../utils/cdo_barangays.json";

// Screen width
const { width } = Dimensions.get("window");

/* ------------------------------------------------
   NORMALIZE BARANGAY NAME (remove (Pob.), spacing)
-------------------------------------------------- */
const normalizeBrgyName = (name) =>
  name
    ?.toLowerCase()
    .replace(/\s*\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .trim() || "";

/* ------------------------------------------------
   SIGNUP SCREEN
-------------------------------------------------- */
const Signup = () => {
  /* ----------------------------
     BASIC SIGNUP STATES
  ----------------------------- */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [gender, setGender] = useState("");
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);

  const [dob, setDob] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [loading, setLoading] = useState(false);

  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /* ----------------------------
     ADDRESS SYSTEM STATES
  ----------------------------- */

  const [street, setStreet] = useState("");
  const [streetHeight, setStreetHeight] = useState(55);
  const [streetDebounceTimer, setStreetDebounceTimer] = useState(null);
  const [streetReady, setStreetReady] = useState(false);

  const [barangays, setBarangays] = useState([]);
  const [barangayMenuVisible, setBarangayMenuVisible] = useState(false);
  const [barangay, setBarangay] = useState(null);

  const [selectedBarangayFeature, setSelectedBarangayFeature] = useState(null);
  const [barangayPolygonCoords, setBarangayPolygonCoords] = useState([]);
  const [barangayCenter, setBarangayCenter] = useState(null);

  const [mapRegion, setMapRegion] = useState(null);
  const [marker, setMarker] = useState(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [validationTriggered, setValidationTriggered] = useState(false);

  /* ----------------------------
     LOCAL STATES FOR PASSWORD VISIBILITY
  ----------------------------- */
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Default map center (Cagayan de Oro) when no barangay/street yet
  useEffect(() => {
    if (!mapRegion) {
      setMapRegion({
        latitude: 8.4542, // CDO center
        longitude: 124.6319,
        latitudeDelta: 0.0025,
        longitudeDelta: 0.0025,
      });
    }
  }, []);

  /* ----------------------------
     LOCATION PERMISSION HELPER
  ----------------------------- */
  const ensureLocationPermission = async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const res = await Location.requestForegroundPermissionsAsync();
        status = res.status;
      }

      if (status !== "granted") {
        if (Platform.OS === "android") {
          ToastAndroid.show(
            "Please enable location permission to validate your address.",
            ToastAndroid.LONG
          );
        } else {
          // On iOS you might want an Alert instead
          console.log(
            "Location permission not granted. Please enable it in Settings."
          );
        }
        return false;
      }

      return true;
    } catch (err) {
      console.log("Permission check error:", err);
      return false;
    }
  };

  /* ----------------------------
     LOAD NAMRIA BARANGAYS
  ----------------------------- */
  useEffect(() => {
    if (cdoGeoJSON?.features?.length) {
      const uniqueNames = Array.from(
        new Set(
          cdoGeoJSON.features.map((f) => f.properties?.barangay).filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));

      const list = uniqueNames.map((name) => ({ name }));
      setBarangays(list);
    }
  }, []);

  /* ----------------------------
     HANDLE BARANGAY SELECTION
  ----------------------------- */
  useEffect(() => {
    const applySelection = async () => {
      if (!barangay?.name) {
        setSelectedBarangayFeature(null);
        setBarangayPolygonCoords([]);
        return;
      }

      const selectedNameNorm = normalizeBrgyName(barangay.name);

      // find feature
      const feature = cdoGeoJSON.features.find((f) => {
        const n = normalizeBrgyName(f.properties?.barangay || "");
        return n === selectedNameNorm;
      });

      setSelectedBarangayFeature(feature || null);

      /* Extract polygon */
      if (feature?.geometry?.coordinates) {
        let ring = [];

        if (feature.geometry.type === "Polygon") {
          ring = feature.geometry.coordinates[0] || [];
        } else if (feature.geometry.type === "MultiPolygon") {
          let maxLen = 0;
          feature.geometry.coordinates.forEach((poly) => {
            if (poly[0]?.length > maxLen) {
              maxLen = poly[0].length;
              ring = poly[0];
            }
          });
        }

        let closedRing = [...ring];
        if (
          closedRing.length > 0 &&
          (closedRing[0][0] !== closedRing[closedRing.length - 1][0] ||
            closedRing[0][1] !== closedRing[closedRing.length - 1][1])
        ) {
          closedRing.push(closedRing[0]);
        }

        const coords = closedRing.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));

        setBarangayPolygonCoords(coords);
      } else {
        setBarangayPolygonCoords([]);
      }

      /* Geocode barangay center */
      try {
        const hasPerm = await ensureLocationPermission();
        if (!hasPerm) return;

        const geo = await Location.geocodeAsync(
          `${barangay.name}, Cagayan de Oro City, Philippines`
        );
        if (geo && geo.length > 0) {
          const { latitude, longitude } = geo[0];
          setBarangayCenter({ latitude, longitude });
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.0025,
            longitudeDelta: 0.0025,
          });
        }
      } catch (err) {
        console.log("Barangay geocode error:", err);
      }
    };

    applySelection();
  }, [barangay]);

  /* ----------------------------
     STREET DEBOUNCE
  ----------------------------- */
  useEffect(() => {
    setStreetReady(false);

    if (!barangay?.name || !street.trim()) return;

    if (streetDebounceTimer) clearTimeout(streetDebounceTimer);

    const t = setTimeout(() => {
      setStreetReady(true);
      setValidationTriggered(true);
    }, 700);

    setStreetDebounceTimer(t);

    return () => clearTimeout(t);
  }, [street]);

  /* ----------------------------
     CHECK IF POINT IS INSIDE POLYGON
  ----------------------------- */
  const isInsideSelectedBarangay = (lat, lng, overrideFeat) => {
    const feat = overrideFeat || selectedBarangayFeature;
    if (!feat || !feat.geometry) return true;

    const pt = point([lng, lat]);
    try {
      return booleanPointInPolygon(pt, feat);
    } catch {
      return true;
    }
  };

  /* ----------------------------
     STREET GEOCODING + VALIDATION
  ----------------------------- */
  useEffect(() => {
    const runGeocode = async () => {
      if (
        !barangay?.name ||
        !selectedBarangayFeature ||
        !street.trim() ||
        !streetReady
      )
        return;

      try {
        const hasPerm = await ensureLocationPermission();
        if (!hasPerm) return;

        // Try street + barangay
        let addr = `${street}, ${barangay.name}, Cagayan de Oro City, Philippines`;
        let geo = await Location.geocodeAsync(addr);

        // Try street only
        if (!geo || geo.length === 0) {
          addr = `${street}, Cagayan de Oro City, Philippines`;
          geo = await Location.geocodeAsync(addr);
        }

        // Fallback to barangay
        if (!geo || geo.length === 0) {
          if (barangayCenter) {
            setMapRegion({
              latitude: barangayCenter.latitude,
              longitude: barangayCenter.longitude,
              latitudeDelta: 0.0025,
              longitudeDelta: 0.0025,
            });
          }
          return;
        }

        const { latitude, longitude } = geo[0];

        const inside = isInsideSelectedBarangay(
          latitude,
          longitude,
          selectedBarangayFeature
        );

        // Street outside polygon → revert to barangay center
        if (!inside) {
          if (barangayCenter) {
            setMapRegion({
              latitude: barangayCenter.latitude,
              longitude: barangayCenter.longitude,
              latitudeDelta: 0.0025,
              longitudeDelta: 0.0025,
            });
          }
          return;
        }

        // Valid street → center map (no marker yet)
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0025,
          longitudeDelta: 0.0025,
        });
      } catch (err) {
        console.log("Street geocode error:", err);
      }
    };

    runGeocode();
  }, [streetReady, barangay, selectedBarangayFeature]);

  /* ----------------------------
     PASSWORD VALIDATION
  ----------------------------- */
  const [passwordError, setPasswordError] = useState("");

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

  /* ----------------------------
     SIGNUP HANDLER
  ----------------------------- */
  const handleSignup = async () => {
    // Privacy required
    if (!privacyChecked) {
      setPrivacyError(true);
      ToastAndroid.show(
        "Please agree to the privacy policy to proceed.",
        ToastAndroid.SHORT
      );
      return;
    }

    // DOB required
    if (!dob) {
      ToastAndroid.show(
        "Please select your date of birth.",
        ToastAndroid.SHORT
      );
      return;
    }

    // Age check (18+)
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

    if (age < 13) {
      ToastAndroid.show(
        `You must be 13 or older to sign up. Your age is ${age}.`,
        ToastAndroid.LONG
      );
      return;
    }

    // Required fields
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
      !barangay
    ) {
      ToastAndroid.show(
        "Please fill in all required fields.",
        ToastAndroid.SHORT
      );
      return;
    }

    // Password match
    if (password !== confirmPassword) {
      ToastAndroid.show("Passwords do not match.", ToastAndroid.SHORT);
      return;
    }

    // Strong password
    const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPass.test(password)) {
      ToastAndroid.show(
        "Password must be at least 8 characters, include uppercase, lowercase, and number.",
        ToastAndroid.LONG
      );
      return;
    }

    // Phone number format
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(contact)) {
      ToastAndroid.show(
        "Please enter a valid phone number.",
        ToastAndroid.LONG
      );
      return;
    }

    // Require map pinpoint
    if (!marker) {
      ToastAndroid.show(
        "Please tap the map to pinpoint your exact location.",
        ToastAndroid.LONG
      );
      return;
    }

    try {
      setLoading(true);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Fixed location metadata
      const region = "Northern Mindanao";
      const province = "Misamis Oriental";
      const city = "City of Cagayan De Oro";
      const postalCode = "9000";

      // Save user document to Firestore
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
          region,
          province,
          city,
          barangay: barangay?.name || "",
          postalCode,
        },
        location: {
          lat: marker.latitude,
          lng: marker.longitude,
        },
        createdAt: new Date(),
        points: 0,
        online: false,
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Signup Error:", error);

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

  /* ----------------------------
     UI RENDER
  ----------------------------- */
  return (
    <PaperProvider>
      <CustomBgColor>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.container}>
              <Text style={styles.title}>Sign up to earn points!</Text>
              <Text style={styles.subtitle}>
                Create your ScrapBack account now
              </Text>

              {/* FIRST & LAST NAME */}
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

              {/* EMAIL */}
              <InputField
                label="Email"
                value={email}
                setValue={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* CONTACT */}
              <InputField
                label="Contact Number"
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
              />

              {/* PASSWORD */}
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

              {/* CONFIRM PASSWORD */}
              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                setValue={setConfirmPassword}
                visible={confirmPasswordVisible}
                setVisible={setConfirmPasswordVisible}
              />

              {/* GENDER DROPDOWN */}
              <DropdownField
                label="Gender"
                visible={genderMenuVisible}
                setVisible={setGenderMenuVisible}
                selected={gender}
                setSelected={setGender}
                options={["Male", "Female", "Other"]}
              />

              {/* DATE OF BIRTH */}
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
                  maximumDate={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 13)
                    )
                  }
                  onConfirm={(date) => {
                    setDob(date.toISOString());
                    setDatePickerVisible(false);
                  }}
                  onCancel={() => setDatePickerVisible(false)}
                />
              </View>

              {/* ADDRESS SECTION */}
              <Text style={styles.label}>Address</Text>

              {/* STREET */}
              <InputField
                label="Describe Your Exact Location"
                value={street}
                setValue={(value) => {
                  setStreet(value);
                  setMarker(null); // changing street resets marker
                  setValidationTriggered(false);
                  setStreetReady(false);
                }}
                subLabel
                multiline
                dynamicHeight={streetHeight}
                onHeightChange={setStreetHeight}
                placeholder="(street, house no., building, landmarks, directions, etc.)"
              />

              {/* BARANGAY DROPDOWN (NAMRIA) */}
              <DropdownField
                label="Barangay"
                visible={barangayMenuVisible}
                setVisible={setBarangayMenuVisible}
                selected={barangay ? barangay.name : ""}
                setSelected={(item) => {
                  setBarangay(item);
                  setMarker(null);
                  if (street.trim()) {
                    setValidationTriggered(true);
                    setStreetReady(true);
                  } else {
                    setValidationTriggered(false);
                    setStreetReady(false);
                  }
                }}
                options={barangays}
                optionKey="name"
                subLabel
              />

              {/* CITY */}
              <InputField
                label="City"
                value="City of Cagayan De Oro"
                setValue={() => {}}
                editable={false}
                subLabel
              />

              {/* REGION */}
              <InputField
                label="Region"
                value="Northern Mindanao"
                setValue={() => {}}
                editable={false}
                subLabel
              />

              {/* PROVINCE */}
              <InputField
                label="Province"
                value="Misamis Oriental"
                setValue={() => {}}
                editable={false}
                subLabel
              />

              {/* POSTAL CODE */}
              <InputField
                label="Postal Code"
                value="9000"
                setValue={() => {}}
                editable={false}
                subLabel
              />

              {/* MAP SECTION */}
              <Text style={styles.subLabel}>Pinpoint Specific Location</Text>
              <View style={styles.mapContainer}>
                {mapRegion && (
                  <>
                    <MapView
                      style={styles.map}
                      region={mapRegion}
                      mapType={isSatellite ? "hybrid" : "standard"}
                      onPress={async (e) => {
                        const { latitude, longitude } =
                          e.nativeEvent.coordinate;

                        const isInside =
                          selectedBarangayFeature &&
                          isInsideSelectedBarangay(
                            latitude,
                            longitude,
                            selectedBarangayFeature
                          );

                        if (!isInside) {
                          ToastAndroid.show(
                            "Pin is outside the selected barangay. Please double-check your address.",
                            ToastAndroid.LONG
                          );

                          // ✅ Always allow pin placement
                          setMarker({ latitude, longitude });
                          setMapRegion((prev) => ({
                            ...(prev || {}),
                            latitude,
                            longitude,
                            latitudeDelta: prev?.latitudeDelta,
                            longitudeDelta: prev?.longitudeDelta,
                          }));

                          return;
                        }

                        setMarker({ latitude, longitude });
                        setMapRegion((prev) => ({
                          ...(prev || {}),
                          latitude,
                          longitude,
                          latitudeDelta: prev?.latitudeDelta,
                          longitudeDelta: prev?.longitudeDelta,
                        }));
                      }}
                    >
                      {/* Hidden polygon for geometry */}
                      {barangayPolygonCoords.length > 0 && (
                        <Polygon
                          coordinates={barangayPolygonCoords}
                          strokeColor="transparent"
                          fillColor="transparent"
                          strokeWidth={0}
                        />
                      )}

                      {/* Visible dotted outline */}
                      {barangayPolygonCoords.length > 0 && (
                        <Polyline
                          coordinates={barangayPolygonCoords}
                          strokeColor="#E85C4F"
                          strokeWidth={2}
                          lineDashPattern={[1, 1]}
                        />
                      )}

                      {/* Marker */}
                      {marker && (
                        <Marker
                          coordinate={marker}
                          draggable
                          onDragEnd={(e) => {
                            const { latitude, longitude } =
                              e.nativeEvent.coordinate;

                            const isInside =
                              selectedBarangayFeature &&
                              isInsideSelectedBarangay(
                                latitude,
                                longitude,
                                selectedBarangayFeature
                              );

                            if (!isInside) {
                              ToastAndroid.show(
                                "Pin is outside the selected barangay. Make sure this is correct.",
                                ToastAndroid.LONG
                              );

                              // ✅ Keep pin wherever the user dropped it
                              setMarker({ latitude, longitude });
                              setMapRegion((prev) => ({
                                ...(prev || {}),
                                latitude,
                                longitude,
                                latitudeDelta: prev?.latitudeDelta,
                                longitudeDelta: prev?.longitudeDelta,
                              }));

                              return;
                            }

                            setMarker({ latitude, longitude });
                            setMapRegion((prev) => ({
                              ...(prev || {}),
                              latitude,
                              longitude,
                              latitudeDelta: prev?.latitudeDelta,
                              longitudeDelta: prev?.longitudeDelta,
                            }));
                          }}
                        />
                      )}
                    </MapView>

                    {/* MAP TYPE TOGGLE */}
                    <TouchableOpacity
                      style={styles.mapToggleButton}
                      onPress={() => setIsSatellite(!isSatellite)}
                    >
                      <FontAwesome
                        name={isSatellite ? "map" : "map-o"}
                        size={24}
                        color="black"
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* PRIVACY CHECKBOX */}
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
                      onPress={() => setShowPrivacyModal(true)}
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

              {/* SIGN UP BUTTON */}
              <TouchableOpacity
                style={[styles.signupButton, { opacity: loading ? 0.6 : 1 }]}
                activeOpacity={0.85}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.signupButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              {/* LOGIN LINK */}
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

            {/* PRIVACY POLICY MODAL */}
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

            {/* SUCCESS MODAL */}
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
                      Please check your{" "}
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#333",
                          fontFamily: "Poppins_700Bold",
                          lineHeight: 22,
                        }}
                      >
                        spam
                      </Text>{" "}
                      and verify your account before logging in.
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

/* ---------------------------------------------
   CUSTOM INPUT FIELD (AccountInfo Style but beige)
---------------------------------------------- */
const InputField = ({
  label,
  value,
  setValue,
  keyboardType,
  containerStyle,
  subLabel,
  multiline = false,
  dynamicHeight,
  onHeightChange,
  placeholder,
  editable = true,
  autoCapitalize = "sentences",
}) => (
  <View style={[styles.inputContainer, containerStyle]}>
    <Text style={subLabel ? styles.subLabel : styles.label}>{label}</Text>
    <TextInput
      value={value}
      editable={editable}
      onChangeText={setValue}
      placeholder={placeholder || label}
      placeholderTextColor="#777"
      multiline={multiline}
      autoCapitalize={autoCapitalize}
      blurOnSubmit={true} // ← KEEP DONE BUTTON
      returnKeyType="done" // ← SHOW DONE BUTTON
      onSubmitEditing={() => Keyboard.dismiss()} // ← CLOSE KEYBOARD
      onContentSizeChange={(e) => {
        if (multiline && onHeightChange) {
          const newHeight = e.nativeEvent.contentSize.height;
          onHeightChange(Math.max(55, Math.min(newHeight, 160)));
        }
      }}
      style={[
        styles.input,
        {
          height: multiline ? dynamicHeight : 55,
          textAlignVertical: multiline ? "center" : "center",
        },
      ]}
      keyboardType={keyboardType || "default"}
    />
  </View>
);

/* ---------------------------------------------
   CUSTOM DROPDOWN (AccountInfo Style)
---------------------------------------------- */
const DropdownField = ({
  label,
  visible,
  setVisible,
  selected,
  setSelected,
  options,
  optionKey,
  subLabel,
  editable = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions =
    label === "Barangay" && searchQuery
      ? options.filter((item) =>
          (optionKey ? item[optionKey] : item.name || item)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      : options;

  return (
    <View style={[styles.inputContainer, { zIndex: 1000 }]}>
      <Text style={subLabel ? styles.subLabel : styles.label}>{label}</Text>

      {/* Button */}
      <TouchableOpacity
        style={[
          styles.input,
          { flexDirection: "row", justifyContent: "space-between" },
        ]}
        onPress={() => editable && setVisible(!visible)}
        disabled={!editable}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: editable ? (selected ? "#3A2E2E" : "#777") : "#777",
            fontSize: 15,
            fontFamily: "Poppins_400Regular",
          }}
        >
          {selected || `Select ${label}`}
        </Text>
        {editable && (
          <Text style={{ color: "#3A2E2E", fontSize: 16 }}>
            {visible ? "▲" : "▼"}
          </Text>
        )}
      </TouchableOpacity>

      {/* Dropdown menu */}
      {visible && editable && (
        <View style={styles.dropdownContainer}>
          {/* Search */}
          {label === "Barangay" && (
            <TextInput
              placeholder="Search barangay..."
              placeholderTextColor="#3A2E2E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          )}

          <ScrollView
            style={styles.dropdownList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    index !== filteredOptions.length - 1 &&
                      styles.dropdownItemBorder,
                  ]}
                  onPress={() => {
                    setSelected(optionKey ? item : item.name || item);
                    setVisible(false);
                    setSearchQuery("");
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {optionKey ? item[optionKey] : item.name || item}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noResultText}>No results found</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

/* ----------------------------
     PASSWORD FIELD COMPONENT
  ----------------------------- */
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
        autoCorrect={false}
        autoCapitalize="none"
        importantForAutofill="no"
        contextMenuHidden={true} // hides copy/paste menu
        editable={true}
        selectTextOnFocus={false} // prevents selecting/pasting
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

/* -----------------------------------------------------------
   STYLES
----------------------------------------------------------- */
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
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0D4C3",
    marginTop: 4,
    zIndex: 1000,
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 10,
    maxHeight: 230,
    zIndex: 1000,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5D6C7",
  },
  searchInput: {
    backgroundColor: "#F6F6E9",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
    margin: 8,
    borderWidth: 1,
    borderColor: "#E0D4C3",
  },
  noResultText: {
    textAlign: "center",
    color: "#777",
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    paddingVertical: 10,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#3A2E2E",
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
  // Map styles
  mapContainer: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0D4C3",
    height: 300,
    position: "relative",
    marginBottom: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapToggleButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    zIndex: 5,
  },
  // Modals
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