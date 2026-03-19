import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getArgumentAnalyzerSchema } from "../../validation/analyzer";
import {
  colors,
  Matrics,
  FontsSize,
  typography,
} from "../../config/appStyling";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import TextArea from "../../components/common/TextArea";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { AnalyzerNavigationProp, AnalyzerStackParamList } from "../../interfaces/navigationTypes";
import LinearGradient from "react-native-linear-gradient";
import useTranslation from "../../hooks/useTranslation";
import useAnalyzerImages from "../../hooks/useAnalyzerImages";
import profileService from "../../services/profileService";
import argumentAnalyzerService from "../../services/argumentAnalyzerService";
import { ILoveProfile } from "../../interfaces/profileInterfaces";
import { toastMessageError, toastMessageUpgrade } from "../../components/common/ToastMessage";
import InputFormatSection from "../../components/analyzer/InputFormatSection";
import TimelineSummaryCard from "../../components/analyzer/TimelineSummaryCard";
import {
  InputFormatType,
  INPUT_FORMAT_TEXT,
  INPUT_FORMAT_IMAGE,
  ANALYZER_ERROR_TEXT_MAX_LENGTH
} from "../../constants/commonConstant";
import { Asset } from "react-native-image-picker";
import useAuth from "../../hooks/useAuth";
import timelineService from "../../services/timelineService";
import { TimelineSummaryResponse } from "../../interfaces/timelineInterface";


interface ArgumentAnalysisFormData {
  profile: string;
  inputType: InputFormatType;
  timelineReference: string;
  context: string;
  conversationText: string;
  wantToAddMoreContext?: boolean;
}

