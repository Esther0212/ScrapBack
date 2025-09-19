import React from "react";
import { Tabs } from "expo-router";
import CustomBgColor from "../../components/customBgColor";
import CustomTabBar from "../../components/customTabBar";

const Layout = () => {
  return (
    <CustomBgColor>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="map" options={{ title: "Map" }} />
        <Tabs.Screen name="scanner" options={{ title: "QR Generation" }} />
        <Tabs.Screen name="requestPickup" options={{ title: "RequestPickup" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </CustomBgColor>
  );
};

export default Layout;
