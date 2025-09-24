import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { usePathname } from "expo-router";

const CustomBgColor = ({ children, bgColor }) => {
  const pathname = usePathname();

  // Default background
  let defaultBgColor = "#F0F1C5";

  // Only profile page overrides default
  if (pathname === "/Main/profile" || pathname === "/Main/profile/") {
    defaultBgColor = "#B6D799";
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor || defaultBgColor }]}
    >
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
