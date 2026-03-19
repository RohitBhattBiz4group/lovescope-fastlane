import React from "react";
import {
  Animated,
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

export interface CardOption {
  title: string;
  subtitle?: string;
  value?: string;
}

interface CardSelectProps {
  options: CardOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const CardSelect: React.FC<CardSelectProps> = ({
  options,
  value,
  onChange,
  disabled = false,
  containerStyle,
}) => {
  return (
    <View style={[styles.cardGrid, containerStyle]}>
      {options.map((option, index) => {
        const optionValue = option.value ?? option.title;
        const selected = value === optionValue;
        return (
          <TouchableOpacity
            key={`${option.title}-${index}`}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onChange(optionValue)}
            disabled={disabled}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{option.title}</Text>
              {selected && (
                <Animated.Image
                  source={Images.REQUEST_ACCEPT}
                  style={styles.cardCheck}
                  resizeMode="contain"
                />
              )}
            </View>
            {!!option.subtitle && option.subtitle.trim().length > 0 && (
              <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Matrics.s(12),
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(26, 26, 26, 0.14)",
    borderRadius: Matrics.s(16),
    paddingHorizontal: Matrics.s(14),
    paddingVertical: Matrics.vs(14),
    backgroundColor: "rgba(26, 26, 26, 0.02)",
  },
  cardSelected: {
    borderColor: "rgba(47, 89, 235, 0.75)",
    backgroundColor: "rgba(47, 89, 235, 0.06)",
    shadowColor: colors.PRIMARY,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_DARK,
    paddingRight: Matrics.s(8),
  },
  cardSubtitle: {
    marginTop: Matrics.vs(8),
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
    opacity: 0.7,
    lineHeight: Matrics.vs(16),
  },
  cardCheck: {
    width: Matrics.s(18),
    height: Matrics.s(18),
  },
});

export default CardSelect;
