import React, { useState, useEffect } from "react";
import {
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Matrics, colors, FontsSize, typography } from "../../config/appStyling";
import TextInput from "../../components/common/TextInput";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import TextArea from "../../components/common/TextArea";
import CommonHeader from "../../components/common/CommonHeader";
import AgeSlider from "../../components/common/AgeSlider";
import { commonStyles } from "../../components/common/styles";
import {
  ProfilesNavigationProp,
  AddNewProfileRouteProp,
} from "../../interfaces/navigationTypes";
import profileService from "../../services/profileService";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import { handleApiError } from "../../utils/http";
import useTranslation from "../../hooks/useTranslation";
import { getLoveProfileValidationSchema } from "../../validation/love_profile";
import LinearGradient from "react-native-linear-gradient";
import { EXCLUSIVE_OPTION_VALUES } from "../../constants/commonConstant";

interface ProfileFormData {
  name: string;
  age: number;
  gender: string;
  relationship: string;
  ethnicity: string[];
  region: string;
  about?: string;
}

interface Props {
  navigation: ProfilesNavigationProp;
  route: AddNewProfileRouteProp;
}

const AddNewProfile: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const maxAboutLength = 200;
  // Gender options with translated labels but English values for backend compatibility
  const genderOptions = [
    { label: t("love_profile.gender_male"), value: "Male" },
    { label: t("love_profile.gender_female"), value: "Female" },
    { label: t("love_profile.gender_other"), value: "Other" },
  ];
  // Relationship options for dropdown
  const relationshipOptions = [
    { label: t("love_profile.relationship_dating"), value: "Dating" },
    { label: t("love_profile.relationship_situationship"), value: "Situationship" },
    { label: t("love_profile.relationship_talking"), value: "Talking" },
    { label: t("love_profile.relationship_crush"), value: "Crush" },
    { label: t("love_profile.relationship_friend"), value: "Friend" },
    { label: t("love_profile.relationship_ex"), value: "Ex" },
    { label: t("love_profile.relationship_unsure"), value: "Unsure" },
  ];
  const ethnicityOptions = [
    { title: "Hispanic / Latino", value: "Hispanic / Latino" },
    { title: "Asian", value: "Asian" },
    { title: "White", value: "White" },
    { title: "Black / African American", value: "Black / African American" },
    { title: "Native American / Indigenous", value: "Native American / Indigenous" },
    { title: "Middle Eastern / North African", value: "Middle Eastern / North African" },
    { title: "Prefer not to say", value: "Prefer not to say" },
    { title: "Don't know", value: "Don't know" },
  ];
  const exclusiveEthnicityValues = EXCLUSIVE_OPTION_VALUES;
  const countryOptions = [
    { label: "United States", value: "United States" },
    { label: "India", value: "India" },
    { label: "Ireland", value: "Ireland" },
    { label: "United Kingdom", value: "United Kingdom" },
    { label: "Australia", value: "Australia" },
    { label: "Canada", value: "Canada" },
    { label: "New Zealand", value: "New Zealand" },
  ];
  const [loading, setLoading] = useState(false);

  // Check if we're in edit mode
  const profile = route.params?.profile;
  const profileId = route.params?.profileId;
  const isEditMode = !!profile && !!profileId;

  const {
    handleSubmit,
    control,
    formState: { isValid },
    reset,
  } = useForm<ProfileFormData>({
    resolver: yupResolver(getLoveProfileValidationSchema()) as any,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: profile?.full_name || "",
      age: profile?.age || 16,
      gender: profile?.gender || "",
      relationship: profile?.relationship_tag || "",
      ethnicity: profile?.ethnicity || [],
      region: profile?.region || "",
      about: profile?.notes || "",
    },
  });

  // Update form when profile data is available
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.full_name,
        age: profile.age || 16,
        gender: profile.gender,
        relationship: profile.relationship_tag,
        ethnicity: profile.ethnicity || [],
        region: profile.region || "",
        about: profile.notes || "",
      });
    }
  }, [profile, reset]);

  const handleCreateProfile = async (data: ProfileFormData) => {
    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();
    setLoading(true);

    try {
      // Check internet connectivity before making the API call
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        toastMessageError(t("common.error"), t("common.network_error"));
        setLoading(false);
        return;
      }

      // Prepare data for API
      const profileData = {
        full_name: data.name,
        age: data.age,
        gender: data.gender,
        relationship_tag: data.relationship,
        ethnicity: data.ethnicity,
        region: data.region,
        notes: data.about || "",
      };

      let response;
      if (isEditMode && profileId) {
        // Update existing profile
        response = await profileService.updateProfile(profileId, profileData);
        if (response.success && response.data) {
          toastMessageSuccess(
            t("love_profile.profile_update"),
            t("love_profile.profile_updated")
          );
          navigation.goBack();
        } else {
          const errorMessage =
            response.message || t("love_profile.profile_update_failed");
          toastMessageError(
            t("love_profile.profile_update_error"),
            errorMessage
          );
        }
      } else {
        // Create new profile
        response = await profileService.createProfile(profileData);
        if (response.success && response.data) {
          toastMessageSuccess(
            t("love_profile.profile_create"),
            t("love_profile.profile_created")
          );
          navigation.goBack();
        } else {
          const errorMessage =
            response.message || t("love_profile.profile_create_failed");
          toastMessageError(
            t("love_profile.profile_create_error"),
            errorMessage
          );
        }
      }
    } catch (error) {
      handleApiError(error, undefined, "AddNewProfile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
        locations={[0.1977, 1]}
        style={styles.container}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={false}
        />

        {/* Header */}
        <CommonHeader
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          title={
            isEditMode
              ? t("love_profile.edit_profile")
              : t("love_profile.add_new_profile")
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <TextInput
            label={t("love_profile.name")}
            placeholder={t("love_profile.name_placeholder")}
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
            name="name"
            control={control}
            maxLength={100}
            disable={loading || isEditMode}
          />

          {/* Age Slider */}
          <Text >{t("love_profile.age")}</Text>
          <View style={styles.ageContainer}>
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, value } }) => (
                <AgeSlider
                  value={value}
                  onChange={onChange}
                  min={16}
                  max={60}
                  disabled={loading}
                  hintText={t("love_profile.age_slider_hint")}
                />
              )}
            />
          </View>

          {/* Gender Pills */}
          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>
              {t("love_profile.gender")}
            </Text>
            <View style={styles.genderPillsContainer}>
              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <>
                    {genderOptions.map((option) => {
                      const isSelected = value === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.genderPill,
                            isSelected && styles.genderPillSelected,
                            (loading || isEditMode) && styles.genderPillDisabled,
                          ]}
                          onPress={() => onChange(option.value)}
                          disabled={loading || isEditMode}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.genderPillText,
                              isSelected && styles.genderPillTextSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                )}
              />
            </View>
          </View>

          {/* Relationship Dropdown */}
          <Select
            label={t("love_profile.relationship")}
            placeholder={t("love_profile.relationship_placeholder")}
            options={relationshipOptions}
            name="relationship"
            control={control}
            disabled={loading}
          />

          {/* Ethnicity Multiselect Pills */}
          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>{t("love_profile.ethnicity")}</Text>
            <Controller
              control={control}
              name="ethnicity"
              render={({ field: { onChange, value } }) => (
                <View style={styles.ethnicityPillsContainer}>
                  {ethnicityOptions.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.ethnicityPill,
                          isSelected && styles.ethnicityPillSelected,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            onChange(value.filter((v: string) => v !== option.value));
                          } else if (exclusiveEthnicityValues.includes(option.value)) {
                            onChange([option.value]);
                          } else {
                            const filtered = value.filter(
                              (v: string) => !exclusiveEthnicityValues.includes(v)
                            );
                            onChange([...filtered, option.value]);
                          }
                        }}
                        disabled={loading}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.ethnicityPillText,
                            isSelected && styles.ethnicityPillTextSelected,
                          ]}
                        >
                          {option.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* Country Dropdown */}
          <Select
            label={t("love_profile.country")}
            placeholder={t("love_profile.country_placeholder")}
            options={countryOptions}
            name="region"
            control={control}
            disabled={loading}
          />

          {/* Context Input */}
          <TextArea
            label={t("love_profile.context")}
            name="about"
            control={control}
            placeholder={t("love_profile.context_placeholder")}
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
            maxLength={maxAboutLength}
            showCharCount
            editable={!loading}
          />
          <Button
            title={
              isEditMode
                ? t("love_profile.update_profile")
                : t("love_profile.save_continue")
            }
            onPress={handleSubmit(handleCreateProfile)}
            disabled={!isValid || loading}
            loading={loading}
            containerStyle={[commonStyles.buttonPrimary, styles.createButton]}
          />
          {/* <View style={styles.BottomContainer}></View> */}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Matrics.ms(20),
    paddingTop: Matrics.vs(5),
    paddingBottom: Matrics.vs(40),
  },
  createButton: {
    marginTop: Matrics.vs(20),
  },
  BottomContainer: {
    paddingHorizontal: Matrics.ms(20),
    paddingVertical: Matrics.vs(20),
  },
  ageContainer: {
    marginBottom: Matrics.vs(20),
    marginLeft: Matrics.ms(15),

  },
  ageLabel: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  genderPillsContainer: {
    flexDirection: "row",
    gap: Matrics.ms(12),
    marginTop: Matrics.vs(5),
  },
  genderPill: {
    flex: 1,
    paddingVertical: Matrics.vs(14),
    paddingHorizontal: Matrics.ms(16),
    borderRadius: Matrics.ms(12),
    borderWidth: 1,
    borderColor: "#EDF1F3",
    backgroundColor: colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
  },
  genderPillSelected: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  },
  genderPillDisabled: {
    opacity: 0.7,
  },
  genderPillText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  genderPillTextSelected: {
    color: colors.WHITE,
  },
  ethnicityPillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Matrics.ms(8),
    rowGap: Matrics.vs(8),
    marginTop: Matrics.vs(5),
  },
  ethnicityPill: {
    paddingVertical: Matrics.vs(10),
    paddingHorizontal: Matrics.ms(14),
    borderRadius: Matrics.ms(100),
    borderWidth: 1,
    borderColor: "#EDF1F3",
    backgroundColor: colors.WHITE,
  },
  ethnicityPillSelected: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  },
  ethnicityPillText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  ethnicityPillTextSelected: {
    color: colors.WHITE,
  },
});

export default AddNewProfile;
