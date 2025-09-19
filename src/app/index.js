import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Text,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import pacafacoLogo from '../assets/splash/pacafacoLogo.png';
import upperVector from '../assets/splash/upperVector.png';
import lowerVector from '../assets/splash/lowerVector.png';
import scrap from '../assets/splash/scrap.png';
import back from '../assets/splash/back.png';

const { width, height } = Dimensions.get('window');

const D = 800;
const P = 300;

export default function Splash() {
  const hasSkipped = useRef(false);

  const bg = useRef(new Animated.Value(0)).current;

  const logoOp = useRef(new Animated.Value(0)).current;
  const pacX = useRef(new Animated.Value(0)).current;
const solX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const scrapOp = useRef(new Animated.Value(0)).current;
  const backOp = useRef(new Animated.Value(0)).current;

  const upY = useRef(new Animated.Value(-height)).current;
  const downY = useRef(new Animated.Value(height)).current;

  const scrapX = useRef(new Animated.Value(-width)).current;
  const backX = useRef(new Animated.Value(width)).current;

  const exploreX = useRef(new Animated.Value(-width)).current;
  const descX = useRef(new Animated.Value(width)).current;
  // add these animated values for subtitle/description opacity
  const subtitleOp = useRef(new Animated.Value(0)).current;
  const descOp = useRef(new Animated.Value(0)).current;
  const loginX = useRef(new Animated.Value(-width)).current;
  const signupX = useRef(new Animated.Value(width)).current;

  // text width state
  const [pacWidth, setPacWidth] = useState(0);
  const [solWidth, setSolWidth] = useState(0);

  // when we have both widths, calculate positions + scale
  const [layoutReady, setLayoutReady] = useState(false);
  const pacFinalX = useRef(0);
  const solFinalX = useRef(0);

  useEffect(() => {
    if (pacWidth && solWidth) {
      const GAP = width * 0.1;

      let totalWidth = pacWidth + solWidth + GAP;

      let scale = 1;
      if (totalWidth > width * 0.9) {
        // scale down so it fits within 90% of screen
        scale = (width * 0.9) / totalWidth;
      }

      const scaledPac = pacWidth * scale;
      const scaledSol = solWidth * scale;
      const scaledGap = GAP * scale;

      pacFinalX.current = (width - (scaledPac + scaledSol + scaledGap)) / 2;
      solFinalX.current = pacFinalX.current + scaledPac + scaledGap;

      scaleAnim.setValue(scale);
      setLayoutReady(true);
    }
  }, [pacWidth, solWidth]);

  const playMainAnimations = Animated.parallel([
    Animated.timing(upY, { toValue: 0, duration: D, useNativeDriver: true }),
    Animated.timing(downY, { toValue: 0, duration: D, useNativeDriver: true }),
    Animated.timing(scrapX, { toValue: 0, duration: D, useNativeDriver: true }),
    Animated.timing(backX, { toValue: 0, duration: D, useNativeDriver: true }),
    Animated.timing(scrapOp, {
      toValue: 1,
      duration: D,
      useNativeDriver: true,
    }),
    Animated.timing(backOp, { toValue: 1, duration: D, useNativeDriver: true }),
    Animated.timing(exploreX, {
      toValue: 0,
      duration: D,
      useNativeDriver: true,
    }),
    Animated.timing(descX, { toValue: 0, duration: D, useNativeDriver: true }),
    Animated.timing(loginX, { toValue: 0, duration: D, useNativeDriver: true }),
    Animated.timing(signupX, {
      toValue: 0,
      duration: D,
      useNativeDriver: true,
    }),
    // fade in subtitle & description here
    Animated.timing(subtitleOp, {
      toValue: 1,
      duration: D,
      useNativeDriver: true,
    }),
    Animated.timing(descOp, { toValue: 1, duration: D, useNativeDriver: true }),
  ]);

  const playInitialAnimations = () => {
    if (!layoutReady) return;
    Animated.sequence([
      Animated.delay(P),
      Animated.parallel([
        Animated.timing(logoOp, {
          toValue: 1,
          duration: D,
          useNativeDriver: true,
        }),
        Animated.timing(pacX, {
          toValue: pacFinalX.current,
          duration: D,
          useNativeDriver: true,
        }),
        Animated.timing(solX, {
          toValue: solFinalX.current,
          duration: D,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(P),
      Animated.timing(bg, { toValue: 1, duration: D, useNativeDriver: false }),
      Animated.delay(P),
      Animated.parallel([
        Animated.timing(logoOp, {
          toValue: 0,
          duration: D,
          useNativeDriver: true,
        }),
        Animated.timing(pacX, {
          toValue: -pacWidth * scaleAnim.__getValue(), // push off left
          duration: D,
          useNativeDriver: true,
        }),
        Animated.timing(solX, {
          toValue: width, // push off right
          duration: D,
          useNativeDriver: true,
        }),
      ]),      
      Animated.delay(P),
      playMainAnimations,
    ]).start();
  };

  const handleSkip = () => {
    if (hasSkipped.current) return;
    hasSkipped.current = true;

    bg.setValue(1);

    Animated.parallel([
      Animated.timing(logoOp, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pacX, {
        toValue: -width,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(solX, {
        toValue: width,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      playMainAnimations.start();
    });
  };

  useEffect(() => {
    if (layoutReady) {
      playInitialAnimations();
    }
  }, [layoutReady]);

  const backgroundColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F5FFED', '#B6D799'],
  });

  // inside Splash.js
  useEffect(() => {
    if (pacWidth && solWidth) {
      const GAP = Math.max(20, Math.min(width * 0.03, 40));
  
      let totalWidth = pacWidth + solWidth + GAP;
      let scale = 1;
      const maxAvailable = width * 0.9;
  
      if (totalWidth > maxAvailable) {
        scale = maxAvailable / totalWidth;
      }
  
      const scaledPac = pacWidth * scale;
      const scaledSol = solWidth * scale;
      const scaledGap = GAP * scale;
  
      pacFinalX.current = (width - (scaledPac + scaledSol + scaledGap)) / 2;
      solFinalX.current = pacFinalX.current + scaledPac + scaledGap;
  
      // ✅ reset starting positions OFFSCREEN
      pacX.setValue(-scaledPac); // just off left
      solX.setValue(width);      // just off right
  
      scaleAnim.setValue(scale);
      setLayoutReady(true);
    }
  }, [pacWidth, solWidth]);  

  return (
    <TouchableWithoutFeedback onPress={handleSkip}>
      <Animated.View style={[styles.container, { backgroundColor }]}>
        <Animated.Image
          source={pacafacoLogo}
          style={[styles.pacLogo, { opacity: logoOp }]}
          resizeMode="contain"
        />

        {/* Hidden measure texts */}
        <Text
          style={[styles.bigText, { position: 'absolute', opacity: 0 }]}
          onLayout={(e) => setPacWidth(e.nativeEvent.layout.width)}>
          PACAFACO
        </Text>
        <Text
          style={[styles.bigText, { position: 'absolute', opacity: 0 }]}
          onLayout={(e) => setSolWidth(e.nativeEvent.layout.width)}>
          Solutions
        </Text>

        {/* Animated PACAFACO */}
        <Animated.Text
          style={[
            styles.bigText,
            {
              transform: [{ translateX: pacX }, { scale: scaleAnim }],
              opacity: logoOp,
            },
          ]}>
          PACAFACO
        </Animated.Text>

        <Animated.Text
          style={[
            styles.bigText,
            {
              transform: [{ translateX: solX }, { scale: scaleAnim }],
              opacity: logoOp,
            },
          ]}>
          Solutions
        </Animated.Text>

        {/* rest of your splash layout unchanged */}
        <Animated.Image
          source={upperVector}
          style={[styles.upperVector, { transform: [{ translateY: upY }] }]}
          resizeMode="contain"
        />
        <Animated.Image
          source={lowerVector}
          style={[styles.lowerVector, { transform: [{ translateY: downY }] }]}
          resizeMode="contain"
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.logoRow}>
              <Animated.Image
                source={scrap}
                style={[
                  styles.scrapImg,
                  {
                    transform: [{ translateX: scrapX }],
                    opacity: scrapOp,
                  },
                ]}
                resizeMode="contain"
              />
              <Animated.Image
                source={back}
                style={[
                  styles.backImg,
                  {
                    transform: [{ translateX: backX }],
                    opacity: backOp,
                  },
                ]}
                resizeMode="contain"
              />
            </View>

            <Animated.Text
              style={[
                styles.subtitle,
                {
                  transform: [{ translateX: exploreX }],
                  opacity: subtitleOp, // initially 0
                },
              ]}>
              Explore the app
            </Animated.Text>

            <Animated.Text
              style={[
                styles.description,
                {
                  transform: [{ translateX: descX }],
                  opacity: descOp, // initially 0
                },
              ]}>
              All your recyclables in one place,
              {'\n'}rewarding you every step of the way.
            </Animated.Text>

            <Animated.View style={{ transform: [{ translateX: loginX }] }}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/login')}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ translateX: signupX }] }}>
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => router.push('/signup')}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  pacLogo: {
    position: 'absolute',
    top: height / 2 - 80,
    left: width / 2 - 80,
    width: 160,
    height: 160,
    zIndex: 5,
  },
  bigText: {
    position: 'absolute',
    top: height / 2 + 90,
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#3A2E2E',
    zIndex: 5,
  },

  upperVector: {
    position: 'absolute',
    top: 0,
    width: width,
    height: (119 / 391) * width,
    zIndex: 1,
    alignSelf: 'center',
  },
  lowerVector: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: (482 / 393) * width,
    zIndex: 1,
    alignSelf: 'center',
  },

  safeArea: { flex: 1, zIndex: 4 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  logoRow: {
    height: (60 / 160) * (width * 0.45),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 110,
    position: 'relative',
  },
  scrapImg: {
    position: 'absolute',
    left: width * -0.37,
    alignSelf: 'center',
    width: width * 0.45,
    height: (60 / 160) * (width * 0.45),
    zIndex: 1,
  },
  backImg: {
    position: 'absolute',
    left: width * 0.03 + -8.5,
    top: height * 0.03 + 5,
    width: width * 0.33,
    height: (60 / 117) * (width * 0.33),
    zIndex: 2,
  },

  subtitle: {
    fontSize: 35,
    fontFamily: 'Poppins_700Bold',
    color: '#3A2E2E',
    textAlign: 'center',
    marginTop: 210,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 18,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 26,
    marginVertical: 16,
    letterSpacing: 0.3,
    fontFamily: 'Poppins_400Regular',
  },

  loginButton: {
    backgroundColor: '#008243',
    paddingVertical: 16,
    width: width - 50,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  signUpButton: {
    borderWidth: 1.5,
    borderColor: '#008243',
    paddingVertical: 16,
    width: width - 50,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  signUpButtonText: {
    color: '#008243',
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
