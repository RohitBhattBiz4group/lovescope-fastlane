import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Button from "../../components/common/Button";
import CommonHeader from "../../components/common/CommonHeader";
import TextInput from "../../components/common/TextInput";
import TextArea from "../../components/common/TextArea";
import Select from "../../components/common/Select";
import QuestionCountSelector from "../../components/common/QuestionCountSelector";
import Images from "../../config/Images";
import colors from "../../config/appStyling/colors";
import { useTranslation } from "../../hooks/useTranslation";
import profileService from "../../services/profileService";
import quizService from "../../services/quizService";
import timelineService from "../../services/timelineService";
import { IPreQuizResponse } from "../../interfaces/quizInterfaces";
import { TimelineSummaryResponse } from "../../interfaces/timelineInterface";
import TimelineSummaryCard from "../../components/analyzer/TimelineSummaryCard";
import {
  toastMessageError,
  toastMessageInfo,
} from "../../components/common/ToastMessage";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getCreateQuizValidation } from "../../validation/quiz";
import LinearGradient from "react-native-linear-gradient";
import { UserStackParamList } from "../../interfaces/navigationTypes";

interface ProfileOption {
  label: string;
  value: string;
}

interface QuizForm {
  quiz_title: string;
  love_profile_id: number;
  purpose: string;
  no_of_questions: number;
  quiz_category?: string;
  timeline_reference?: string;
}

const MAX_PURPOSE_LENGTH = 200;

// Timeline reference options
const TIMELINE_REFERENCE_OPTIONS = [
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 30 Days", value: "last_30_days" },
  { label: "All Time", value: "all_time" },
  { label: "Pick One Event", value: "pick_one_event" },
];

// Question count options for segmented selector
const QUESTION_COUNT_SEGMENT_OPTIONS = [
  { value: 5, label: "5", description: "Quick" },
  { value: 10, label: "10", description: "Standard" },
  { value: 15, label: "15", description: "Deep" },
];

// Helper function to determine quiz category from question count
const getQuizCategoryFromQuestionCount = (count: number): string | null => {
  if (count === 5) return "quick";
  if (count === 10) return "standard";
  if (count === 15) return "deep";
  return null;
};

