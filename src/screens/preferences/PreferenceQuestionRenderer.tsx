import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  IQuestion,
  OnboardingAnswerValue,
  QuestionType,
} from "../../interfaces/onboardingInterfaces";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import Images from "../../config/Images";
import Select from "../../components/common/Select";
import TextArea from "../../components/common/TextArea";
import SelectionList from "../../components/common/SelectionList";
import CardSelect from "../../components/common/CardSelect";
import AgeSlider from "../../components/common/AgeSlider";
import {
  ONBOARDING_QUESTION_TYPE,
  ONBOARDING_DEFAULT_AGE_MIN,
  ONBOARDING_DEFAULT_AGE_MAX,
} from "../../constants/commonConstant";

export interface PreferenceQuestionRendererProps {
  question: IQuestion;
  value: OnboardingAnswerValue;
  onChange: (value: OnboardingAnswerValue) => void;
  disabled: boolean;
}

const PreferenceQuestionRenderer: React.FC<PreferenceQuestionRendererProps> = ({
  question,
  value,
  onChange,
  disabled,
}) => {
  const { t } = useTranslation();
  const type: QuestionType = question.question_type;
  const rangeMin = question.range?.min ?? ONBOARDING_DEFAULT_AGE_MIN;

  useEffect(() => {
    if (type !== ONBOARDING_QUESTION_TYPE.RANGE) return;
    const numericValue = typeof value === "number" ? value : undefined;
    if (typeof numericValue !== "number" || numericValue < rangeMin) {
      onChange(rangeMin);
    }
  }, [type, rangeMin, value, onChange]);

  if (type === ONBOARDING_QUESTION_TYPE.TEXT) {
    return (
      <TextArea
        name="text-answer"
        value={typeof value === "string" ? value : ""}
        onChangeText={onChange}
        placeholder={t("onboarding.type_your_answer")}
        editable={!disabled}
        inputStyle={styles.textInput}
        showCharCount={false}
      />
    );
  }

  if (type === ONBOARDING_QUESTION_TYPE.RADIO) {
    return (
      <SelectionList
        options={(question.options ?? []).map((option) => ({
          title: option.text,
          description: option.description,
        }))}
        value={typeof value === "string" ? value : ""}
        onChange={(selectedValue) => onChange(selectedValue)}
        disabled={disabled}
      />
    );
  }

  if (type === ONBOARDING_QUESTION_TYPE.CARD_OPTIONS) {
    return (
      <CardSelect
        options={(question.options ?? []).map((option) => ({
          title: option.text,
          subtitle: option.description,
        }))}
        value={typeof value === "string" ? value : ""}
        onChange={(selectedValue) => onChange(selectedValue)}
        disabled={disabled}
      />
    );
  }

  if (
    type === ONBOARDING_QUESTION_TYPE.MULTISELECT ||
    type === ONBOARDING_QUESTION_TYPE.CHECKBOX
  ) {
    return (
      <SelectionList
        multiple
        options={(question.options ?? []).map((option) => ({
          title: option.text,
          description: option.description,
        }))}
        value={Array.isArray(value) ? value : []}
        onChange={(selectedValues) => onChange(selectedValues)}
        disabled={disabled}
      />
    );
  }

  if (type === ONBOARDING_QUESTION_TYPE.DROPDOWN) {
    const dropdownOptions = (question.options ?? []).map((option) => ({
      label: option.text,
      value: option.text,
      description: option.description,
    }));
    return (
      <Select
        name="dropdown"
        options={dropdownOptions}
        value={typeof value === "string" ? value : ""}
        onValueChange={(selectedValue) => onChange(selectedValue)}
        disabled={disabled}
        pickerStyle={styles.dropdownTrigger}
        modalContentStyle={styles.modalCard}
        renderModalHeader={() => (
          <>
            <Text style={styles.modalTitle}>{t("onboarding.choose_one")}</Text>
            <View style={styles.modalDivider} />
          </>
        )}
        renderOption={(option, isSelected, onSelect) => {
          const desc = dropdownOptions.find(
            (dropdownOption) => dropdownOption.value === option.value,
          )?.description;
          return (
            <TouchableOpacity
              style={[styles.modalItem, isSelected && styles.modalItemSelected]}
              onPress={onSelect}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.modalItemTitle}>{option.label}</Text>
                {!!desc && desc.trim().length > 0 && (
                  <Text style={styles.modalItemDescription}>{desc}</Text>
                )}
              </View>
              {isSelected && (
                <Animated.Image
                  source={Images.REQUEST_ACCEPT}
                  style={styles.checkIcon}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          );
        }}
      />
    );
  }

  if (type === ONBOARDING_QUESTION_TYPE.RANGE) {
    const min = rangeMin;
    const max = question.range?.max ?? ONBOARDING_DEFAULT_AGE_MAX;
    const numericValue = typeof value === "number" ? Math.max(value, min) : min;
    return (
      <AgeSlider
        value={numericValue}
        onChange={(newValue) => onChange(newValue)}
        min={min}
        max={max}
        disabled={disabled}
        hintText={t("onboarding.slider_hint")}
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  textInput: {
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Platform.OS === "ios" ? Matrics.vs(14) : Matrics.vs(12),
    borderWidth: 1,
    borderColor: "rgba(26, 26, 26, 0.14)",
    borderRadius: Matrics.s(14),
    backgroundColor: "rgba(26, 26, 26, 0.02)",
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  checkIcon: {
    width: Matrics.s(20),
    height: Matrics.s(20),
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(14),
    borderWidth: 1,
    borderColor: "rgba(26, 26, 26, 0.14)",
    borderRadius: Matrics.s(14),
    backgroundColor: "rgba(26, 26, 26, 0.02)",
  },
  modalCard: {
    maxHeight: "70%",
    borderRadius: Matrics.s(18),
    backgroundColor: colors.WHITE,
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(14),
  },
  modalTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "rgba(26, 26, 26, 0.10)",
    marginTop: Matrics.vs(10),
    marginBottom: Matrics.vs(6),
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Matrics.s(14),
    paddingVertical: Matrics.vs(12),
    borderRadius: Matrics.s(14),
    borderWidth: 1,
    borderColor: "rgba(26, 26, 26, 0.12)",
    backgroundColor: "rgba(26, 26, 26, 0.02)",
  },
  modalItemSelected: {
    borderColor: "rgba(47, 89, 235, 0.65)",
    backgroundColor: "rgba(47, 89, 235, 0.06)",
  },
  modalItemTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  modalItemDescription: {
    marginTop: Matrics.vs(4),
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
    opacity: 0.65,
    lineHeight: Matrics.vs(16),
  },
});

export default PreferenceQuestionRenderer;
