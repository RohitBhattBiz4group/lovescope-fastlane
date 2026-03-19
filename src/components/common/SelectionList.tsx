import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
  ImageBackground,
} from "react-native";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import Images from "../../config/Images";

export interface SelectionOption {
  title: string;
  description?: string;
  value?: string;
}

interface BaseProps {
  options: SelectionOption[];
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

interface SingleSelectProps extends BaseProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps extends BaseProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type SelectionListProps = SingleSelectProps | MultiSelectProps;

const SelectionList: React.FC<SelectionListProps> = (props) => {
  const { options, disabled = false, containerStyle, multiple } = props;

  const getOptionValue = (option: SelectionOption): string =>
    option.value ?? option.title;

  const isSelected = (option: SelectionOption): boolean => {
    const val = getOptionValue(option);
    if (multiple) {
      return (props as MultiSelectProps).value.includes(val);
    }
    return (props as SingleSelectProps).value === val;
  };

  const handlePress = (option: SelectionOption) => {
    const val = getOptionValue(option);
    if (multiple) {
      const { value, onChange } = props as MultiSelectProps;
      const exists = value.includes(val);
      const updatedSelection = exists
        ? value.filter((selectedValue) => selectedValue !== val)
        : [...value, val];
      onChange(updatedSelection);
    } else {
      const { onChange } = props as SingleSelectProps;
      onChange(val);
    }
  };

  return (
    // <ImageBackground
    //   source={Images.LINEARGRADIENT_BG2}
    //   style={styles.gradientImageCard}
    //   imageStyle={styles.cardImageStyle}
    //   resizeMode="cover"
    // >
    // </ImageBackground>
    <View style={[styles.listWrap, containerStyle]}>
      {options.map((option, index) => {
        const selected = isSelected(option);
        return (
          <TouchableOpacity
            key={`${option.title}-${index}`}
            style={[styles.listItem, selected && styles.listItemSelected]}
            onPress={() => handlePress(option)}
            disabled={disabled}
          >
            <View style={styles.listItemTextWrap}>
              <Text
                style={[
                  styles.listItemTitle,
                  selected && styles.listItemTitleSelected,
                ]}
              >
                {option.title}
              </Text>
              {!!option.description && option.description.trim().length > 0 && (
                <Text style={styles.listItemDescription}>
                  {option.description}
                </Text>
              )}
            </View>

            {selected && (
              <View style={multiple ? undefined : styles.checkWrap}>
                <Animated.Image
                  source={Images.REQUEST_ACCEPT}
                  style={multiple ? styles.checkboxCheck : styles.checkIcon}
                  resizeMode="contain"
                />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // gradientImageCard: {
  //   width: "100%",
  //   borderRadius: Matrics.s(16),
  //   borderWidth: 1,
  //   borderColor: "rgba(47, 89, 235, 0.2)",
  //   alignItems: "center",
  //   overflow: "hidden",
  // },
  // cardImageStyle: {
  //   borderRadius: Matrics.s(16),
  // },
  listWrap: {
    gap: Matrics.vs(12),
    width: "100%",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(12),
    borderWidth: 1,
    borderColor: "rgba(26, 26, 26, 0.20)",
    borderRadius: Matrics.s(10),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    height: Matrics.s(50),
  },
  listItemSelected: {
    borderColor: "rgba(47, 89, 235, 1)",
    backgroundColor: "rgba(47, 89, 235, 0.05)",
    shadowColor: colors.PRIMARY,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  listItemTextWrap: {
    flex: 1,
    paddingRight: Matrics.s(10),
  },
  listItemTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  listItemTitleSelected: {
    color: colors.TEXT_DARK,
  },
  listItemDescription: {
    marginTop: Matrics.vs(4),
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
    opacity: 0.65,
    lineHeight: Matrics.vs(16),
  },
  checkWrap: {
    width: Matrics.s(24),
    height: Matrics.s(24),
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    width: Matrics.s(20),
    height: Matrics.s(20),
  },
  checkboxCheck: {
    width: Matrics.s(18),
    height: Matrics.s(18),
  },
});

export default SelectionList;
