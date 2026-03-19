import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, Animated } from "react-native";
import LottieView from "lottie-react-native";
import Matrics from "../../config/appStyling/matrics";
import colors from "../../config/appStyling/colors";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";

interface FullPageLoaderProps {
  size?: number;
  showAnimatedText?: boolean;
}

const TEXT_PAIRS = [
  {
    line1: "Reading conversation context…",
    line2: "Mapping emotional signals… Identifying relationship dynamics…",
  },
  {
    line1: "Decoding mixed signals…",
    line2: "Analyzing intent vs. behavior… Flagging uncertainty patterns…",
  },
  {
    line1: "Cross-referencing emotional cues…",
    line2: "Weighing consistency over words… Evaluating likely motivations…",
  },
  {
    line1: "Synthesizing perspective…",
    line2: "Generating grounded advice… Preparing clear next steps…",
  },
  {
    line1: "Insight ready. Perspective unlocked.",
    line2: "Here's what's really going on.",
  },
];

const FullPageLoader: React.FC<FullPageLoaderProps> = ({ size = 150, showAnimatedText = true }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(
    Math.floor(Math.random() * TEXT_PAIRS.length),
  );
  const [animationKey, setAnimationKey] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Optimized for short loading screens with smooth transitions
    const animation = Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
        easing: (t) => t * (2 - t), // ease-out quad
      }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
        easing: (t) => t * t, // ease-in quad
      }),
    ]);

    animation.start(() => {
      // Select a different random text (not the same as current)
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * TEXT_PAIRS.length);
      } while (newIndex === currentTextIndex && TEXT_PAIRS.length > 1);

      setCurrentTextIndex(newIndex);
      setAnimationKey((prev) => prev + 1); // Force re-render
    });

    // Cleanup function to stop animation on unmount
    return () => {
      animation.stop();
    };
  }, [animationKey, fadeAnim]);

  const currentText = TEXT_PAIRS[currentTextIndex];

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrapper}>
        <LottieView
          source={require("../../assets/fullPageloader.json")}
          autoPlay
          loop
          style={[
            styles.lottie,
            { width: Matrics.s(size), height: Matrics.s(size) },
          ]}
        />
      </View>

      {showAnimatedText && (
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.textLine1}>{currentText.line1}</Text>
          <Text style={styles.textLine2}>{currentText.line2}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    gap: Matrics.vs(50),
  },
  loaderWrapper: {
    marginTop: Matrics.vs(-80),
  },
  lottie: {
    width: Matrics.s(150),
    height: Matrics.s(150),
  },
  textContainer: {
    paddingHorizontal: Matrics.s(30),
    alignItems: "center",
    minHeight: Matrics.vs(60),
  },
  textLine1: {
    fontSize: Matrics.ms(15),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.PRIMARY,
    textAlign: "center",
    marginBottom: Matrics.vs(5),
    lineHeight: Matrics.vs(16),
  },
  textLine2: {
    fontSize: Matrics.ms(13),
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    textAlign: "center",
    lineHeight: Matrics.vs(16),
    opacity: 0.7,
  },
});

export default FullPageLoader;
