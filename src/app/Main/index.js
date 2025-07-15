import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../components/customBgColor"; // Adjust path as needed

const Home = () => {
  return (
    <CustomBgColor>
      <SafeAreaView style={styles.SafeAreaView}>
        <View style={styles.container}>
          <Text>Welcome to the Home Page!</Text>
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
  },
});

export default Home;
