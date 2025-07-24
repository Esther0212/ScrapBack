import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../components/customBgColor";

const RequestPickup = () => {
  const router = useRouter();

  return (
    <CustomBgColor>
      <SafeAreaProvider>
        <SafeAreaView style={styles.SafeAreaView}>
          <View style={styles.container}>
            <Text>Welcome to the Request for Pickup Page!</Text>

            <Pressable
              style={styles.button}
              onPress={() => router.push("/PickupRequestForm")} // <-- this should match your filename
            >
              <Text style={styles.buttonText}>Go to Full Pickup Form</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RequestPickup;
