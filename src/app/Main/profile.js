import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../../components/customBgColor";

const Profile = () => {
  return (
    <CustomBgColor>
      <SafeAreaProvider>
        <SafeAreaView style={styles.SafeAreaView}>
          <View style={styles.container}>
            <Text>Welcome to the Profile Page!</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </CustomBgColor>
  );
}

const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
export default Profile;