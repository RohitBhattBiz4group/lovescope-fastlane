import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useCopilot } from "react-native-copilot";
import { useTranslation } from "react-i18next";

import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import { useWalkthroughConfig } from "../../contexts/WalkthroughContext";

interface CustomTooltipProps {
  responsiveConfig?: {
    tooltipWidth: number;
    fontSize: number;
    buttonPadding: number;
  };
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ responsiveConfig }) => {
  const { t } = useTranslation();
  const {
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrev,
    stop,
    currentStep,
    currentStepNumber,
    totalStepsNumber,
  } = useCopilot();
  const { setStopOnOutsideClick } = useWalkthroughConfig();

  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setStopOnOutsideClick(totalStepsNumber === 1);
  }, [totalStepsNumber, setStopOnOutsideClick]);

  const handleNext = useCallback(() => {
    setTransitioning(true);
    goToNext();
    setTimeout(() => {
      setTransitioning(false);
    }, 50);
  }, [goToNext]);

  const handlePrev = useCallback(() => {
    setTransitioning(true);
    goToPrev();
    setTimeout(() => {
      setTransitioning(false);
    }, 50);
  }, [goToPrev]);

  const isSingleStep = totalStepsNumber === 1;

  // Get responsive values or fallback to defaults
  const tooltipWidth = responsiveConfig?.tooltipWidth ?? Matrics.screenWidth - Matrics.s(40);
  const fontSize = responsiveConfig?.fontSize ?? FontsSize.Regular;
  const buttonPadding = responsiveConfig?.buttonPadding ?? Matrics.vs(12);

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: colors.WHITE,
      borderRadius: Matrics.ms(5),
      paddingVertical: Matrics.vs(12),
      paddingHorizontal: Matrics.s(16),
      marginTop: Matrics.vs(-16),
      marginHorizontal: Matrics.s(-16),
      shadowColor: colors.BLACK,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      maxWidth: tooltipWidth,
      position: 'relative',
    },
    containerTransparent: {
      backgroundColor: 'transparent',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
      marginVertical: 0,
      marginHorizontal: 0,
    },
    transparentText: {
      color: 'transparent',
    },
    tooltipText: {
      fontSize: fontSize,
      fontFamily: typography.fontFamily.Satoshi.Medium,
      fontWeight: "500",
      color: colors.TEXT_DARK,
      lineHeight: Matrics.vs(22),
      marginBottom: Matrics.vs(12),
    },
    singleStepTooltipText: {
      fontSize: fontSize,
      fontFamily: typography.fontFamily.Satoshi.Medium,
      fontWeight: "500",
      color: colors.TEXT_DARK,
      lineHeight: Matrics.vs(22),
    },
    primaryButton: {
      flex: 1,
      backgroundColor: colors.PRIMARY,
      borderRadius: Matrics.s(25),
      paddingVertical: buttonPadding,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: colors.WHITE,
      borderRadius: Matrics.s(25),
      paddingVertical: buttonPadding,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.PRIMARY,
    },
  });

  if (isSingleStep) {
    return (
      <View style={dynamicStyles.container}>
        <Text style={dynamicStyles.singleStepTooltipText}>{currentStep?.text}</Text>
      </View>
    );
  }

  if (transitioning) {
    return null;
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={styles.stepIndicatorContainer}>
        <Text style={styles.stepIndicator}>
          {currentStepNumber} / {totalStepsNumber}
        </Text>
      </View>

      <Text style={dynamicStyles.tooltipText}>{currentStep?.text}</Text>

      <View style={styles.buttonContainer}>
        {!isFirstStep && (
          <TouchableOpacity
            style={dynamicStyles.secondaryButton}
            onPress={handlePrev}
            disabled={transitioning}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>
              {t("walkthrough.previous")}
            </Text>
          </TouchableOpacity>
        )}

        {!isLastStep ? (
          <TouchableOpacity
            style={[dynamicStyles.primaryButton, isFirstStep && styles.fullWidthButton]}
            onPress={handleNext}
            disabled={transitioning}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {t("walkthrough.next")}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={dynamicStyles.primaryButton}
            onPress={stop}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {t("walkthrough.finish")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepIndicatorContainer: {
    alignSelf: "flex-start",
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(4),
    marginBottom: Matrics.vs(8),
  },
  stepIndicator: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
  },
  transparentStepIndicator: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: 'transparent',
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Matrics.s(12),
  },
  fullWidthButton: {
    flex: undefined,
    width: "100%",
  },
  primaryButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
  },
  secondaryButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.PRIMARY,
  },
});

export default CustomTooltip;
