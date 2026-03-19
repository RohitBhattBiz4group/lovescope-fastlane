import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";

import { commonStyles } from "./styles";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";

interface QuestionCountOption {
  value: number;
  label: string;
  description: string;
}

interface QuestionCountSelectorProps {
  label: string;
  subtitle?: string;
  helperText?: string;
  value: number;
  options: QuestionCountOption[];
  onValueChange: (value: number) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

const QuestionCountSelector: React.FC<QuestionCountSelectorProps> = ({
  label,
  subtitle,
  helperText,
  value,
  options,
  onValueChange,
  error,
  containerStyle,
}) => {
  return (
    <View style={[commonStyles.inputContainer, containerStyle]}>
      {label && <Text style={commonStyles.inputLabel}>Length</Text>}
      {subtitle && <Text style={styles.subtitle}>Number of questions</Text>}

      <View style={styles.segmentedContainer}>
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;

          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.7}
              style={[
                styles.segment,
                isFirst && styles.segmentFirst,
                isLast && styles.segmentLast,
                isSelected && styles.segmentSelected,
              ]}
              onPress={() => onValueChange(option.value)}
            >
              <Text
                style={[
                  styles.segmentValue,
                  isSelected && styles.segmentValueSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text
                style={[
                  styles.segmentDescription,
                  isSelected && styles.segmentDescriptionSelected,
                ]}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {helperText && <Text style={styles.helperText}>You can change this later</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.GRAY_DARK,
    marginBottom: Matrics.vs(8),
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(25),
    padding: Matrics.s(4),
       borderWidth: 1,
        borderColor: "#EDF1F3",
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Matrics.vs(9),
    paddingHorizontal: Matrics.s(8),
    borderRadius: Matrics.s(22),
    gap: Matrics.s(2),
  },
  segmentFirst: {
    borderTopLeftRadius: Matrics.s(22),
    borderBottomLeftRadius: Matrics.s(22),
  },
  segmentLast: {
    borderTopRightRadius: Matrics.s(22),
    borderBottomRightRadius: Matrics.s(22),
  },
  segmentSelected: {
    backgroundColor: colors.PRIMARY,
    shadowColor: colors.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  segmentValue: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.GRAY_DARK,
  },
  segmentValueSelected: {
    color: colors.WHITE,
  },
  segmentDescription: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.GRAY_DARK,
    marginLeft: Matrics.s(2),
  },
  segmentDescriptionSelected: {
    color: colors.WHITE,
    opacity: 0.9,
  },
  helperText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.GRAY_DARK,
    marginTop: Matrics.vs(8),
  },
  errorText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.DANGER,
    marginTop: Matrics.vs(2),
  },
});

export default QuestionCountSelector;
