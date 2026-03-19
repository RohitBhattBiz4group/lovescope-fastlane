import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  colors,
  Matrics,
  FontsSize,
  typography
} from "../../config/appStyling";
import Select from "../../components/common/Select";
import Button from "../../components/common/Button";
import TextArea from "../../components/common/TextArea";
import useTranslation from "../../hooks/useTranslation";
import useAnalyzerImages from "../../hooks/useAnalyzerImages";
import InputFormatSection, { replaceWithCdnUrl } from "../../components/analyzer/InputFormatSection";
import TimelineSummaryCard from "../../components/analyzer/TimelineSummaryCard";
import { getTextAnalyzerSchema } from "../../validation/analyzer";
import {
  InputFormatType,
  INPUT_FORMAT_TEXT,
  ANALYZER_ERROR_TEXT_MAX_LENGTH,
  INPUT_FORMAT_IMAGE
} from "../../constants/commonConstant";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { AnalyzerNavigationProp, AnalyzerStackParamList } from "../../interfaces/navigationTypes";
import { toastMessageError, toastMessageUpgrade } from "../../components/common/ToastMessage";
import useAuth from "../../hooks/useAuth";
import profileService from "../../services/profileService";
import analyzerService from "../../services/analyzerService";
import timelineService from "../../services/timelineService";
import { ILoveProfile } from "../../interfaces/profileInterfaces";
import { TimelineSummaryResponse } from "../../interfaces/timelineInterface";
interface TextAnalysisFormData {
  profile: string;
  inputType: InputFormatType;
  conversationText: string;
  context: string;
  specify_output_context?: string;
  timeline_reference?: string;
  want_to_add_more_context?: boolean;
}

