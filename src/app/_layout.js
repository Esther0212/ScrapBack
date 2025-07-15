import React from "react";
import { Slot } from "expo-router";
import CustomBgColor from "../components/customBgColor";

const Layout = () => {
  return (
    <CustomBgColor>
      <Slot />
    </CustomBgColor>
  );
};
export default Layout;
