import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import CountryPicker, {
  Country,
  CountryCode
} from "react-native-country-picker-modal";
import { AsYouType, CountryCode as PhoneCountryCode } from "libphonenumber-js";
import TextInput from "./TextInput";
import CommonError from "./CommonError";
import {
  PHONE_VALIDATION_RULES,
  DEFAULT_PHONE_VALIDATION,
} from "../../constants/commonConstant";

interface PhoneInputProps {
  label: string;
  placeholder: string;
  value: string;
  countryCode: string;
  callingCode: string;
  onPhoneChange: (phone: string) => void;
  onCountryChange: (countryCode: string, callingCode: string) => void;
  error?: string;
  touched?: boolean;
  onBlur?: () => void;
  editable?: boolean;
  disabled?: boolean;
  allowedCountries?: string[];
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  placeholder,
  value,
  countryCode,
  callingCode,
  onPhoneChange,
  onCountryChange,
  error,
  touched = false,
  disabled = false,
  onBlur,
  editable = true,
  allowedCountries = ["US", "GB", "CA", "NZ", "AU", "IE", "IN"],
}) => {
  const [formattedPhone, setFormattedPhone] = useState<string>(value);
  const [countryPickerVisible, setCountryPickerVisible] = useState<boolean>(false);
  const previousRawRef = useRef<string>(value);

  // Get current country's phone validation rules
  const getCurrentPhoneRules = () => {
    return PHONE_VALIDATION_RULES[countryCode as keyof typeof PHONE_VALIDATION_RULES] || DEFAULT_PHONE_VALIDATION;
  };

  // Reformat phone when country code changes
  useEffect(() => {
    previousRawRef.current = value || "";
    if (value) {
      const formatter = new AsYouType(countryCode as PhoneCountryCode);
      setFormattedPhone(formatter.input(value));
    } else {
      setFormattedPhone("");
    }
  }, [countryCode, value]);

  const handlePhoneChange = (text: string) => {
    const phoneRules = getCurrentPhoneRules();
    const maxLength = phoneRules.maxLength;
    
    // Remove all non-digit characters to get raw number
    const rawNumber = text.replace(/\D/g, '');
    
    // Validate length
    if (rawNumber.length > maxLength) {
      return;
    }

    // If the raw digits didn't change (user removed only formatting characters),
    // skip reformatting so the caret stays where the user expects.
    if (rawNumber === previousRawRef.current) {
      setFormattedPhone(text);
      return;
    }
    
    // Format for display with current country
    const formatter = new AsYouType(countryCode as PhoneCountryCode);
    const formatted = formatter.input(rawNumber);
    setFormattedPhone(formatted);
    
    // Pass raw number to parent
    previousRawRef.current = rawNumber;
    onPhoneChange(rawNumber);
  };

  return (
    <View>
      <TextInput
        label={label}
        placeholder={placeholder}
        autoCapitalize="none"
        placeholderTextColor="rgba(47, 46, 44, 0.6)"
        name="phone"
        value={formattedPhone}
        onChangeText={handlePhoneChange}
        onBlur={onBlur}
        editable={editable}
        disable={disabled}
        keyboardType="phone-pad"
        maxLength={getCurrentPhoneRules().maxLength + 5} // Add extra length for formatting characters
        leftIcon={
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View pointerEvents={disabled ? "none" : "auto"}>
              <CountryPicker
                countryCode={countryCode as CountryCode}
                countryCodes={allowedCountries as CountryCode[]}
                withFilter
                withFlag
                withCallingCode
                // withEmoji={false}
                visible={countryPickerVisible}
                onClose={() => setCountryPickerVisible(false)}
                onSelect={(country: Country) => {
                  onCountryChange(
                    country.cca2,
                    String(country.callingCode?.[0] || "")
                  );
                  // Reformat phone with new country code
                  if (value) {
                    const formatter = new AsYouType(country.cca2 as PhoneCountryCode);
                    setFormattedPhone(formatter.input(value));
                  }
                }}
                containerButtonStyle={{ paddingVertical: 6, paddingHorizontal: 4 }}
                onOpen={() => !disabled && setCountryPickerVisible(true)}
              />
            </View>
            <TouchableOpacity
              onPress={() => !disabled && setCountryPickerVisible(true)}
              activeOpacity={0.7}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text style={{ color: "rgba(47, 46, 44, 0.9)" }}>
                +{callingCode}
              </Text>
              <Text style={{ marginLeft: 4, color: "rgba(47, 46, 44, 0.6)" }}>
                ▼
              </Text>
            </TouchableOpacity>
          </View>
        }
        inputStyle={{ paddingLeft: 130 }}
      />
      
      {/* Manual error display for phone field */}
      {error && touched && (
        <View style={{ marginTop: -13, marginBottom: 5 }}>
          <CommonError message={error} />
        </View>
      )}
    </View>
  );
};

export default PhoneInput;
