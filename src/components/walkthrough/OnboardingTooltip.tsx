import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useCopilot } from "react-native-copilot";

import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";

const OnboardingTooltip: React.FC = () => {
  const { currentStep } = useCopilot();

  return (
    <View style={styles.container}>
      <Text style={styles.tooltipText}>{currentStep?.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(16),
    paddingVertical: Matrics.vs(20),
    paddingHorizontal: Matrics.s(20),
    shadowColor: colors.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: Matrics.screenWidth - Matrics.s(40),
  },
  tooltipText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(22),
  },
});

export default OnboardingTooltip;
