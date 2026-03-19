import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  colors,
  Matrics,
  FontsSize,
  typography,
} from "../../config/appStyling";

interface ProgressBarProps {
  percentage: number;
  tooltipLabel?: string;
  showTooltip?: boolean;
  tooltipPosition?: "top" | "bottom";
  minValue?: number;
  maxValue?: number;
  showPercentageLabel?: boolean;
  tooltipColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  tooltipLabel = "",
  showTooltip = true,
  tooltipPosition = "top",
  minValue = 0,
  maxValue = 100,
  showPercentageLabel = true,
  tooltipColor = "#2F59EB",
}) => {
  const [tooltipWidth, setTooltipWidth] = useState(0);

  const normalizedPercentage = Math.min(
    Math.max(percentage, minValue),
    maxValue,
  );
  const displayPercentage =
    ((normalizedPercentage - minValue) / (maxValue - minValue)) * 100;

  const renderTooltip = () => {
    if (!showTooltip || !tooltipLabel) return null;

    return (
      <View style={styles.tooltipRow}>
        <View
          onLayout={(e) => setTooltipWidth(e.nativeEvent.layout.width)}
          style={[
            styles.tooltipPositioner,
            {
              left: `${displayPercentage}%`,
              transform: [{ translateX: -tooltipWidth / 2 }],
            },
            tooltipPosition === "bottom" && styles.tooltipPositionerBottom,
          ]}
        >
          {tooltipPosition === "bottom" && (
            <View
              style={[
                styles.tooltipArrowUp,
                { borderBottomColor: tooltipColor },
              ]}
            />
          )}
          <View style={[styles.tooltip, { backgroundColor: tooltipColor }]}>
            <Text numberOfLines={1} style={styles.tooltipText}>
              {tooltipLabel}
            </Text>
          </View>
          {tooltipPosition === "top" && (
            <View
              style={[
                styles.tooltipArrowDown,
                { borderTopColor: tooltipColor },
              ]}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {tooltipPosition === "top" && renderTooltip()}
      <View style={styles.track}>
        <View style={[styles.fillClip, { width: `${displayPercentage}%` }]}>
          <LinearGradient
            // colors={["#D8E6F5", "#ACBEFF", "#2F59EB"]}
            colors={["#D8E6F5", "#ACBEFF", "#2F59EB"]}
            locations={[0, 0.15, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradient,
              { width: `${(100 / (displayPercentage || 1)) * 100}%` },
            ]}
          />
        </View>
      </View>
      {tooltipPosition === "bottom" && renderTooltip()}
      <View style={styles.labelsRow}>
        <Text style={styles.endLabel}>{minValue}</Text>
        <Text style={styles.endLabel}>{maxValue}</Text>
        {showPercentageLabel && (
          <View
            style={[
              styles.percentPositioner,
              { left: `${displayPercentage}%` },
            ]}
          >
            <Text style={styles.percentLabel}>{normalizedPercentage}%</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Matrics.vs(12),
    marginBottom: Matrics.vs(4),
  },
  tooltipRow: {
    height: Matrics.vs(10),
    position: "relative",
    marginBottom: Matrics.vs(2),
  },
  tooltipPositioner: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
  },
  tooltipPositionerBottom: {
    bottom: undefined,
    top: 0,
    marginTop: Matrics.vs(2),
  },
  tooltip: {
    backgroundColor: "#2F59EB",
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(2),
    borderRadius: Matrics.s(6),
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: Matrics.ms(10),
    fontFamily: typography.fontFamily.Satoshi.SemiBold,
  },
  tooltipArrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: Matrics.s(4),
    borderRightWidth: Matrics.s(4),
    borderTopWidth: Matrics.s(4),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#8E8E93",
  },
  tooltipArrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: Matrics.s(4),
    borderRightWidth: Matrics.s(4),
    borderBottomWidth: Matrics.s(4),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#8E8E93",
  },
  track: {
    height: Matrics.vs(8),
    borderRadius: Matrics.s(6),
    backgroundColor: "rgba(47, 89, 235, 0.08)",
    overflow: "hidden",
  },
  fillClip: {
    height: "100%",
    borderRadius: Matrics.s(0),
    overflow: "hidden",
  },
  gradient: {
    height: "100%",
    borderRadius: Matrics.s(0),
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Matrics.vs(4),
    position: "relative",
  },
  endLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    // opacity: 0.5,
  },
  percentPositioner: {
    position: "absolute",
    top: 0,
    width: 0,
    alignItems: "center",
    overflow: "visible",
  },
  percentLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.PRIMARY,
    fontWeight: "600",
  },
});

export default ProgressBar;
