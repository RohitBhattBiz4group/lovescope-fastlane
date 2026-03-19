import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import DateTimePicker from "@react-native-community/datetimepicker";
import Svg, { Path } from "react-native-svg";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";
import Button from "../common/Button";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TimelineEvent {
  id: number | string;
  title: string;
  date: string;
  time?: string;
  description?: string | null;
  unclear_date?: boolean;
}

interface EditTimelineEventModalProps {
  visible: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
  onSave: (event: TimelineEvent) => Promise<void>;
  loading?: boolean;
}

const EditTimelineEventModal: React.FC<EditTimelineEventModalProps> = ({
  visible,
  onClose,
  event,
  onSave,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [summary, setSummary] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [originalDate, setOriginalDate] = useState<string>("");
  const [hasTime, setHasTime] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && event) {
      setTitle(event.title || "");
      // Parse date string (YYYY-MM-DD) to Date object
      const dateParts = event.date.split("-");
      if (dateParts.length === 3) {
        setDate(new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
      } else {
        setDate(new Date());
      }
      setOriginalDate(event.date);
      setSummary(event.description || "");
      // Parse time string (HH:MM) to Date object
      if (event.time) {
        const timeParts = event.time.split(":");
        const timeDate = new Date();
        timeDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
        setTime(timeDate);
        setHasTime(true);
      } else {
        setTime(new Date());
        setHasTime(false);
      }

      // Animate modal sliding up
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate modal sliding down
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, event, slideAnim, backdropOpacity]);

  const handleClose = () => {
    if (!loading && !saveLoading) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!event || !title.trim()) {
      return;
    }

    setSaveLoading(true);
    try {
      const formattedDate = formatDateForAPI(date);
      // Check if date has changed - if so, set unclear_date to false
      const dateChanged = formattedDate !== originalDate;
      await onSave({
        ...event,
        title: title.trim(),
        date: formattedDate,
        time: hasTime ? formatTimeForAPI(time) : undefined,
        description: summary.trim() || null,
        unclear_date: dateChanged ? false : event.unclear_date,
      });
      handleClose();
    } catch (error) {
      console.error("Error saving timeline event:", error);
    } finally {
      setSaveLoading(false);
    }
  };


  const formatDateForDisplay = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatDateForAPI = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatTimeForDisplay = (t: Date): string => {
    const hours = t.getHours();
    const minutes = t.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
  };

  const formatTimeForAPI = (t: Date): string => {
    return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        setShowDatePicker(false);
        return;
      }
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        setShowTimePicker(false);
        return;
      }
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
      setHasTime(true);
    }
  };

  if (!visible || !event) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        {/* Backdrop with blur effect */}
        <TouchableWithoutFeedback onPress={handleClose} disabled={loading || saveLoading}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <BlurView
              style={styles.blurView}
              blurType="light"
              blurAmount={20}
              reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.10)"
            />
            <View style={styles.blurOverlay} />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t("timeline.edit_relationship_timeline")}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                disabled={loading || saveLoading}
              >
                <View style={styles.closeIconContainer}>
                  <Image
                    source={Images.CLOSE_ICON}
                    style={styles.closeIcon}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("timeline.event_title")}</Text>
              <TextInput
                placeholder={t("timeline.event_title_placeholder")}
                placeholderTextColor="rgba(47, 46, 44, 0.6)"
                value={title}
                onChangeText={setTitle}
                editable={!loading && !saveLoading}
                maxLength={255}
                style={[
                  styles.textInput,
                  (loading || saveLoading) && styles.disabledInput
                ]}
              />
            </View>

            {/* Date Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("timeline.event_date")}</Text>
              <TouchableOpacity
                style={[
                  styles.dateInputContainer,
                  (loading || saveLoading) && styles.disabledInput
                ]}
                onPress={() => {
                  if (!loading && !saveLoading) {
                    setShowDatePicker(true);
                  }
                }}
                disabled={loading || saveLoading}
                activeOpacity={0.7}
              >
                <TextInput
                  style={styles.dateInput}
                  value={formatDateForDisplay(date)}
                  editable={false}
                  placeholderTextColor="rgba(47, 46, 44, 0.6)"
                  pointerEvents="none"
                />
                <View style={styles.calendarIconButton}>
                  <Svg width={20} height={20} viewBox="0 0 16 18" fill="none">
                    <Path
                      d="M0.577148 6.67023H15.4304"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M11.7017 9.92474H11.7094"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M8.00397 9.92474H8.01169"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M4.29816 9.92474H4.30588"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M11.7017 13.1635H11.7094"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M8.00397 13.1635H8.01169"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M4.29816 13.1635H4.30588"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M11.3699 0.5V3.24232"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M4.63795 0.5V3.24232"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11.5319 1.81601H4.4758C2.02856 1.81601 0.5 3.17929 0.5 5.6852V13.2266C0.5 15.7719 2.02856 17.1667 4.4758 17.1667H11.5242C13.9791 17.1667 15.5 15.7955 15.5 13.2896V5.6852C15.5077 3.17929 13.9868 1.81601 11.5319 1.81601Z"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>
              {showDatePicker && Platform.OS === "android" && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
              {showDatePicker && Platform.OS === "ios" && (
                <View style={styles.iosDatePickerContainer}>
                  <View style={styles.iosDatePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={styles.iosDatePickerDoneButton}
                    >
                      <Text style={styles.iosDatePickerDoneText}>
                        {t("common.done") || "Done"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    style={styles.iosDatePicker}
                  />
                </View>
              )}
            </View>

            {/* Time Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("timeline.event_time")}</Text>
              <TouchableOpacity
                style={[
                  styles.dateInputContainer,
                  (loading || saveLoading) && styles.disabledInput
                ]}
                onPress={() => {
                  if (!loading && !saveLoading) {
                    setShowTimePicker(true);
                  }
                }}
                disabled={loading || saveLoading}
                activeOpacity={0.7}
              >
                <TextInput
                  style={styles.dateInput}
                  value={hasTime ? formatTimeForDisplay(time) : t("timeline.select_time") || "Select time"}
                  editable={false}
                  placeholderTextColor="rgba(47, 46, 44, 0.6)"
                  pointerEvents="none"
                />
                <View style={styles.calendarIconButton}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 6V12L16 14"
                      stroke={colors.TEXT_PRIMARY || "#2F2E2C"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>
              {showTimePicker && Platform.OS === "android" && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}
              {showTimePicker && Platform.OS === "ios" && (
                <View style={styles.iosDatePickerContainer}>
                  <View style={styles.iosDatePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(false)}
                      style={styles.iosDatePickerDoneButton}
                    >
                      <Text style={styles.iosDatePickerDoneText}>
                        {t("common.done") || "Done"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display="spinner"
                    onChange={onTimeChange}
                    style={styles.iosDatePicker}
                  />
                </View>
              )}
            </View>

            {/* Summary TextArea */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("timeline.event_summary")}</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  placeholder={t("timeline.event_summary_placeholder")}
                  placeholderTextColor="rgba(47, 46, 44, 0.6)"
                  value={summary}
                  onChangeText={setSummary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!loading && !saveLoading}
                  maxLength={200}
                  style={[
                    styles.textArea,
                    (loading || saveLoading) && styles.disabledInput
                  ]}
                />
              </View>
              <Text style={styles.charCount}>
                {summary.length}/200
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <View style={styles.buttonWrapper}>
                <Button
                  title={t("timeline.save_changes")}
                  onPress={handleSave}
                  loading={saveLoading || loading}
                  disabled={!title.trim() || loading || saveLoading}
                  containerStyle={styles.saveButton}
                />
              </View>
              <View style={styles.buttonWrapper}>
                <Button
                  title={t("common.cancel")}
                  onPress={handleClose}
                  disabled={loading || saveLoading}
                  variant="outline"
                  containerStyle={styles.cancelButton}
                  textStyle={styles.cancelButtonText}
                />
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  modalContent: {
    backgroundColor: colors.WHITE,
    borderTopLeftRadius: Matrics.s(30),
    borderTopRightRadius: Matrics.s(30),
    paddingTop: Matrics.vs(20),
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(30),
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Matrics.vs(16),
  },
  title: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
  },
  closeButton: {
    padding: Matrics.s(1),
  },
  closeIconContainer: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: "100%",
    height: "100%",
  },
  inputContainer: {
    marginBottom: Matrics.vs(16),
  },
  label: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Regular,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(6),
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E8EBEC",
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(10),
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_PRIMARY,
    backgroundColor: colors.WHITE,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.GRAY_MEDIUM || "#E5E5E5",
    borderRadius: Matrics.s(12),
    backgroundColor: colors.WHITE,
    position: "relative",
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: Matrics.s(15),
    paddingVertical: Matrics.vs(12),
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_PRIMARY,
  },
  calendarIconButton: {
    paddingRight: Matrics.s(15),
    paddingVertical: Matrics.vs(12),
    alignItems: "center",
    justifyContent: "center",
  },
  textAreaContainer: {
    position: "relative",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#E8EBEC",
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(12),
    paddingTop: Matrics.vs(10),
    paddingBottom: Matrics.vs(10),
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_PRIMARY,
    backgroundColor: colors.WHITE,
    minHeight: Matrics.vs(150),
    textAlignVertical: "top",
  },
  charCount: {
    alignSelf: "flex-end",
    marginTop: Matrics.vs(6),
    fontSize: FontsSize.XSmall,
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: "#A0A8AC",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Matrics.s(16),
    marginBottom: Matrics.vs(10),
    marginTop: Matrics.vs(10),
    width: "100%",
  },
  buttonWrapper: {
    flex: 1,
    flexBasis: 0, // Ensure equal width distribution
    minWidth: 0, // Ensure flex works properly
  },
  saveButton: {
    width: "100%", // Ensure button fills wrapper
    backgroundColor: colors.PRIMARY,
    borderRadius: 999, // Fully rounded pill shape
    height: Matrics.vs(52),
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    width: "100%", // Ensure button fills wrapper
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: colors.BLACK,
    borderRadius: 999, // Fully rounded pill shape
    height: Matrics.vs(52),
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.BLACK,
  },
  iosDatePickerContainer: {
    marginTop: Matrics.vs(10),
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(12),
    borderWidth: 1,
    borderColor: colors.GRAY_MEDIUM || "#E5E5E5",
    overflow: "hidden",
  },
  iosDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Matrics.s(15),
    paddingVertical: Matrics.vs(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.GRAY_MEDIUM || "#E5E5E5",
  },
  iosDatePickerDoneButton: {
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(6),
  },
  iosDatePickerDoneText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.PRIMARY,
  },
  iosDatePicker: {
    height: Matrics.vs(200),
  },
  disabledInput: {
    opacity: 0.6,
  },
});

export default EditTimelineEventModal;
