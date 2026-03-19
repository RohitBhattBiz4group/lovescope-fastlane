import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { t } from "i18next";

import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import { ToneBreakdown } from "../../interfaces/argumentAnalyzerInterfaces";

const TONE_COLOR_CODE: Record<string, string> = {
  calm: "#C7E8F3", // Pale Sky - peaceful, soothing
  defensive: "#2F6690", // Baltic Blue - guarded, cautious
  upset: "#FF6463", // Vibrant Coral - emotional distress
  hurt: "#C1A6F9", // Mauve - vulnerable, soft pain
  cold: "#DBD3AD", // Pearl Beige - detached, distant
  dismissive: "#a33d78ff", // Lilac Ash - indifferent
  frustrated: "#578f31ff", // Vintage Berry - blocked, intense
  angry: "#a10000ff", // Vintage Grape - dark, negative
};

interface ToneComparisonProps {
  label: string;
  toneData: ToneBreakdown;
}

const ToneComparisonBar: React.FC<ToneComparisonProps> = ({
  label,
  toneData,
}) => {
  const filteredTones = Object.entries(toneData).filter(
    ([, value]) => value > 0,
  );

  return (
    <View style={styles.toneSection}>
      <Text style={styles.toneLabel}>{label}</Text>
      <View style={styles.toneBar}>
        {filteredTones.map(([key, value], index, arr) => (
          <View
            key={key}
            style={[
              styles.toneSegment,
              {
                flex: value,
                backgroundColor: TONE_COLOR_CODE[key],
                borderTopLeftRadius: index === 0 ? 4 : 0,
                borderBottomLeftRadius: index === 0 ? 4 : 0,
                borderTopRightRadius: index === arr.length - 1 ? 4 : 0,
                borderBottomRightRadius: index === arr.length - 1 ? 4 : 0,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.legendContainer}>
        {filteredTones.map(([key, value]) => (
          <View key={key} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: TONE_COLOR_CODE[key] },
              ]}
            />
            <Text style={styles.legendText}>
              {t("analyzer.argument." + key)} {value}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toneSection: {
    marginBottom: Matrics.vs(0),
  },
  toneLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(5),
  },
  toneBar: {
    flexDirection: "row",
    height: Matrics.vs(8),
    borderRadius: Matrics.s(4),
    overflow: "hidden",
    marginBottom: Matrics.vs(8),
  },
  toneSegment: {
    height: "100%",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: Matrics.vs(8),
  },
  legendDot: {
    width: Matrics.s(10),
    height: Matrics.s(10),
    borderRadius: Matrics.s(5),
    marginRight: Matrics.ms(6),
  },
  legendText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
});

export default ToneComparisonBar;
