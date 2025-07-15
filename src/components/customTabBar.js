import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icons } from './Icons';

const tabIcons = {
  index: { Icon: Icons.Octicons, name: 'home' },
  map: { Icon: Icons.Octicons, name: 'location' },
  scanner: { Icon: Icons.MaterialCommunityIcons, name: 'line-scan' },
  requestPickup: { Icon: Icons.Feather, name: 'truck' },
  profile: { Icon: Icons.FontAwesome5, name: 'user-circle' },
};

const CustomTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  const tabWidth = width / state.routes.length;

  const translateX = useRef(new Animated.Value(0)).current;
  const prevIndexRef = useRef(state.index);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentRoute = state.routes[state.index];
  const previousRoute = state.routes[prevIndexRef.current];

  const isScannerTab = currentRoute.name === 'scanner';
  const wasScannerTab = previousRoute.name === 'scanner';

  // Animate slider (non-scanner)
  useEffect(() => {
    if (!isScannerTab) {
      const fromIndex = wasScannerTab
        ? state.routes.findIndex((r) => r.name === 'scanner')
        : prevIndexRef.current;
      const toValue = state.index * tabWidth;

      translateX.setValue(fromIndex * tabWidth);

      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        bounciness: 10,
      }).start();
    }

    // Animate scanner scale
    if (isScannerTab) {
      Animated.spring(scaleAnim, {
        toValue: 1.15,
        useNativeDriver: true,
        friction: 4,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }).start();
    }

    prevIndexRef.current = state.index;
  }, [state.index]);

  return (
    <View style={[styles.tabContainer, { paddingBottom: insets.bottom }]}>
      {/* Oval slider - hidden when scanner is selected */}
      {!isScannerTab && (() => {
        const { Icon, name } = tabIcons[currentRoute.name] || {};
        return (
          <Animated.View
            style={[
              styles.slider,
              {
                width: tabWidth * 0.7,
                transform: [{ translateX }],
                left: tabWidth * 0.2,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              {Icon && name && (
                <Icon name={name} size={24} color="#90C67C" />
              )}
            </View>
          </Animated.View>
        );
      })()}

      {/* Tab icons */}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { Icon, name } = tabIcons[route.name] || {};
        if (!Icon || !name) return null;

        const isScanner = route.name === 'scanner';
        const color = isFocused ? 'transparent' : '#90C67C';

        return (
          <TouchableWithoutFeedback
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          >
            <View style={[styles.tabItem, { width: tabWidth }]}>
              {isScanner ? (
                <Animated.View style={[styles.scannerWrapper, { transform: [{ scale: scaleAnim }] }]}>
                  <View style={styles.scannerCircle}>
                    <Icon name={name} size={28} color="#90C67C" />
                  </View>
                </Animated.View>
              ) : (
                !isFocused && (
                  <View>
                    <Icon name={name} size={24} color={color} />
                  </View>
                )
              )}
            </View>
          </TouchableWithoutFeedback>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#008243',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    position: 'relative',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    top: 5,
    zIndex: 1,
  },
  slider: {
    position: 'absolute',
    backgroundColor: '#339B69',
    paddingVertical: 5,
    borderRadius: 20,
    top: 15,
    zIndex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  scannerWrapper: {
    position: 'absolute',
    top: -50,
    zIndex: 10,
  },
  scannerCircle: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default CustomTabBar;
