import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { commonStyles } from "./styles";

interface RadioOption {
  label: string;
  value: string;
}

interface RadioProps {
  options: RadioOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
}

const Radio: React.FC<RadioProps> = ({
  options,
  selectedValue,
  onValueChange,
}) => {
  return (
    <View style={commonStyles.radioGroup}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[commonStyles.radioOption, isSelected && commonStyles.radioOptionSelected]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.7}
          >
            <View style={commonStyles.radioCircle}>
              {isSelected && <View style={commonStyles.radioCircleSelected} />}
            </View>
            <Text style={commonStyles.radioLabel}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Radio;
