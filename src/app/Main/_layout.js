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
        <Tabs.Screen
          name="scanner"
          options={{
            headerShown: true, // show header
            title: "QR Generation", // set title
            headerStyle: {
              backgroundColor: "#FAF3D3", // match background
            },
            headerTitleAlign: "center", // center the title
          }}
        />
        <Tabs.Screen
          name="requestPickup"
          options={{ title: "RequestPickup" }}
        />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </CustomBgColor>
  );
};

export default Layout;