const ArgumentAnalysis: React.FC = () => {
  const navigation = useNavigation<AnalyzerNavigationProp>();
  const route = useRoute<RouteProp<AnalyzerStackParamList, "ArgumentAnalysis">>();
  const routeAnalysisCount = route.params?.analysisCount ?? 0;
  
  const { t } = useTranslation();
  
  const { authData } = useAuth();
  const currentPlan = authData?.plan;

  const hasNoPlan = currentPlan?.product_id === null || currentPlan?.product_id === undefined;
  const argumentAnalysisSchema = getArgumentAnalyzerSchema(currentPlan);

  const handleUpgradePress = () => {
    const parentNav = navigation.getParent?.();
    if (parentNav) {
      parentNav.navigate("SettingsTab", {
        screen: "Subscription",
        params: {
          navigationFrom: {
            tab: "FilesTab",
            screen: route?.name,
          },
        },
      });
      return;
    }
    (navigation as any).navigate?.("Subscription", {
      navigationFrom: {
        tab: "FilesTab",
        screen: route?.name,
      },
    });
  };

  const routeProfiles = route.params?.profiles ?? [];
  const [profiles, setProfiles] = useState<ILoveProfile[]>(routeProfiles);
  const [profilesLoading, setProfilesLoading] = useState(routeProfiles.length === 0);
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string; summary?: string } | null>(null);
  const [timelineSummary, setTimelineSummary] = useState<TimelineSummaryResponse | undefined>(undefined);
  const [timelineSummaryLoading, setTimelineSummaryLoading] = useState(false);
  const [showTimelineSelect, setShowTimelineSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingFormData, setFetchingFormData] = useState(false);
  const [inputFormat, setInputFormat] = useState<InputFormatType>(INPUT_FORMAT_IMAGE);
  const [analysisCount, setAnalysisCount] = useState(routeAnalysisCount);

  const {
    preselectedImages,
    uploadedImages,
    setPreselectedImages,
    setUploadedImages,
    handleImagePick,
    handleRemoveImage,
    getPresignedUrlsPerImage,
    lastUploadRef,
  } = useAnalyzerImages();

  useEffect(() => {
    if (routeProfiles.length === 0) {
      const fetchProfiles = async () => {
        try {
          const response = await profileService.getProfiles();
          if (response.success && response.data) {
            setProfiles(response.data);
            setAnalysisCount(Number(response.extra_data?.analysis_count ?? 0));
          }
        } catch (error) {
          console.error("Error fetching profiles", error);
        } finally {
          setProfilesLoading(false);
        }
      };
      fetchProfiles();
    }
  }, []);

  const profileOptions = profiles.map((profile) => ({
    label:
      profile.full_name && profile.full_name.length > 20
        ? `${profile.full_name.substring(0, 20)}...`
        : profile.full_name,
    value: String(profile.id),
  }));

  const timelineReferenceOptions = [
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "Last 30 Days", value: "last_30_days" },
    { label: "All Time", value: "all_time" },
    { label: "Pick One Event", value: "pick_one_event" },
    { label: "None", value: "none" },
  ];

  const timelineScopeLabels: Record<string, string> = {
    last_7_days: "Last 7 Days",
    last_30_days: "Last 30 Days",
    all_time: "All Time",
  };

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { isValid },
  } = useForm<ArgumentAnalysisFormData>({
    resolver: yupResolver(argumentAnalysisSchema) as any,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      profile: "",
      inputType: INPUT_FORMAT_TEXT,
      timelineReference: "",
      context: "",
      conversationText: "",
      wantToAddMoreContext: false,
    },
  });

  const contextText = watch("context");
  const wantToAddMoreContext = watch("wantToAddMoreContext");
  const conversationText = watch("conversationText");

  const selectedTimeline = watch("timelineReference");
  const isTimelineScope = selectedTimeline === "last_7_days" || selectedTimeline === "last_30_days" || selectedTimeline === "all_time";

  // Watch the profile field to detect when user changes
  const selectedProfile = watch("profile");
  const [previousProfile, setPreviousProfile] = useState<string>("");

  // Handle selected event when returning from RelationshipTimeline
  const routeSelectedEvent = (route?.params as Record<string, unknown>)?.selectedEvent as { id: string; title: string; summary?: string } | undefined;
  
  useEffect(() => {
    if (routeSelectedEvent) {
      setSelectedEvent(routeSelectedEvent);
      // Set timeline reference to indicate an event is selected
      setValue("timelineReference", "pick_one_event", { shouldValidate: true });
    }
  }, [routeSelectedEvent, setValue]);

  // Fetch timeline summary when scope changes to last_7_days/last_30_days/all_time
  useEffect(() => {
    if (isTimelineScope && selectedProfile && Number(selectedProfile) > 0) {
      const fetchSummary = async () => {
        setTimelineSummaryLoading(true);
        try {
          const response = await timelineService.getTimelineSummary(
            Number(selectedProfile),
            selectedTimeline || ""
          );
          if (response.success && response.data) {
            setTimelineSummary(response.data);
          }
        } catch (error) {
          console.error("Error fetching timeline summary", error);
        } finally {
          setTimelineSummaryLoading(false);
        }
      };
      fetchSummary();
    } else {
      setTimelineSummary(undefined);
    }
  }, [selectedTimeline, selectedProfile]);

  // Reset form fields when profile changes and fetch previous form data
  useEffect(() => {
    if (
      selectedProfile &&
      selectedProfile !== previousProfile
    ) {
      if (previousProfile !== "") {
        // Reset all form fields except profile
        setValue("conversationText", "", {
          shouldDirty: false,
          shouldValidate: true,
        });
        setValue("context", "", { shouldDirty: false, shouldValidate: true });
        setValue("timelineReference", "", {
          shouldDirty: false,
          shouldValidate: false,
        });
        setSelectedEvent(null);
        setTimelineSummary(undefined);
        setValue("wantToAddMoreContext", false, { shouldValidate: true });
        // Reset input format to default
        setInputFormat(INPUT_FORMAT_TEXT);
        setValue("inputType", INPUT_FORMAT_TEXT, {
          shouldDirty: false,
          shouldValidate: true,
        });
        // Clear selected images
        setPreselectedImages([]);
        setUploadedImages([]);
        lastUploadRef.current = { signature: "", urls: [] };
      }

      // Fetch form data for the selected profile
      const fetchFormData = async () => {
        setFetchingFormData(true);
        try {
          const response = await argumentAnalyzerService.getFormData(Number(selectedProfile));
          if (response.success && response.data) {
            const data = response.data as unknown as Record<string, unknown>;
            const form_value = (data.form_value || data) as Record<string, unknown>;
            if (form_value.type) {
              setInputFormat(form_value.type as InputFormatType);
              setValue("inputType", form_value.type as InputFormatType, { shouldDirty: false, shouldValidate: true });
            }
            if (form_value.conversation_text) {
              setValue("conversationText", String(form_value.conversation_text), { shouldDirty: false, shouldValidate: true });
            }
            if (form_value.context) {
              setValue("context", String(form_value.context), { shouldDirty: false, shouldValidate: true });
            }
            if (form_value.image_url && Array.isArray(form_value.image_url) && form_value.image_url.length > 0) {
              const imageAssets: Asset[] = (form_value.image_url as string[]).map((url) => ({
                uri: url,
              }));
              setPreselectedImages(imageAssets);
            }
            // Restore timeline_reference and selected event from response if present
            const timelineRef = (data.timeline_reference ?? form_value.timeline_reference) as string | undefined;
            if (timelineRef) {
              setValue("timelineReference", timelineRef, { shouldDirty: false, shouldValidate: true });
            }
            const eventId = (data.event_id ?? form_value.selected_event_id) as string | undefined;
            const eventTitle = (data.event_title ?? form_value.selected_event_title) as string | undefined;
            const eventSummary = (data.event_summary ?? form_value.selected_event_summary) as string | undefined;
            if (eventId || eventSummary) {
              setSelectedEvent({
                id: eventId || "",
                title: eventTitle || eventSummary || "Selected Event",
                summary: eventSummary || undefined,
              });
            } else {
              setSelectedEvent(null);
            }
          }
        } catch (error) {
          console.error("Error fetching argument form data", error);
        } finally {
          setFetchingFormData(false);
        }
      };
      fetchFormData();
    }
    // Update previous profile to current
    setPreviousProfile(selectedProfile || "");
  }, [selectedProfile, previousProfile, setValue]);

  // Reset form to initial state
  const handleReset = () => {
    reset();
    setInputFormat(INPUT_FORMAT_TEXT);
    setUploadedImages([]);
    setPreselectedImages([]);
    setSelectedEvent(null);
    setTimelineSummary(undefined);
    setValue("wantToAddMoreContext", false, { shouldValidate: true });
    lastUploadRef.current = { signature: "", urls: [] };
  };

  // Handle timeline reference change — called after field.onChange already set the form value
  const handleTimelineReferenceChange = (value: string) => {
    if (value === "none") {
      // Clear timeline reference
      setValue("timelineReference", "", { shouldValidate: true });
      setSelectedEvent(null);
      setTimelineSummary(undefined);
      setValue("wantToAddMoreContext", false, { shouldValidate: true });
      setShowTimelineSelect(false);
      return;
    }
    // Profile must be selected for any timeline option
    if (!selectedProfile || Number(selectedProfile) <= 0) {
      toastMessageError(
        t("quiz.create.select_profile_first") || "Please select a profile first",
        t("quiz.create.select_profile_to_pick_event") || "You need to select a profile before picking an event"
      );
      setValue("timelineReference", "", { shouldValidate: true });
      return;
    }
    if (value === "pick_one_event") {
      navigation.navigate("RelationshipTimeline" as any, {
        loveProfileId: Number(selectedProfile),
        selectionMode: true,
      });
    } else {
      // Timeline scope selected (last_7_days, last_30_days, all_time)
      setSelectedEvent(null);
      setValue("wantToAddMoreContext", false, { shouldValidate: true });
      setShowTimelineSelect(false);
    }
  };

  // Check if form has any data filled
  const isFormFilled =
    (conversationText && conversationText.trim().length > 0) ||
    (contextText && contextText.trim().length > 0) ||
    uploadedImages.length > 0 ||
    preselectedImages.length > 0;

  const handleAnalyze = async (data: ArgumentAnalysisFormData) => {

    const monthlyLimitRaw = currentPlan?.limits?.analyzer_limit;
    const monthlyLimit = monthlyLimitRaw === null || monthlyLimitRaw === undefined
      ? null
      : Number(monthlyLimitRaw);
    const usedThisMonth = Number(analysisCount ?? 0);

    if (monthlyLimit !== null && Number.isFinite(monthlyLimit) && usedThisMonth >= monthlyLimit) {
      toastMessageUpgrade(
          t("analyzer.portrait.analysis_limit_reached"),
          t("analyzer.portrait.analysis_limit_reached_message"),
          t("analyzer.portrait.upgrade_for_more"),
          () => {
            const parentNav = navigation.getParent?.();
            if (parentNav) {
              parentNav.navigate("SettingsTab", {
                screen: "Subscription",
                params: {
                  navigationFrom: {
                    tab: "FilesTab",
                    screen: route?.name,
                  },
                },
              });
              return;
            }
            (navigation as any).navigate?.("Subscription", {
              navigationFrom: {
                tab: "FilesTab",
                screen: route?.name,
              },
            });
          },
        );
      return;
    }

    setLoading(true);
    try {
      let imageUrls: string[] = [];

      if (inputFormat === INPUT_FORMAT_IMAGE) {
        if (preselectedImages.length === 0 && uploadedImages.length === 0) {
          toastMessageError(t("analyzer.text_analyzer.image_required"));
          setLoading(false);
          return;
        }

        // Add preselected image URLs first
        const preselectedUrls = preselectedImages
          .filter((img) => img.uri)
          .map((img) => img.uri as string);
        imageUrls = [...preselectedUrls];

        const newImages = uploadedImages.filter((i) => !i.uri?.startsWith("http"));

        if (newImages.length > 0) {
          const currentSignature = newImages
            .map(
              (i) => `${i.uri || ""}|${i.fileSize || 0}|${i.fileName || ""}|${i.type || ""}`
            )
            .join(",");
          if (
            lastUploadRef.current.signature === currentSignature &&
            lastUploadRef.current.urls.length === newImages.length
          ) {
            imageUrls = [...imageUrls, ...lastUploadRef.current.urls];
          } else {
            const presignedUrls = await getPresignedUrlsPerImage(Number(data.profile));
            if (presignedUrls.length === 0) {
              toastMessageError(t("analyzer.text_analyzer.image_upload_failed"));
              setLoading(false);
              return;
            }
            imageUrls = [...imageUrls, ...presignedUrls];
            lastUploadRef.current = {
              signature: currentSignature,
              urls: presignedUrls,
            };
          }
        }
      }

      navigation.navigate("ArgumentAnalysisResult", {
        profile: Number(data.profile),
        timelineReference: data.timelineReference,
        context: data.context,
        conversationText: inputFormat === INPUT_FORMAT_TEXT ? data.conversationText : undefined,
        imageUrl: inputFormat === INPUT_FORMAT_IMAGE ? imageUrls : undefined,
        inputType: inputFormat,
        selected_event_id: selectedEvent?.id || null,
        selected_event_title: selectedEvent?.title || null,
        selected_event_summary: selectedEvent?.summary || null,
      });
    } catch (error) {
      console.error("error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputFormatChange = (format: InputFormatType) => {
    setInputFormat(format);
    setValue("inputType", format, { shouldDirty: true, shouldValidate: true });
  };

  return (
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 70}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <Text style={styles.title}>{t("analyzer.argument.title")}</Text>
            <Text style={styles.subtitle}>
              {t("analyzer.argument.subtitle")}
            </Text>
          </View>

          <View style={styles.formSection}>
            <Select
              label={t("analyzer.argument.profile")}
              placeholder={t("analyzer.argument.select_profile_placeholder")}
              options={profileOptions}
              name="profile"
              control={control}
              required
              disabled={profiles.length === 0}
              loading={profilesLoading}
              containerStyle={{ marginBottom: 0 }}
            />

            {fetchingFormData && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.PRIMARY} />
              </View>
            )}

            <View style={{ marginTop: Matrics.vs(-8) }}>
              {/* Select always visible — readonly when a timeline scope is active */}
              <Controller
                name="timelineReference"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    label={t("quiz.create.timeline_reference_label") || t("analyzer.argument.timeline_reference")}
                    name="timelineReference"
                    placeholder={t("quiz.create.timeline_reference_placeholder") || t("analyzer.argument.timeline_placeholder")}
                    options={timelineReferenceOptions}
                    value={field.value || ""}
                    onValueChange={(value: string) => {
                      field.onChange(value);
                      handleTimelineReferenceChange(value);
                    }}
                    error={fieldState?.error?.message}
                    disabled={fetchingFormData || (isTimelineScope && !showTimelineSelect)}
                    autoOpen={showTimelineSelect}
                  />
                )}
              />
              {/* Summary card below the Select */}
              {isTimelineScope && (timelineSummary || timelineSummaryLoading) && (
                <TimelineSummaryCard
                  data={timelineSummary}
                  scopeLabel={timelineScopeLabels[selectedTimeline || ""] || ""}
                  onChangeScope={() => setShowTimelineSelect(true)}
                  loading={timelineSummaryLoading}
                />
              )}
              {selectedTimeline === "pick_one_event" && selectedEvent && (
                <View style={styles.selectedEventContainer}>
                  <Text style={styles.selectedEventLabel}>
                    {t("quiz.create.selected_event_label") || "Selected Event:"}
                  </Text>
                  {selectedEvent.title && (
                    <Text style={styles.selectedEventTitle}>{selectedEvent.title}</Text>
                  )}
                  {selectedEvent.summary && (
                    <Text style={styles.selectedEventSummary}>{selectedEvent.summary}</Text>
                  )}
                </View>
              )}

              {/* Add more context checkbox - visible when a timeline reference is selected */}
              {selectedTimeline && selectedTimeline !== "pick_one_event" && (
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setValue("wantToAddMoreContext", !wantToAddMoreContext, { shouldValidate: true })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, wantToAddMoreContext && styles.checkboxChecked]}>
                    {wantToAddMoreContext && <Text style={styles.checkboxTick}>{"\u2713"}</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    {t("analyzer.timeline_summary.add_more_context") || "I want to add more context"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Context - Show when no timeline reference OR when checkbox is checked */}
            {(!selectedTimeline || wantToAddMoreContext) && (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{t("analyzer.argument.context")}</Text>
                <TextArea
                  name="context"
                  control={control}
                  placeholder={t("analyzer.argument.context_placeholder")}
                  maxLength={Number(currentPlan?.limits?.text_limit)}
                  showCharCount
                  charCountWarningThreshold={hasNoPlan ? ANALYZER_ERROR_TEXT_MAX_LENGTH : undefined}
                  upgradeCtaText={hasNoPlan ? t("analyzer.text_analyzer.upgrade_for_longer_analysis") : undefined}
                  onUpgradePress={hasNoPlan ? handleUpgradePress : undefined}
                  containerStyle={styles.textAreaContainer}
                />
              </View>
            )}

            {/* Input Format Section */}
            <InputFormatSection
              inputFormat={inputFormat}
              onInputFormatChange={handleInputFormatChange}
              preselectedImages={preselectedImages}
              uploadedImages={uploadedImages}
              onImagePick={handleImagePick}
              onRemoveImage={handleRemoveImage}
              disabled={fetchingFormData}
            />

            {/* Conversation Text - Only show when Text format is selected */}
            {inputFormat === INPUT_FORMAT_TEXT && (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>
                  {t("analyzer.text_analyzer.conversation_text")}
                </Text>
                <TextArea
                  name="conversationText"
                  control={control}
                  placeholder={t("analyzer.text_analyzer.conversation_text_placeholder")}
                  maxLength={Number(currentPlan?.limits?.text_limit)}
                  showCharCount
                  charCountWarningThreshold={hasNoPlan ? ANALYZER_ERROR_TEXT_MAX_LENGTH : undefined}
                  upgradeCtaText={hasNoPlan ? t("analyzer.text_analyzer.upgrade_for_longer_analysis") : undefined}
                  onUpgradePress={hasNoPlan ? handleUpgradePress : undefined}
                  containerStyle={styles.textAreaContainer}
                />
              </View>
            )}

          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <View style={styles.buttonWrapper}>
              <Button
                title={t("analyzer.argument.analyze")}
                onPress={handleSubmit(handleAnalyze)}
                containerStyle={styles.analyzeButton}
                disabled={!isValid || loading || fetchingFormData}
                loading={loading}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <Button
                title={t("analyzer.text_analyzer.reset")}
                onPress={handleReset}
                containerStyle={styles.resetButton}
                disabled={!isFormFilled || loading || fetchingFormData}
                variant="secondary"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Matrics.ms(20),
    paddingTop: Matrics.vs(10),
    paddingBottom: Matrics.vs(20),
  },
  headerSection: {
    marginBottom: Matrics.vs(20),
  },
  title: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
  },
  subtitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  formSection: {
    gap: Matrics.vs(20),
  },
  inputWrapper: {
    marginBottom: Matrics.vs(0),
  },
  inputLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  textInputContainer: {
    marginBottom: Matrics.vs(4),
  },
  textAreaContainer: {
    marginBottom: Matrics.vs(4),
  },
  charCount: {
    fontSize: FontsSize.XSmall,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: "#A0A8AC",
    textAlign: "right",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Matrics.s(12),
    marginTop: Matrics.vs(20),
    marginBottom: Matrics.vs(20),
  },
  analyzeButton: {
    width: "100%",
  },
  buttonWrapper: {
    flex: 1,
  },
  resetButton: {
    width: "100%",
    borderColor: "#6c757d",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Matrics.vs(10),
  },
  selectedTimelineCard: {
    borderRadius: Matrics.ms(10),
    padding: Matrics.ms(16),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.15)",
    overflow: "hidden",
  },
  selectedTimelineTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.ms(10),
  },
  selectedTimelineDescription: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Matrics.vs(12),
    marginBottom: Matrics.vs(10),
  },
  checkbox: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    borderRadius: Matrics.s(4),
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(10),
    backgroundColor: colors.WHITE,
  },
  checkboxChecked: {
    backgroundColor: colors.PRIMARY,
    borderColor: colors.PRIMARY,
  },
  checkboxTick: {
    color: colors.WHITE,
    fontSize: FontsSize.XSmall,
    fontWeight: "700",
  },
  checkboxLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  selectedEventContainer: {
    backgroundColor: "rgba(47, 89, 235, 0.1)",
    borderRadius: Matrics.s(10),
    padding: Matrics.s(12),
    marginTop: Matrics.vs(10),
    marginBottom: Matrics.vs(10),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.2)",
  },
  selectedEventLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_PRIMARY,
    opacity: 0.7,
    marginBottom: Matrics.vs(4),
  },
  selectedEventTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_PRIMARY,
  },
  selectedEventSummary: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_PRIMARY,
    opacity: 0.8,
    marginTop: Matrics.vs(6),
    lineHeight: Matrics.vs(18),
  },
  inputFormatContainer: {
    marginBottom: Matrics.vs(0),
  },
  inputFormatLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  radioContainer: {
    flexDirection: "row",
    gap: Matrics.s(10),
  },
  radioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: Matrics.vs(14),
    paddingHorizontal: Matrics.s(16),
    borderRadius: Matrics.s(12),
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: "#EDF1F3",
    gap: Matrics.s(10),
  },
  radioOuter: {
    width: Matrics.s(22),
    height: Matrics.s(22),
    borderRadius: Matrics.s(11),
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.PRIMARY,
  },
  radioInner: {
    width: Matrics.s(10),
    height: Matrics.s(10),
    borderRadius: Matrics.s(5),
    backgroundColor: colors.PRIMARY,
  },
  radioText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
  },
  radioTextSelected: {
    fontFamily: typography.fontFamily.Satoshi.Medium,
  },
  uploadContainer: {
    marginBottom: Matrics.vs(0),
  },
  uploadLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: Matrics.s(16),
    paddingVertical: Matrics.vs(32),
    paddingHorizontal: Matrics.s(20),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE,
    marginBottom: Matrics.vs(8),
  },
  uploadBoxDisabled: {
    opacity: 0.5,
  },
  uploadIcon: {
    width: Matrics.s(24),
    height: Matrics.s(24),
    marginBottom: Matrics.vs(5),
  },
  uploadText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(4),
  },
  uploadSubtext: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.GRAY_DARK,
  },
  imagesScrollContainer: {
    marginTop: Matrics.vs(12),
  },
  imagesScrollContent: {
    gap: Matrics.s(10),
  },
  imagePreviewItem: {
    position: "relative",
    borderRadius: Matrics.s(12),
    overflow: "hidden",
  },
  previewImageThumb: {
    width: Matrics.s(100),
    height: Matrics.s(100),
    borderRadius: Matrics.s(12),
    borderWidth: 1,
    borderColor: "#eceff0ff",
  },
  removeImageButton: {
    position: "absolute",
    top: Matrics.vs(5),
    right: Matrics.s(5),
    width: Matrics.s(22),
    height: Matrics.s(22),
    borderRadius: Matrics.s(11),
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: colors.WHITE,
    fontSize: FontsSize.Small,
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: Matrics.s(8),
    paddingVertical: Matrics.vs(10),
    paddingHorizontal: Matrics.ms(12),
    marginTop: Matrics.vs(8),
    marginBottom: Matrics.vs(8),
  },
  warningText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: "#856404",
    textAlign: "center",
  },
});

export default ArgumentAnalysis;