const CreateNewQuiz: React.FC<ScreenProps<UserStackParamList, "CreateNewQuiz">> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const routeParams = (route?.params ?? {}) as UserStackParamList["CreateNewQuiz"];
  // Store original friend and group params to preserve them when selectedEvent is returned
  const originalParamsRef = useRef<{
    friend?: UserStackParamList["CreateNewQuiz"]["friend"];
    group?: UserStackParamList["CreateNewQuiz"]["group"]
  }>({});

  // Use ref values if params are missing (preserved from original navigation)
  const friend = routeParams.friend || originalParamsRef.current.friend;
  const group = routeParams.group || originalParamsRef.current.group;

  const [profileOptions, setProfileOptions] = useState<ProfileOption[]>([]);
  const [profilesData, setProfilesData] = useState<{ id: number; full_name: string }[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [preMadeQuizzes, setPreMadeQuizzes] = useState<IPreQuizResponse[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string; summary?: string } | null>(null);
  const [timelineSummary, setTimelineSummary] = useState<TimelineSummaryResponse | undefined>(undefined);
  const [timelineSummaryLoading, setTimelineSummaryLoading] = useState(false);
  const [showTimelineSelect, setShowTimelineSelect] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loveProfileIdRef = useRef<number>(0);
  const previousProfileIdRef = useRef<number | null>(null);
  const isPreMadeSelectionRef = useRef<boolean>(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setProfilesLoading(true);
        const response = await profileService.getProfiles();
        if (response.success) {
          if (response.data && response.data.length > 0) {
            const options = response.data.map((profile) => ({
              label: profile.full_name,
              value: String(profile.id),
            }));
            setProfileOptions(options);
            // Store profile data for accessing names
            setProfilesData(
              response.data.map((profile) => ({
                id: profile.id,
                full_name: profile.full_name,
              }))
            );
          } else {
            toastMessageInfo(
              t("analyzer.portrait.no_profiles_title"),
              t("analyzer.portrait.no_profiles_message")
            );
          }
        } else {
          toastMessageError(t("common.try_again_later"), response.message);
        }
      } catch (error) {
        console.error("Error fetching profiles", error);
        toastMessageError(
          t("common.something_went_wrong"),
          t("common.try_again_later")
        );
      } finally {
        setProfilesLoading(false);
      }
    };

    const fetchPreMadeQuizzes = async () => {
      try {
        const response = await quizService.getPreMadeQuizList();
        if (response.success && response.data) {
          setPreMadeQuizzes(response.data);
        } else {
          toastMessageError(t("quiz.create.error_fetching_premade_quizzes"));
        }
      } catch (error) {
        console.error("Error fetching pre-made quizzes", error);
        toastMessageError(
          t("common.try_again_later"),
          t("quiz.error_fetching_premade_quizzes")
        );
      }
    };

    fetchProfiles();
    fetchPreMadeQuizzes();
  }, []);

  // Store original friend and group params on initial mount or when they change
  useEffect(() => {
    if (friend && !originalParamsRef.current.friend) {
      originalParamsRef.current.friend = friend;
    }
    if (group && !originalParamsRef.current.group) {
      originalParamsRef.current.group = group;
    }
  }, [friend, group]);

  // Handle selected event when returning from RelationshipTimeline
  const routeSelectedEvent = (route?.params as any)?.selectedEvent as { id: string; title: string; summary?: string } | undefined;

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<QuizForm>({
    resolver: yupResolver(getCreateQuizValidation()) as any,
    mode: "onBlur", // Only validate when user leaves the field
    reValidateMode: "onChange", // Re-validate on change after first blur
    shouldFocusError: false, // Don't auto-focus on errors
    defaultValues: {
      quiz_title: "",
      love_profile_id: 0,
      purpose: "",
      no_of_questions: 10,
      quiz_category: undefined,
      timeline_reference: "",
    },
  });

  // Watch form values
  const purpose = watch("purpose");
  const timelineReference = watch("timeline_reference");
  const loveProfileId = watch("love_profile_id");
  const quizTitle = watch("quiz_title");

  // Handle selected event when returning from RelationshipTimeline
  useEffect(() => {
    if (routeSelectedEvent) {
      setSelectedEvent(routeSelectedEvent);
      // Set timeline reference to indicate an event is selected
      setValue("timeline_reference", "pick_one_event", { shouldValidate: true });
    }
  }, [routeSelectedEvent, setValue]);

  const timelineScopeLabels: Record<string, string> = {
    last_7_days: "Last 7 Days",
    last_30_days: "Last 30 Days",
    all_time: "All Time",
  };

  const isTimelineScope = timelineReference === "last_7_days" || timelineReference === "last_30_days" || timelineReference === "all_time";

  // Fetch timeline summary when scope changes to last_7_days/last_30_days/all_time
  useEffect(() => {
    if (isTimelineScope && loveProfileId && Number(loveProfileId) > 0) {
      const fetchSummary = async () => {
        setTimelineSummaryLoading(true);
        try {
          const response = await timelineService.getTimelineSummary(
            Number(loveProfileId),
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
  }, [timelineReference, loveProfileId]);

  // Update ref when loveProfileId changes (but don't trigger title generation)
  useEffect(() => {
    loveProfileIdRef.current = Number(loveProfileId) || 0;
  }, [loveProfileId]);

  // Update title with profile name when profile changes (if title already exists)
  useEffect(() => {
    const currentProfileId = Number(loveProfileId) || 0;

    // Skip if profile hasn't actually changed (initial render or same profile)
    if (previousProfileIdRef.current === currentProfileId) {
      previousProfileIdRef.current = currentProfileId;
      return;
    }

    // Skip if title is empty or if we're currently generating a title
    if (!quizTitle || quizTitle.trim().length === 0 || isGeneratingTitle) {
      previousProfileIdRef.current = currentProfileId;
      return;
    }

    const selectedProfile = profilesData.find(
      (profile) => profile.id === currentProfileId
    );

    if (selectedProfile?.full_name) {
      const profileName = selectedProfile.full_name.trim();
      // Check if title already starts with a profile name pattern (e.g., "Name - Title")
      const titleMatch = quizTitle.match(/^(.+?)\s*-\s*(.+)$/);

      if (titleMatch) {
        // Title already has a profile name prefix, replace it with new one
        const titleWithoutPrefix = titleMatch[2].trim();
        const newTitle = `${profileName} - ${titleWithoutPrefix}`;
        // Only update if different to avoid unnecessary updates
        if (newTitle !== quizTitle) {
          setValue("quiz_title", newTitle, { shouldValidate: true });
        }
      } else {
        // Title doesn't have a profile name prefix, add it
        if (!quizTitle.toLowerCase().startsWith(profileName.toLowerCase())) {
          setValue("quiz_title", `${profileName} - ${quizTitle}`, { shouldValidate: true });
        }
      }
    } else if (currentProfileId === 0) {
      // Profile was deselected, remove profile name prefix if exists
      const titleMatch = quizTitle.match(/^(.+?)\s*-\s*(.+)$/);
      if (titleMatch) {
        // Check if the prefix matches any profile name (likely a profile name)
        const possibleProfileName = titleMatch[1].trim();
        const titleWithoutPrefix = titleMatch[2].trim();
        // Only remove if it looks like a profile name (not too long, reasonable format)
        if (possibleProfileName.length < 50 && !possibleProfileName.includes("Quiz")) {
          setValue("quiz_title", titleWithoutPrefix, { shouldValidate: true });
        }
      }
    }

    // Update the ref to track the current profile ID
    previousProfileIdRef.current = currentProfileId;
  }, [loveProfileId, profilesData, setValue, quizTitle, isGeneratingTitle]);

  // Handle AI title generation (called automatically with debounce)
  const handleGenerateTitle = React.useCallback(async () => {
    if (!purpose || purpose.trim().length === 0) {
      return;
    }

    try {
      setIsGeneratingTitle(true);

      // Find the selected profile name if available (using ref to avoid dependency)
      const selectedProfile = profilesData.find(
        (profile) => profile.id === loveProfileIdRef.current
      );

      const response = await quizService.generateTitle({
        purpose: purpose.trim(),
        profile_name: selectedProfile?.full_name || null,
      });

      if (response.success && response.data) {
        let finalTitle = response.data.title;

        // Prepend profile name if profile is selected and title doesn't already start with it
        if (selectedProfile?.full_name) {
          const profileName = selectedProfile.full_name.trim();
          // Check if title already starts with profile name
          if (!finalTitle.toLowerCase().startsWith(profileName.toLowerCase())) {
            finalTitle = `${profileName} - ${finalTitle}`;
          }
        }

        setValue("quiz_title", finalTitle, { shouldValidate: true });
      } else {
        // Silently fail - don't show error toast for auto-generation
        console.error("Error generating title:", response.message);
      }
    } catch (error) {
      // Silently fail - don't show error toast for auto-generation
      console.error("Error generating quiz title", error);
    } finally {
      setIsGeneratingTitle(false);
    }
  }, [purpose, profilesData, setValue]);

  // Auto-generate title with debounce (5 seconds after user stops typing)
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only generate title if purpose has content and is not empty
    if (purpose && purpose.trim().length > 0) {
      // Skip title generation if a pre-made quiz was just selected
      if (isPreMadeSelectionRef.current) {
        isPreMadeSelectionRef.current = false;
        return;
      }
      // Set new timer for 3 seconds
      debounceTimerRef.current = setTimeout(() => {
        handleGenerateTitle();
      }, 3000);
    } else {
      // Clear title if purpose is empty
      setValue("quiz_title", "", { shouldValidate: true });
    }

    // Cleanup timer on unmount or when purpose changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [purpose, handleGenerateTitle, setValue]);

  const handleGenerateQuiz = (data: QuizForm) => {
    // Navigate to CreatedQuiz preview screen
    if (isValid) {
      // Auto-determine category from question count
      const autoCategory = getQuizCategoryFromQuestionCount(data.no_of_questions);

      navigation.navigate("CreatedQuiz", {
        quizTitle: data.quiz_title,
        love_profile_id: data.love_profile_id,
        purpose: data.purpose,
        questionCount: String(data.no_of_questions),
        friend_details: friend,
        group_details: group,
        quiz_type: group ? "group" : "direct",
        timeline_reference: data.timeline_reference || null,
        quiz_category: autoCategory,
        selected_event_id: selectedEvent?.id || null,
        selected_event_title: selectedEvent?.title || null,
        selected_event_summary: selectedEvent?.summary || null,
      });
    }
  };

  const handleTimelineReferenceChange = (value: string) => {
    setValue("timeline_reference", value, { shouldValidate: true });

    // Profile must be selected for any timeline option
    if (!loveProfileId || Number(loveProfileId) <= 0) {
      toastMessageError(
        t("quiz.create.select_profile_first") || "Please select a profile first",
        t("quiz.create.select_profile_to_pick_event") || "You need to select a profile before picking an event"
      );
      setValue("timeline_reference", "", { shouldValidate: true });
      return;
    }

    if (value === "pick_one_event") {
      navigation.navigate("RelationshipTimeline", {
        loveProfileId: Number(loveProfileId),
        selectionMode: true,
      });
    } else {
      // Clear selected event if not picking one event
      setSelectedEvent(null);
      setShowTimelineSelect(false);
    }
  };

  const handlePreMadeQuizSelect = (quiz: IPreQuizResponse) => {
    // Flag to prevent the debounced generate-title API call
    isPreMadeSelectionRef.current = true;
    // Clear any pending debounce timer so it doesn't fire
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setValue("quiz_title", quiz.quiz_title, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("purpose", quiz.quiz_purpose || "", {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("no_of_questions", Number(quiz.no_of_questions), {
      shouldValidate: true,
      shouldDirty: true,
    });
    // Reset timeline when selecting premade quiz
    setValue("timeline_reference", "", { shouldValidate: true });
    setSelectedEvent(null);
    setTimelineSummary(undefined);
  };

  return (
    // <View style={styles.container}>
    <LinearGradient
      colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      {/* Header */}
      <CommonHeader
        showBackButton
        title={t("quiz.create.title")}
        onBackPress={() => navigation.goBack()}
        showNotificationBadge
        onNotificationPress={() => navigation.navigate("Notifications")}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 15}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quiz Title */}
          <TextInput
            label={t("quiz.create.quiz_title_label")}
            name="quiz_title"
            // placeholder={t("quiz.create.quiz_title_placeholder")}
            control={control}
            containerStyle={styles.inputContainer}
            disable
          />

          {/* Who's This Quiz About */}
          <Select
            label={t("quiz.create.quiz_about_label")}
            name="love_profile_id"
            placeholder={t("quiz.create.quiz_about_placeholder")}
            options={profileOptions}
            control={control}
            loading={profilesLoading}
            disabled={profileOptions.length === 0}
            containerStyle={styles.inputContainer}
          />

          {/* Purpose */}
          <View style={styles.inputContainer}>
            <Text style={styles.purposeLabel}>
              {t("quiz.create.purpose_label")}
              {isGeneratingTitle && (
                <>
                  {" "}
                  <Text style={styles.generatingText}>
                    ({t("quiz.create.generating_title") || "Generating title..."})
                  </Text>
                </>
              )}
            </Text>
            <TextArea
              name="purpose"
              placeholder={t("quiz.create.purpose_placeholder")}
              control={control}
              maxLength={MAX_PURPOSE_LENGTH}
              showCharCount
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* Timeline Reference */}
          <Controller
            name="timeline_reference"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label={t("quiz.create.timeline_reference_label") || "Timeline Reference"}
                name="timeline_reference"
                placeholder={t("quiz.create.timeline_reference_placeholder") || "Select timeline reference"}
                options={TIMELINE_REFERENCE_OPTIONS}
                value={field.value || ""}
                onValueChange={(value: string) => {
                  field.onChange(value);
                  handleTimelineReferenceChange(value);
                }}
                error={fieldState?.error?.message}
                containerStyle={styles.inputContainer}
                disabled={isTimelineScope && !showTimelineSelect}
                autoOpen={showTimelineSelect}
              />
            )}
          />

          {/* Timeline Summary Card */}
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
              <Text style={styles.selectedEventTitle}>{selectedEvent.title}</Text>
              {selectedEvent.summary && (
                <Text style={styles.selectedEventSummary}>{selectedEvent.summary}</Text>
              )}
            </View>
          )}

          {/* No. of Questions (Category is auto-determined: 5=quick, 10=standard, 15=deep) */}
          <Controller
            name="no_of_questions"
            control={control}
            render={({ field, fieldState }) => (
              <QuestionCountSelector
                label={t("quiz.create.length_label") || "Length"}
                subtitle={t("quiz.create.no_of_questions_subtitle") || "Number of questions"}
                helperText={t("quiz.create.change_later_hint") || "You can change this later"}
                options={QUESTION_COUNT_SEGMENT_OPTIONS}
                value={field.value || 10}
                onValueChange={(value: number) => {
                  field.onChange(value);
                }}
                error={fieldState?.error?.message}
                containerStyle={styles.inputContainer}
              />
            )}
          />

          {/* Divider with text */}
          {preMadeQuizzes.length > 0 && (
            <View style={styles.orDividerContainer}>
              <View style={styles.orDividerLine} />
              <Text style={styles.orDividerText}>
                {t("quiz.create.or_pick_some_premade_quizzes")}
              </Text>
              <View style={styles.orDividerLine} />
            </View>
          )}

          {/* Premade Quiz Suggestions */}
          <View style={styles.suggestionsGrid}>
            {preMadeQuizzes.length > 0 &&
              preMadeQuizzes.map((quiz) => (
                <TouchableOpacity
                  key={quiz.quiz_id}
                  //xactiveOpacity={0.8}
                  style={styles.suggestionCardWrapper}
                  onPress={() => handlePreMadeQuizSelect(quiz)}
                >
                  <ImageBackground
                    source={Images.RESPONSE_BG}
                    style={styles.suggestionCard}
                    imageStyle={styles.suggestionCardImage}
                    resizeMode="cover"
                  >
                    <Text style={styles.suggestionText}>{quiz.quiz_title}</Text>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
          </View>
        </ScrollView>

        {/* Generate Quiz Button */}
        <View style={styles.bottomButtonContainer}>
          <Button
            title={t("quiz.create.generate_quiz")}
            onPress={handleSubmit(handleGenerateQuiz)}
            containerStyle={styles.generateButton}
            textStyle={styles.generateButtonText}
          />
        </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(5),
    //paddingBottom: Matrics.vs(100),
  },
  inputContainer: {
    marginBottom: Matrics.vs(15),
  },
  // Bottom Button
  bottomButtonContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(20),
    paddingTop: Matrics.vs(10),
    // backgroundColor: colors.WHITE,
  },
  generateButton: {
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(16),
  },
  generateButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    lineHeight: 16,
  },
  // Or Divider
  orDividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Matrics.vs(20),
    marginTop: Matrics.vs(5),
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  orDividerText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    opacity: 0.8,
    // marginHorizontal: Matrics.s(12),
  },
  // Suggestions Grid
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: Matrics.vs(15),
  },
  suggestionCardWrapper: {
    width: "48%",
    marginBottom: Matrics.vs(12),
  },
  suggestionCard: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(12),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.2)",
    overflow: "hidden",
    justifyContent: "center",
    minHeight: Matrics.vs(65),
  },
  suggestionCardImage: {
    borderRadius: Matrics.s(10),
  },
  suggestionText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_PRIMARY,
    lineHeight: Matrics.vs(18),
  },
  selectedEventContainer: {
    backgroundColor: "rgba(47, 89, 235, 0.1)",
    borderRadius: Matrics.s(10),
    padding: Matrics.s(12),
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
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_PRIMARY,
    opacity: 0.8,
    marginTop: Matrics.vs(4),
    lineHeight: Matrics.vs(18),
  },
  purposeLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(5),
  },
  generatingText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.SECONDARY || "#9CA3AF",
    fontStyle: "italic",
  },
});

export default CreateNewQuiz;
