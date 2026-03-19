import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "@react-native-community/blur";
import { Matrics } from "../../config/appStyling";

interface BlurWrapperProps {
  children: React.ReactNode;
  blurAmount?: number;
  blurType?:
    | "light"
    | "dark"
    | "xlight"
    | "prominent"
    | "regular"
    | "extraDark";
  style?: ViewStyle;
  borderRadius?: number;
}

/**
 * BlurWrapper - Wraps any content and applies a blur effect over it
 *
 * Usage:
 * <BlurWrapper blurAmount={8}>
 *   <YourContent />
 * </BlurWrapper>
 */
const BlurWrapper: React.FC<BlurWrapperProps> = ({
  children,
  blurAmount = 8,
  blurType = "light",
  style,
  borderRadius = Matrics.ms(12),
}) => {
  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {children}
      <BlurView
        style={[styles.blurOverlay, { borderRadius }]}
        blurType={blurType}
        blurAmount={blurAmount}
        reducedTransparencyFallbackColor="white"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default BlurWrapper;
