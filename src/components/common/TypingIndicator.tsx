import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";

interface TypingIndicatorProps {
  isUser?: boolean;
  dotColor?: string;
  bubbleColor?: string;
  dotSize?: number;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isUser = false,
  dotColor,
  bubbleColor,
  dotSize = 6,
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 150);
    const anim3 = animateDot(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (animValue: Animated.Value) => ({
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  const defaultDotColor = isUser ? colors.WHITE : colors.PRIMARY;
  const defaultBubbleColor = isUser ? colors.PRIMARY : colors.BACKGROUND;

  const dynamicStyles: {
    container: ViewStyle;
    bubble: ViewStyle;
    dot: ViewStyle;
  } = {
    container: {
      justifyContent: isUser ? "flex-end" : "flex-start",
    },
    bubble: {
      backgroundColor: bubbleColor || defaultBubbleColor,
      borderTopRightRadius: isUser ? Matrics.s(2) : Matrics.s(12),
      borderTopLeftRadius: isUser ? Matrics.s(12) : Matrics.s(4),
    },
    dot: {
      width: Matrics.s(dotSize),
      height: Matrics.s(dotSize),
      borderRadius: Matrics.s(dotSize / 2),
      backgroundColor: dotColor || defaultDotColor,
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.bubble, dynamicStyles.bubble]}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[dynamicStyles.dot, dotStyle(dot1)]} />
          <Animated.View style={[dynamicStyles.dot, dotStyle(dot2)]} />
          <Animated.View style={[dynamicStyles.dot, dotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Matrics.vs(20),
    flexDirection: "row",
  },
  bubble: {
    paddingVertical: Matrics.vs(14),
    paddingHorizontal: Matrics.s(18),
    borderRadius: Matrics.s(12),
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(6),
  },
});

export default TypingIndicator;
