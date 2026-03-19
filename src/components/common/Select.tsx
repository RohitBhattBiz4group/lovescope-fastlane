import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleProp,
  ViewStyle,
  Image,
} from "react-native";
import { Control, Controller } from "react-hook-form";
import { commonStyles } from "./styles";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import CommonError from "./CommonError";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[] | string[];
  containerStyle?: StyleProp<ViewStyle>;
  pickerStyle?: StyleProp<ViewStyle>;
  modalContentStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  name: string;
  control?: Control<any>;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  renderOption?: (option: SelectOption, isSelected: boolean, onSelect: () => void) => React.ReactNode;
  renderModalHeader?: () => React.ReactNode;
  autoOpen?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  placeholder,
  options,
  containerStyle,
  pickerStyle,
  modalContentStyle,
  disabled = false,
  loading = false,
  required = false,
  name,
  control,
  value,
  onValueChange,
  error,
  renderOption,
  renderModalHeader,
  autoOpen = false,
}) => {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder || t("common.select_an_option");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (autoOpen && !disabled && !loading) {
      setShowPicker(true);
    }
  }, [autoOpen, disabled, loading]);

  // Normalize options to SelectOption format
  const normalizedOptions: SelectOption[] = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option
  );

  const renderPicker = (
    selectedValue: string | undefined,
    onChange: (value: string) => void,
    fieldError?: string
  ) => (
    <View style={[commonStyles.inputContainer, containerStyle]}>
      {label && (
        <Text style={commonStyles.inputLabel}>
          {label}
          {required && <Text style={{ color: colors.DANGER }}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.pickerButton,
          pickerStyle,
          (disabled || loading) && styles.pickerButtonDisabled,
        ]}
        onPress={() => setShowPicker(true)}
        disabled={disabled || loading}
      >
        <Text
          style={[styles.pickerText, !selectedValue && styles.placeholderText]}
        >
          {selectedValue
            ? normalizedOptions.find((opt) => opt.value === selectedValue)
                ?.label || selectedValue
            : resolvedPlaceholder}
        </Text>
        <View style={styles.rightIconContainer}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={colors.PRIMARY}
              style={styles.loadingIndicator}
            />
          )}
          <Image
            source={Images.ARROW_DOWN}
            style={[
              styles.dropdownIcon,
              (disabled || loading) && styles.dropdownIconDisabled,
            ]}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {fieldError && <CommonError message={fieldError} />}

      {/* Picker Modal */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={[styles.modalContent, modalContentStyle]}>
            {renderModalHeader && renderModalHeader()}
            {normalizedOptions.map((option, index) => {
              const isSelected = selectedValue === option.value;
              const handleSelect = () => {
                onChange(option.value);
                setShowPicker(false);
              };
              return renderOption ? (
                <View key={option.value} style={index > 0 ? styles.optionSpacing : undefined}>
                  {renderOption(option, isSelected, handleSelect)}
                </View>
              ) : (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    index === normalizedOptions.length - 1 && styles.lastModalOption,
                  ]}
                  onPress={handleSelect}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  if (control) {
    return (
      <Controller
        render={({ field, fieldState }) =>
          renderPicker(
            field.value,
            field.onChange,
            fieldState?.error && fieldState.isTouched
              ? fieldState.error.message
              : undefined
          )
        }
        control={control}
        name={name}
        defaultValue={value || ""}
      />
    );
  }

  return renderPicker(value, onValueChange || (() => {}), error);
};

const styles = {
  pickerButton: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.ms(12),
    paddingVertical: Matrics.vs(14),
    paddingHorizontal: Matrics.ms(15),
    borderWidth: 1,
    borderColor: "#EDF1F3",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  pickerButtonDisabled: {
    opacity: 0.7,
  },
  pickerText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.SECONDARY,
  },
  placeholderText: {
    color: "rgba(47, 46, 44, 0.6)",
  },
  rightIconContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  loadingIndicator: {
    marginRight: Matrics.s(8),
  },
  dropdownIcon: {
    width: Matrics.s(14),
    height: Matrics.s(14),
  },
  dropdownIconDisabled: {
    opacity: 0.4,
    tintColor: colors.GRAY_DARK,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  modalContent: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(12),
    paddingVertical: Matrics.vs(8),
    width: Matrics.s(280),
  },
  modalOption: {
    paddingVertical: Matrics.vs(12),
    paddingHorizontal: Matrics.s(20),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalOptionText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
  },
  optionSpacing: {
    marginTop: Matrics.vs(8),
  },
  lastModalOption: {
    paddingVertical: Matrics.vs(12),
    paddingHorizontal: Matrics.s(20),
    borderBottomWidth: 0,
  },
};

export default Select;
