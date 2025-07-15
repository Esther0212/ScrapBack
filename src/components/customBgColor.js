import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

const CustomBgColor = ({ children }) => {
  return <SafeAreaView style={styles.container}>{children}</SafeAreaView>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F1C5', // Global background color
  },
});

export default CustomBgColor;