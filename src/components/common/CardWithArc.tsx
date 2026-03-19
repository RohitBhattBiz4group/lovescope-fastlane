import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { colors, Matrics } from "../../config/appStyling";

interface CardWithArcProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showBottomGlow?: boolean;
}

const GLOW_SIZE = Matrics.ms(200);

const GlowCircle = () => (
  <Svg width={GLOW_SIZE} height={GLOW_SIZE} viewBox="0 0 200 200">
    <Defs>
      <RadialGradient id="glowGradient" cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor="#2F59EB" stopOpacity="0.15" />
        <Stop offset="70%" stopColor="#2F59EB" stopOpacity="0.05" />
        <Stop offset="100%" stopColor="#2F59EB" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx="100" cy="100" r="100" fill="url(#glowGradient)" />
  </Svg>
);

const CardWithArc: React.FC<CardWithArcProps> = ({
  children,
  style,
  showBottomGlow = false,
}) => {
  return (
    <View style={[styles.card, style]}>
      {/* Blurred blue circle glow in top-right corner */}
      <View style={styles.glowContainerTopRight}>
        <GlowCircle />
      </View>
      {/* Blurred blue circle glow in bottom-left corner */}
      {showBottomGlow && (
        <View style={styles.glowContainerBottomLeft}>
          <GlowCircle />
        </View>
      )}
      {/* Card content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.ms(10),
    padding: Matrics.ms(16),
    marginBottom: Matrics.vs(16),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.20)",
    overflow: "hidden",
  },
  glowContainerTopRight: {
    position: "absolute",
    top: Matrics.ms(-110),
    right: Matrics.ms(-50),
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  glowContainerBottomLeft: {
    position: "absolute",
    left: Matrics.ms(-60),
    bottom: Matrics.ms(-130),
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
});

export default CardWithArc;