const TextAnalysis: React.FC = () => {
  const navigation = useNavigation<AnalyzerNavigationProp>();
  const route = useRoute<RouteProp<AnalyzerStackParamList, "TextAnalysis">>();
  const { t } = useTranslation();
  const { authData } = useAuth();
  const currentPlan = authData?.plan;
  const hasNoPlan = currentPlan?.product_id === null || currentPlan?.product_id === undefined;

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
  const routeAnalysisCount = route.params?.analysisCount ?? 0;


  const [profiles, setProfiles] = useState<ILoveProfile[]>(routeProfiles);
  const [analysisCount, setAnalysisCount] = useState(routeAnalysisCount);
  const [profilesLoading, setProfilesLoading] = useState(
    routeProfiles.length === 0
  );
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string; summary?: string } | null>(null);
  const [timelineSummary, setTimelineSummary] = useState<TimelineSummaryResponse | undefined>(undefined);
  const [timelineSummaryLoading, setTimelineSummaryLoading] = useState(false);
  const [showTimelineSelect, setShowTimelineSelect] = useState(false);
  useEffect(() => {
    if (routeProfiles.length === 0) {
      const fetchProfiles = async () => {
        try {
          const response = await profileService.getProfiles();
          console.log("Profile response", response);
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
  const [inputFormat, setInputFormat] =
    useState<InputFormatType>(INPUT_FORMAT_IMAGE);
  const [loading, setLoading] = useState(false);
  const [fetchingAnalysis, setFetchingAnalysis] = useState(false);

  const {
    preselectedImages,
    uploadedImages,
    setPreselectedImages,
    setUploadedImages,
    handleImagePick,
    handleRemoveImage,
    getPresignedUrlsPerImage,
    resetImages,
    lastUploadRef,
  } = useAnalyzerImages();

  const timelineReferenceOptions = [
    {
      label: "Last 7 Days",
      value: "last_7_days",
    },
    {
      label: "Last 30 Days",
      value: "last_30_days",
    },
    {
      label: "All Time",
      value: "all_time",
    },
    {
      label: "Pick One Event",
      value: "pick_one_event",
    },
    {
      label: "None",
      value: "none",
    },
  ];

  const timelineScopeLabels: Record<string, string> = {
    last_7_days: "Last 7 Days",
    last_30_days: "Last 30 Days",
    all_time: "All Time",
  };

  // Build profile options from the provided profiles
  const profileOptions = profiles.map((profile) => ({
    label:
      profile.full_name && profile.full_name.length > 20
        ? `${profile.full_name.substring(0, 20)}...`
        : profile.full_name,
    value: String(profile.id)
  }));

  // Initialize form state and validation for the text analyzer screen
  const {
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { isValid }
  } = useForm<TextAnalysisFormData>({
    resolver: yupResolver(getTextAnalyzerSchema(currentPlan)) as any,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      profile: "",
      inputType: INPUT_FORMAT_TEXT,
      conversationText: "",
      context: "",
      timeline_reference: "",
      want_to_add_more_context: false,
    },
  });

  // Watch the profile field to detect when user changes
  const selectedProfile = watch("profile");
  const [previousProfile, setPreviousProfile] = useState<string>("");
  const timelineReference = watch("timeline_reference");
  const wantToAddMoreContext = watch("want_to_add_more_context");

  // Handle selected event when returning from RelationshipTimeline
  const routeSelectedEvent = (route?.params as any)?.selectedEvent as { id: string; title: string; summary?: string } | undefined;
  
  useEffect(() => {
    if (routeSelectedEvent) {
      setSelectedEvent(routeSelectedEvent);
      // Set timeline reference to indicate an event is selected
      setValue("timeline_reference", "pick_one_event", { shouldValidate: true });
    }
  }, [routeSelectedEvent, setValue]);

  // Fetch timeline summary when scope changes to last_7_days/last_30_days/all_time
  const isTimelineScope = timelineReference === "last_7_days" || timelineReference === "last_30_days" || timelineReference === "all_time";

  useEffect(() => {
    if (isTimelineScope && selectedProfile && Number(selectedProfile) > 0) {
      const fetchSummary = async () => {
        setTimelineSummaryLoading(true);
        try {
          const response = await timelineService.getTimelineSummary(
            Number(selectedProfile),
            timelineReference || ""
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
  }, [timelineReference, selectedProfile]);

  // Reset form fields when profile changes and fetch previous analyses
  useEffect(() => {
    if (selectedProfile && selectedProfile !== previousProfile) {
      if (previousProfile !== "") {
        // Reset all form fields except profile
        setValue("conversationText", "", {
          shouldDirty: false,
          shouldValidate: true
        });
        setValue("context", "", { shouldDirty: false, shouldValidate: true });
        setValue("specify_output_context", "", {
          shouldDirty: false,
          shouldValidate: false
        });
        setValue("timeline_reference", "", {
          shouldDirty: false,
          shouldValidate: true,
        });
        setSelectedEvent(null);
        setTimelineSummary(undefined);
        setValue("want_to_add_more_context", false, { shouldValidate: true });
        // Reset input format to default
        setInputFormat(INPUT_FORMAT_TEXT);
        setValue("inputType", INPUT_FORMAT_TEXT, {
          shouldDirty: false,
          shouldValidate: true
        });
        // Clear selected images
        setPreselectedImages([]);
        setUploadedImages([]);
        lastUploadRef.current = { signature: "", urls: [] };
      }

      // Fetch text analyses for the selected profile
      const fetchAnalyses = async () => {
        setFetchingAnalysis(true);
        try {
          const response = await analyzerService.getTextAnalyses(
            Number(selectedProfile)
          );
          if (response.success && response.data) {
            const { form_value, timeline_reference, event_id, event_title, event_summary } = response.data;
            if (form_value.type) {
              setInputFormat(form_value.type as InputFormatType);
              setValue("inputType", form_value.type as InputFormatType, {
                shouldDirty: false,
                shouldValidate: true
              });
            }
            if (form_value.conversation_text) {
              setValue("conversationText", form_value.conversation_text, {
                shouldDirty: false,
                shouldValidate: true
              });
            }
            if (form_value.context) {
              setValue("context", form_value.context, {
                shouldDirty: false,
                shouldValidate: true
              });
            }
            if (form_value.specify_output) {
              setValue("specify_output_context", form_value.specify_output, {
                shouldDirty: false,
                shouldValidate: true
              });
            }
            if (form_value.image_url && form_value.image_url.length > 0) {
              const imageAssets = form_value.image_url.map((url: string) => ({
                uri: url,
              }));
              setPreselectedImages(imageAssets);
            }
            // Fetch timeline_reference from top-level response (preferred) or fallback to form_value
            const timelineRef = timeline_reference || form_value.timeline_reference;
            if (timelineRef) {
              setValue("timeline_reference", timelineRef, { shouldDirty: false, shouldValidate: true });
            }
            // Fetch selected event details from top-level response (preferred) or fallback to form_value
            const eventId = event_id || form_value.selected_event_id;
            const eventTitle = event_title || form_value.selected_event_title;
            const eventSummary = event_summary || form_value.selected_event_summary;

            // Set selected event if we have eventId or eventSummary (eventTitle can be null)
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
          console.error("Error fetching text analyses", error);
        } finally {
          setFetchingAnalysis(false);
        }
      };
      fetchAnalyses();
    }
    // Update previous profile to current
    setPreviousProfile(selectedProfile || "");
  }, [selectedProfile, previousProfile, setValue]);

  // Handle form submission: branch between text and image flows and navigate to results
  const handleAnalyze = async (data: TextAnalysisFormData) => {
    if (!isValid) {
      return;
    }
    setLoading(true);
    try {

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

      if (inputFormat === INPUT_FORMAT_TEXT) {
        // Text-only flow: pass the conversation and context directly to the result screen
        let dataToBePassed = {
          profile: Number(data.profile),
          inputType: data.inputType,
          conversationText: data.conversationText,
          context: data.context,
          specify_output_context: data.specify_output_context,
          timeline_reference: data.timeline_reference || null,
          selected_event_id: selectedEvent?.id || null,
          selected_event_title: selectedEvent?.title || null,
          selected_event_summary: selectedEvent?.summary || null,
        };
        navigation.navigate("TextAnalysisResult", dataToBePassed);
      } else {
        // Image flow: ensure at least one image is selected
        const totalImages = preselectedImages.length + uploadedImages.length;
        if (totalImages === 0) {
          toastMessageError(t("analyzer.text_analyzer.image_required"));
          return;
        }

        // Get URLs from preselected images (already have URLs) and replace with CDN URL
        const preFilledUrls = preselectedImages
          .filter((i) => i.uri?.startsWith("http"))
          .map((i) => replaceWithCdnUrl(i.uri as string));

        let imageUrls: string[] = [...preFilledUrls];

        if (uploadedImages.length > 0) {
          const currentSignature = uploadedImages
            .map(
              (i) => `${i.uri || ""}|${i.fileSize || 0}|${i.fileName || ""}|${i.type || ""}`
            )
            .join(",");
          if (
            lastUploadRef.current.signature === currentSignature &&
            lastUploadRef.current.urls.length === uploadedImages.length
          ) {
            imageUrls = [...preFilledUrls, ...lastUploadRef.current.urls];
          } else {
            const presignedUrls = await getPresignedUrlsPerImage(Number(data.profile));
            if (presignedUrls.length == 0) {
              toastMessageError(t("analyzer.text_analyzer.image_upload_failed"));
              return;
            }
            imageUrls = [...preFilledUrls, ...presignedUrls];
            lastUploadRef.current = {
              signature: currentSignature,
              urls: presignedUrls,
            };
          }
        }
        // Navigate with references to uploaded images for downstream analysis
        let dataToBePassed = {
          profile: Number(data.profile),
          inputType: data.inputType,
          context: data.context,
          specify_output_context: data.specify_output_context,
          imageUrl: imageUrls,
          timeline_reference: data.timeline_reference || null,
          selected_event_id: selectedEvent?.id || null,
          selected_event_title: selectedEvent?.title || null,
          selected_event_summary: selectedEvent?.summary || null,
        };
        navigation.navigate("TextAnalysisResult", dataToBePassed);
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle between text and image flows and keep the form value in sync
  const handleInputFormatChange = (format: InputFormatType) => {
    setInputFormat(format);
    setValue("inputType", format, { shouldDirty: true, shouldValidate: true });
  };

  // Reset form to initial state
  const handleReset = () => {
    reset();
    setInputFormat(INPUT_FORMAT_TEXT);
    resetImages();
    setSelectedEvent(null);
    setTimelineSummary(undefined);
    setValue("want_to_add_more_context", false, { shouldValidate: true });
  };

  // Handle timeline reference change — called after field.onChange already set the form value
  const handleTimelineReferenceChange = (value: string) => {
    if (value === "none") {
      // Clear timeline reference
      setValue("timeline_reference", "", { shouldValidate: true });
      setSelectedEvent(null);
      setTimelineSummary(undefined);
      setValue("want_to_add_more_context", false, { shouldValidate: true });
      setShowTimelineSelect(false);
      return;
    }
    // Profile must be selected for any timeline option
    if (!selectedProfile || Number(selectedProfile) <= 0) {
      toastMessageError(
        t("quiz.create.select_profile_first") || "Please select a profile first",
        t("quiz.create.select_profile_to_pick_event") || "You need to select a profile before picking an event"
      );
      setValue("timeline_reference", "", { shouldValidate: true });
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
      setValue("want_to_add_more_context", false, { shouldValidate: true });
      setShowTimelineSelect(false);
    }
  };

  // Watch form values to check if any text field is filled
  const conversationText = watch("conversationText");
  const context = watch("context");
  const specifyOutputContext = watch("specify_output_context");

  // Check if form has any data filled - at least one text field must have content or images selected
  const isFormFilled =
    (conversationText && conversationText.trim().length > 0) ||
    (context && context.trim().length > 0) ||
    (specifyOutputContext && specifyOutputContext.trim().length > 0) ||
    preselectedImages.length > 0 ||
    uploadedImages.length > 0;

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>{t("analyzer.text_analyzer.title")}</Text>
          <Text style={styles.subtitle}>
            {t("analyzer.text_analyzer.subtitle")}
          </Text>
        </View>

        {/* Profile Select */}
        <Select
          label={t("analyzer.text_analyzer.profile")}
          placeholder={t("analyzer.text_analyzer.select_desired_profile")}
          options={profileOptions}
          name="profile"
          control={control}
          disabled={profiles.length === 0}
          loading={profilesLoading}
          required
        />

        {fetchingAnalysis && (
          <ActivityIndicator size="large" color={colors.PRIMARY} style={styles.fetchingIndicator} />
        )}

        {/* Input Format Section */}
        <InputFormatSection
          inputFormat={inputFormat}
          onInputFormatChange={handleInputFormatChange}
          preselectedImages={preselectedImages}
          uploadedImages={uploadedImages}
          onImagePick={handleImagePick}
          onRemoveImage={handleRemoveImage}
          disabled={fetchingAnalysis}
        />
        {/* Conversation Text */}
        {inputFormat === INPUT_FORMAT_TEXT && (
          <TextArea
            label={t("analyzer.text_analyzer.conversation_text")}
            name="conversationText"
            control={control}
            placeholder={t(
              "analyzer.text_analyzer.conversation_text_placeholder"
            )}
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
            maxLength={Number(currentPlan?.limits?.text_limit)}
            charCountWarningThreshold={hasNoPlan ? ANALYZER_ERROR_TEXT_MAX_LENGTH : undefined}
            upgradeCtaText={hasNoPlan ? t("analyzer.text_analyzer.upgrade_for_longer_analysis") : undefined}
            onUpgradePress={hasNoPlan ? handleUpgradePress : undefined}
            required
            showCharCount
            editable={!fetchingAnalysis}
          />
        )}

        {/* Timeline Reference */}
        <View style={{ marginTop: Matrics.vs(-8) }}>
          {/* Select always visible — readonly when a timeline scope is active */}
          <Controller
            name="timeline_reference"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label={t("quiz.create.timeline_reference_label") || "Timeline Reference"}
                name="timeline_reference"
                placeholder={t("quiz.create.timeline_reference_placeholder") || "Select timeline reference"}
                options={timelineReferenceOptions}
                value={field.value || ""}
                onValueChange={(value: string) => {
                  field.onChange(value);
                  handleTimelineReferenceChange(value);
                }}
                error={fieldState?.error?.message}
                disabled={fetchingAnalysis || (isTimelineScope && !showTimelineSelect)}
                autoOpen={showTimelineSelect}
              />
            )}
          />
          {/* Summary card below the Select */}
          {isTimelineScope && (timelineSummary || timelineSummaryLoading) && (
            <TimelineSummaryCard
              data={timelineSummary}
              scopeLabel={timelineScopeLabels[timelineReference || ""] || ""}
              onChangeScope={() => setShowTimelineSelect(true)}
              loading={timelineSummaryLoading}
            />
          )}
          {/* Selected Event Display */}
          {timelineReference === "pick_one_event" && selectedEvent && (
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
          {timelineReference && timelineReference !== "pick_one_event" && (
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setValue("want_to_add_more_context", !wantToAddMoreContext, { shouldValidate: true })}
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
        {(!timelineReference || wantToAddMoreContext) && (
          <View style={{ marginTop: Matrics.vs(-8) }}>
            <TextArea
              label={t("analyzer.text_analyzer.context")}
              name="context"
              control={control}
              placeholder={t("analyzer.text_analyzer.context_placeholder")}
              placeholderTextColor="rgba(47, 46, 44, 0.6)"
              maxLength={Number(currentPlan?.limits?.text_limit)}
              charCountWarningThreshold={hasNoPlan ? ANALYZER_ERROR_TEXT_MAX_LENGTH : undefined}
              upgradeCtaText={hasNoPlan ? t("analyzer.text_analyzer.upgrade_for_longer_analysis") : undefined}
              onUpgradePress={hasNoPlan ? handleUpgradePress : undefined}
              showCharCount
              required={!timelineReference || !!wantToAddMoreContext}
              editable={!fetchingAnalysis}
            />
          </View>
        )}

        <View style={{ marginTop: Matrics.vs(-8) }}>
          <TextArea
            label={t("analyzer.text_analyzer.specify_output")}
            name="specify_output_context"
            control={control}
            placeholder={t("analyzer.text_analyzer.specify_output_placeholder")}
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
            maxLength={Number(currentPlan?.limits?.text_limit)}
            charCountWarningThreshold={hasNoPlan ? ANALYZER_ERROR_TEXT_MAX_LENGTH : undefined}
            upgradeCtaText={hasNoPlan ? t("analyzer.text_analyzer.upgrade_for_longer_analysis") : undefined}
            onUpgradePress={hasNoPlan ? handleUpgradePress : undefined}
            showCharCount
            editable={!fetchingAnalysis}
          />
        </View>
        <Text>{isValid}</Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button
              title={t("analyzer.text_analyzer.analyze")}
              onPress={handleSubmit(handleAnalyze)}
              containerStyle={styles.analyzeButton}
              disabled={!isValid || loading || fetchingAnalysis}
              loading={loading}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              title={t("analyzer.text_analyzer.reset")}
              onPress={handleReset}
              containerStyle={styles.resetButton}
              disabled={!isFormFilled || loading || fetchingAnalysis}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent"
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: Matrics.ms(20),
    paddingTop: Matrics.vs(5),
    paddingBottom: Matrics.vs(40)
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
  fetchingIndicator: {
    marginVertical: Matrics.vs(20)
  },
  selectedTimelineCard: {
    borderRadius: Matrics.ms(10),
    padding: Matrics.ms(16),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.15)",
    overflow: "hidden"
  },
  selectedTimelineTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.ms(10)
  },
  selectedTimelineDescription: {
    fontSize: FontsSize.Medium,
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
  // Button Styles
  buttonContainer: {
    flexDirection: "row",
    gap: Matrics.s(12),
    marginTop: Matrics.vs(20),
    marginBottom: Matrics.vs(20)
  },
  buttonWrapper: {
    flex: 1
  },
  resetButton: {
    width: "100%",
    borderColor: "#6c757d"
  },
  analyzeButton: {
    width: "100%"
  }
});

export default TextAnalysis;
