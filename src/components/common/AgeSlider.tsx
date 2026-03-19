import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { Matrics, colors, FontsSize, typography } from "../../config/appStyling";

export interface AgeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  hintText?: string;
  showHint?: boolean;
}

const AgeSlider: React.FC<AgeSliderProps> = ({
  value,
  onChange,
  min = 16,
  max = 60,
  disabled = false,
  hintText,
  showHint = true,
}) => {
  const numericValue = typeof value === "number" ? Math.max(value, min) : min;
  const trackWidth = Matrics.s(280);
  const thumbSize = Matrics.s(20);
  const sliderWidth = trackWidth + thumbSize;
  const range = Math.max(1, max - min);
  const normalized = Math.max(0, Math.min(1, (numericValue - min) / range));
  const thumbCenterPosition =
    thumbSize / 2 + normalized * (trackWidth - thumbSize);
  const fillWidth = Math.min(Math.max(thumbCenterPosition, 0), trackWidth);

  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderValueBubble}>
        <Text style={styles.sliderValueText}>{numericValue}</Text>
      </View>

      <View style={[styles.sliderTrackWrap, { width: trackWidth }]}>
        <View style={styles.sliderTrack} />
        <View style={[styles.sliderTrackFill, { width: fillWidth }]} />
        <View pointerEvents={disabled ? "none" : "auto"}>
          <Slider
            style={[
              styles.nativeSlider,
              { width: sliderWidth, marginHorizontal: -(thumbSize / 2) },
            ]}
            minimumValue={min}
            maximumValue={max}
            value={numericValue}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor={colors.PRIMARY}
            step={1}
            onValueChange={(newValue) => onChange(Math.round(newValue))}
          />
        </View>
      </View>

      <View style={[styles.sliderLabels, { width: trackWidth }]}>
        <Text style={styles.sliderLabelText}>{min}</Text>
        <Text style={styles.sliderLabelText}>{max}</Text>
      </View>

      {showHint && (
        <Text style={styles.sliderHint}>
          {hintText || `Slide to adjust age (${min}–${max} years)`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sliderWrap: {
    marginTop: Matrics.vs(10),
    alignItems: "flex-start",
  },
  sliderValueBubble: {
    alignSelf: "center",
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(6),
    borderRadius: Matrics.s(10),
    backgroundColor: "rgba(47, 89, 235, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.25)",
    // marginBottom: Matrics.vs(10),
  },
  sliderValueText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(16),
  },
  sliderTrackWrap: {
    height: Matrics.vs(34),
    justifyContent: "center",
  },
  sliderTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: Matrics.vs(6),
    borderRadius: Matrics.s(8),
    backgroundColor: "rgba(26, 26, 26, 0.12)",
  },
  sliderTrackFill: {
    position: "absolute",
    left: 0,
    height: Matrics.vs(6),
    borderRadius: Matrics.s(8),
    backgroundColor: colors.PRIMARY,
  },
  nativeSlider: {
    height: Matrics.vs(34),
  },
  sliderLabels: {
    marginTop: Matrics.vs(10),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabelText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    opacity: 0.7,
  },
  sliderHint: {
    marginTop: Matrics.vs(10),
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
    opacity: 0.55,
  },
});

export default AgeSlider;
