import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icons } from "./Icons";

const tabIcons = {
  index: { Icon: Icons.Octicons, name: "home" },
  map: { Icon: Icons.Octicons, name: "location" },
  scanner: { Icon: Icons.MaterialCommunityIcons, name: "line-scan" },
  requestPickup: { Icon: Icons.Feather, name: "truck" },
  profile: { Icon: Icons.FontAwesome5, name: "user-circle" },
};

const ROOT_TABS = ["index", "map", "scanner", "requestPickup", "profile"];

// --------------------------------------------------------
// Detect if Android navbar is buttons-style (Expo safe)
// --------------------------------------------------------
const getExtraNavPadding = (insets) => {
  if (Platform.OS !== "android") return 0;

  // gestures usually give 15–22 bottomInset
  // button navbar gives 0–6 bottomInset
  if (insets.bottom < 10) {
    return 35; // compensate for button navbar height
  }

  return 0; // gestures, no extra padding
};

// --------------------------------------------------------
const CustomTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index];

  if (!ROOT_TABS.includes(currentRoute.name)) {
    return null;
  }

  const [screen, setScreen] = useState(Dimensions.get("window"));
  const { width } = screen;

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) =>
      setScreen(window)
    );
    return () => subscription?.remove();
  }, []);

  // Dynamic navbar compensation (Expo safe)
  const extraNavPadding = getExtraNavPadding(insets);

  const spacedIcons = ROOT_TABS;
  const tabWidth = width / spacedIcons.length;

  const translateX = useRef(new Animated.Value(0)).current;
  const prevIndexRef = useRef(state.index);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isScannerTab = currentRoute.name === "scanner";

  useEffect(() => {
    if (!isScannerTab) {
      const fromKey = state.routes[prevIndexRef.current].name;
      const toKey = currentRoute.name;

      const fromIndex = spacedIcons.indexOf(fromKey);
      const toIndex = spacedIcons.indexOf(toKey);

      if (toIndex !== -1) {
        translateX.setValue(fromIndex * tabWidth);
        Animated.spring(translateX, {
          toValue: toIndex * tabWidth,
          useNativeDriver: true,
          bounciness: 10,
        }).start();
      }
    }

    Animated.spring(scaleAnim, {
      toValue: isScannerTab ? 1.15 : 1,
      useNativeDriver: true,
      friction: 4,
    }).start();

    prevIndexRef.current = state.index;
  }, [state.index]);

  const scannerSize = 70;

  const bottomPadding = insets.bottom + extraNavPadding;
  const totalHeight = 50 + bottomPadding;

  return (
    <View style={[styles.tabContainer, { height: totalHeight, paddingBottom: bottomPadding }]}>

      {!isScannerTab &&
        (() => {
          const { Icon, name } = tabIcons[currentRoute.name] || {};
          const indexInSpaced = spacedIcons.indexOf(currentRoute.name);
          if (indexInSpaced === -1) return null;

          return (
            <Animated.View
              style={[
                styles.slider,
                {
                  width: tabWidth * 0.6,
                  left: tabWidth * 0.2,
                  transform: [{ translateX }],
                },
              ]}
            >
              <View style={styles.iconContainer}>
                {Icon && name && <Icon name={name} size={24} color="#90C67C" />}
              </View>
            </Animated.View>
          );
        })()}

      <View style={[styles.group, { width: tabWidth * 2 }]}>
        {["index", "map"].map((key) => {
          const route = state.routes.find((r) => r.name === key);
          if (!route) return null;

          const isFocused = state.index === state.routes.indexOf(route);
          const { Icon, name } = tabIcons[route.name];

          return (
            <TouchableWithoutFeedback
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
            >
              <View style={styles.tabItem}>
                {!isFocused && <Icon name={name} size={24} color="#90C67C" />}
              </View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>

      <View style={[styles.group, { width: tabWidth * 2 }]}>
        {["requestPickup", "profile"].map((key) => {
          const route = state.routes.find((r) => r.name === key);
          if (!route) return null;

          const isFocused = state.index === state.routes.indexOf(route);
          const { Icon, name } = tabIcons[route.name];

          return (
            <TouchableWithoutFeedback
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
            >
              <View style={styles.tabItem}>
                {!isFocused && <Icon name={name} size={24} color="#90C67C" />}
              </View>
            </TouchableWithoutFeedback>
          );
        })}
      </View>

      {(() => {
        const route = state.routes.find((r) => r.name === "scanner");
        if (!route) return null;

        const { Icon, name } = tabIcons["scanner"];
        const isFocused = state.index === state.routes.indexOf(route);

        return (
          <TouchableWithoutFeedback key={route.key} onPress={() => navigation.navigate("scanner")}>
            <Animated.View
              style={[
                styles.scannerWrapper,
                { left: width / 2 - scannerSize / 2, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <View
                style={[
                  styles.scannerCircle,
                  { width: scannerSize, height: scannerSize },
                ]}
              >
                <Icon name={name} size={28} color="#90C67C" />
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        );
      })()}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#008243",
    alignItems: "center",
    position: "relative",
    justifyContent: "space-between",
  },
  group: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    top: 5,
    zIndex: 1,
    flex: 1,
  },
  slider: {
    position: "absolute",
    backgroundColor: "#339B69",
    paddingVertical: 5,
    borderRadius: 20,
    top: 12,
    zIndex: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  scannerWrapper: {
    position: "absolute",
    top: -25,
    zIndex: 10,
  },
  scannerCircle: {
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default CustomTabBar;
