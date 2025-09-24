import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { usePathname } from "expo-router";

const CustomBgColor = ({ children }) => {
  const pathname = usePathname();

  // Default background
  let bgColor = "#F0F1C5";

  // ✅ Only profile index page uses #B6D799
  if (pathname === "/Main/profile" || pathname === "/Main/profile/") {
    bgColor = "#B6D799";
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CustomBgColor;
