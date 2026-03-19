import React from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import Images from "../../config/Images";

export interface MultiOptionCardOption {
  title: string;
  value?: string;
}

interface MultiOptionCardProps {
  title: string;
  options: MultiOptionCardOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  exclusiveValues?: string[];
}

const MultiOptionCard: React.FC<MultiOptionCardProps> = ({
  title,
  options,
  value,
  onChange,
  disabled = false,
  containerStyle,
  exclusiveValues = [],
}) => {
  const getVal = (option: MultiOptionCardOption): string =>
    option.value ?? option.title;

  const isSelected = (option: MultiOptionCardOption): boolean => {
    return value.includes(getVal(option));
  };

  const handlePress = (option: MultiOptionCardOption) => {
    if (disabled) return;
    const val = getVal(option);
    const exists = value.includes(val);

    if (exists) {
      onChange(value.filter((selectedValue) => selectedValue !== val));
    } else if (exclusiveValues.includes(val)) {
      onChange([val]);
    } else {
      const filtered = value.filter(
        (selectedValue) => !exclusiveValues.includes(selectedValue)
      );
      onChange([...filtered, val]);
    }
  };

  return (
    // <ImageBackground
    //   source={Images.LINEARGRADIENT_BG2}
    //   style={[styles.gradientCard, containerStyle]}
    //   imageStyle={styles.cardImageStyle}
    //   resizeMode="cover"
    // >
      <View style={styles.cardContent}>
        {/* <Text style={styles.cardTitle}>{title}</Text> */}

        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            const selected = isSelected(option);
            return (
              <TouchableOpacity
                key={`${option.title}-${index}`}
                style={[
                  styles.optionPill,
                  selected && styles.optionPillSelected,
                ]}
                onPress={() => handlePress(option)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                  ]}
                >
                  {option.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    // </ImageBackground>
  );
};

const styles = StyleSheet.create({
  gradientCard: {
    width: "100%",
    borderRadius: Matrics.s(18),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.15)",
    overflow: "hidden",
    marginBottom: Matrics.vs(16),
    // shadowColor: "rgba(47, 89, 235, 0.1)",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 2,
  },
  cardImageStyle: {
    borderRadius: Matrics.s(18),
  },
  cardContent: {
    padding: Matrics.s(14),
    paddingVertical: Matrics.vs(14),
  },
  cardTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(14),
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Matrics.s(8),
    rowGap: Matrics.vs(8),
  },
  optionPill: {
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(8),
    borderRadius: Matrics.s(100),
    borderWidth: 1,
    borderColor: "rgba(26, 26, 26, 0.15)",
    backgroundColor: "transparent",
  },
  optionPillSelected: {
    borderColor: colors.PRIMARY,
    backgroundColor: colors.PRIMARY,
  },
  optionText: {
    fontSize: Matrics.ms(12),
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: "#1F1F1F",
    lineHeight: Matrics.vs(13),
    textAlign: "center" as const,
  },
  optionTextSelected: {
    color: colors.WHITE,
  },
});

export default MultiOptionCard;
