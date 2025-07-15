import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../components/customBgColor";
import { router } from "expo-router";

const Login = () => {
  return (
    <CustomBgColor>
      <SafeAreaView style={styles.SafeAreaView}>
        <View style={styles.container}>
          <Text>Welcome to the Login Page!</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
  },
  buttonText: {
    marginTop: 20,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#008243",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});

export default Login;
