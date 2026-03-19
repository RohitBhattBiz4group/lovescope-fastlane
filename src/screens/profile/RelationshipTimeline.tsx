import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import Images from "../../config/Images";
import TimelineService from "../../services/timelineService";
import useTranslation from "../../hooks/useTranslation";
import {
  TIMELINE_PAGE_LIMIT,
  TIMELINE_SCROLL_THRESHOLD,
} from "../../constants/commonConstant";
import CommonHeader from "../../components/common/CommonHeader";
import TimelineEventDetailsModal from "../../components/timeline/TimelineEventDetailsModal";
import EditTimelineEventModal from "../../components/timeline/EditTimelineEventModal";
import DeleteTimelineEventModal from "../../components/timeline/DeleteTimelineEventModal";
import {
  toastMessageSuccess,
  toastMessageError,
} from "../../components/common/ToastMessage";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Responsive constants - scales based on screen width
const BASE_WIDTH = 375; // Base design width (iPhone X)
const scale = SCREEN_WIDTH / BASE_WIDTH;
const normalize = (size: number) => Math.round(size * scale);

// Timeline positioning constants
const TIMELINE_CONSTANTS = {
  centerLineWidth: normalize(5),
  curveLineWidth: normalize(180),
  curveLineHeight: normalize(110),
  leftCurveOffset: normalize(-135),
  rightCurveOffset: normalize(-44),
  contentMaxWidth: "45%" as const,
  itemMinHeight: normalize(101),
};

interface TimelineEvent {
    id: number | string;
    title: string;
    date: string;
    time?: string;
    description?: string | null;
    unclear_date?: boolean;
}

interface RelationshipTimelineParams {
  loveProfileId?: number | string | null;
  selectionMode?: boolean;
  returnRoute?: string;
  returnScreen?: string;
}

const RelationshipTimeline: React.FC<ScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const {
    loveProfileId,
    selectionMode = false,
  } = (route?.params as RelationshipTimelineParams) || {};
  const profileId =
    loveProfileId !== undefined && loveProfileId !== null
      ? Number(loveProfileId)
      : null;

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hasScrolledToBottom = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTimeline = async () => {
      if (!isMounted || !profileId) return;
      setLoading(true);
      setCurrentPage(1);

      try {
        const response = await TimelineService.getTimeline(
          profileId,
          1, // page
          TIMELINE_PAGE_LIMIT,
        );

                if (
                    response.success &&
                    response.data &&
                    Array.isArray(response.data.timeline_events)
                ) {
                    const mappedEvents: TimelineEvent[] = response.data.timeline_events.map(
                        (item, index) => ({
                            id: item.id || `temp-${Date.now()}-${index}`,
                            title: item.title,
                            date: item.date,
                            time: item.time || undefined,
                            description: item.description || null,
                            unclear_date: item.unclear_date || false,
                        })
                    );

                    if (isMounted) {
                        // Reverse the array so earliest entry (first message) is at the bottom
                        setTimelineEvents([...mappedEvents].reverse());
                        setHasMore(response.data.has_more || false);
                    }
                } else if (isMounted) {
                    setTimelineEvents([]);
                    setHasMore(false);
                }
            } catch (error) {
                if (isMounted) {
                    setTimelineEvents([]);
                    setHasMore(false);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

    if (profileId) {
      fetchTimeline();
    }

    return () => {
      isMounted = false;
    };
  }, [profileId]);

  // Auto-scroll to bottom when timeline events are initially loaded
  useEffect(() => {
    if (
      !loading &&
      timelineEvents.length > 0 &&
      scrollViewRef.current &&
      !hasScrolledToBottom.current
    ) {
      // Use setTimeout to ensure the content has been rendered before scrolling
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
        hasScrolledToBottom.current = true;
      }, 100);
    }
  }, [loading, timelineEvents.length]);

  // Reset scroll flag when profileId changes (new profile loaded)
  useEffect(() => {
    hasScrolledToBottom.current = false;
  }, [profileId]);

  const loadMoreTimeline = async () => {
    if (!profileId || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const response = await TimelineService.getTimeline(
        profileId,
        nextPage,
        TIMELINE_PAGE_LIMIT,
      );

            if (
                response.success &&
                response.data &&
                Array.isArray(response.data.timeline_events) &&
                response.data.timeline_events.length > 0
            ) {
                const mappedEvents: TimelineEvent[] = response.data.timeline_events.map(
                    (item, index) => ({
                        id: item.id || `temp-${Date.now()}-${nextPage}-${index}`,
                        title: item.title,
                        date: item.date,
                        time: item.time || undefined,
                        description: item.description || null,
                        unclear_date: item.unclear_date || false,
                    })
                );

                // Prepend new entries at the top, maintaining the sequence they were fetched
                setTimelineEvents((previousEvents) => [...mappedEvents.reverse(), ...previousEvents]);
                setCurrentPage(nextPage);
                setHasMore(response.data.has_more || false);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more timeline:", error);
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    const scrollPosition = contentOffset.y;

    // If scrolled near top (within threshold) and has more to load
    // This means user is scrolling up to see newer events
    if (
      scrollPosition <= TIMELINE_SCROLL_THRESHOLD &&
      hasMore &&
      !loadingMore
    ) {
      loadMoreTimeline();
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLongPress = (event: TimelineEvent) => {
    if (selectionMode) {
      // In selection mode, handle event selection
      handleEventSelect(event);
    } else {
      // Normal mode: show details modal
      setSelectedEvent(event);
      setIsDetailsModalVisible(true);
    }
  };

  const handleEventSelect = (event: TimelineEvent) => {
    const selectedEventData = {
      id: String(event.id),
      title: event.title,
      summary: event.description || undefined,
    };

    // Get the previous route to set params on it before going back
    const state = navigation.getState();
    if (state.routes.length > 1) {
      const previousRoute = state.routes[state.routes.length - 2];
      // First set params on the previous screen, then go back
      navigation.dispatch({
        ...CommonActions.setParams({
          selectedEvent: selectedEventData,
        }),
        source: previousRoute.key,
      });
    }
    // Go back to properly pop this screen from the stack
    navigation.goBack();
  };

  const handleEdit = () => {
    setIsDetailsModalVisible(false);
    setIsEditModalVisible(true);
  };

  const handleDelete = () => {
    setIsDetailsModalVisible(false);
    setIsDeleteModalVisible(true);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveEvent = async (event: TimelineEvent) => {
    if (!event.id || isSaving) {
      if (!event.id) {
        toastMessageError(t("timeline.error_invalid_event"));
      }
      return;
    }

    // Ensure ID is a number for API call
    const eventId =
      typeof event.id === "string" ? parseInt(event.id, 10) : event.id;
    if (isNaN(eventId)) {
      toastMessageError(t("timeline.error_invalid_event"));
      return;
    }

        setIsSaving(true);
        try {
            const response = await TimelineService.updateTimelineEntry(
                eventId,
                event.title,
                event.date,
                event.description,
                event.unclear_date ?? false,
                event.time
            );

      if (response.success) {
        toastMessageSuccess(t("timeline.event_updated_successfully"));
        // Refresh timeline
        const fetchTimeline = async () => {
          if (!profileId) return;
          setLoading(true);
          setCurrentPage(1);

          try {
            const timelineResponse = await TimelineService.getTimeline(
              profileId,
              1,
              TIMELINE_PAGE_LIMIT,
            );

                        if (
                            timelineResponse.success &&
                            timelineResponse.data &&
                            Array.isArray(timelineResponse.data.timeline_events)
                        ) {
                            const mappedEvents: TimelineEvent[] = timelineResponse.data.timeline_events.map(
                                (item, index) => ({
                                    id: item.id || `temp-${Date.now()}-${index}`,
                                    title: item.title,
                                    date: item.date,
                                    time: item.time || undefined,
                                    description: item.description || null,
                                    unclear_date: item.unclear_date || false,
                                })
                            );

                            setTimelineEvents([...mappedEvents].reverse());
                            setHasMore(timelineResponse.data.has_more || false);
                        }
                    } catch (error) {
                        console.error("Error refreshing timeline:", error);
                    } finally {
                        setLoading(false);
                    }
                };

        fetchTimeline();
        setIsEditModalVisible(false);
        setSelectedEvent(null);
      } else {
        toastMessageError(
          response.message || t("timeline.error_updating_event"),
        );
      }
    } catch (error) {
      console.error("Error updating timeline event:", error);
      toastMessageError(t("timeline.error_updating_event"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: number | string) => {
    if (isDeleting) return;

    // Ensure ID is a number for API call
    const numericId =
      typeof eventId === "string" ? parseInt(eventId, 10) : eventId;
    if (isNaN(numericId)) {
      toastMessageError(t("timeline.error_invalid_event"));
      return;
    }

    setIsDeleting(true);
    try {
      const response = await TimelineService.deleteTimelineEntry(numericId);

      if (response.success) {
        toastMessageSuccess(t("timeline.event_deleted_successfully"));
        // Remove event from list
        setTimelineEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== eventId),
        );
        setIsDeleteModalVisible(false);
        setSelectedEvent(null);
      } else {
        toastMessageError(
          response.message || t("timeline.error_deleting_event"),
        );
      }
    } catch (error) {
      console.error("Error deleting timeline event:", error);
      toastMessageError(t("timeline.error_deleting_event"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuestionMarkPress = () => {
    console.log("handleQuestionMarkPress");
    setTooltipVisible(true);
    // Auto-hide tooltip after 3 seconds
    setTimeout(() => {
      setTooltipVisible(false);
    }, 5000);
  };

    const formatTimeTo12Hour = (timeStr: string): string => {
        const parts = timeStr.split(":");
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    const renderTimelineItem = (event: TimelineEvent, index: number, totalItems: number) => {
        const isLast = index === totalItems - 1; // Last item (oldest) should be centered
        const isLeft = index % 2 === 0; // Alternate: even indices = left, odd = right
        const showUnclearDate = event.unclear_date === true;
        const dateTimeLabel = event.time
            ? `${event.date} · ${formatTimeTo12Hour(event.time)}`
            : event.date;

        return (
            <View
                key={`timeline-event-${event.id}-${index}`}
            // style={styles.timelineItemContainer}
            // onLongPress={() => handleLongPress(event)}
            // activeOpacity={0.7}
            >
                {isLast ? (
                    // Last item (oldest/start event) - centered with main line above
                    <View style={styles.centerItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.centerContent}>
                            <View style={styles.titleRow}>
                                <Pressable
                                    onPress={selectionMode ? () => handleEventSelect(event) : undefined}
                                    onLongPress={selectionMode ? undefined : () => handleLongPress(event)}
                                >
                                    <Text style={styles.eventTitleCenter}>{event.title}</Text>
                                </Pressable>
                                {showUnclearDate && (
                                    <Pressable
                                        onPress={handleQuestionMarkPress}
                                        style={styles.questionMarkButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={styles.questionMark}>?</Text>
                                    </Pressable>

                                )}
                            </View>
                            <Text style={styles.eventDateCenter}>{dateTimeLabel}</Text>
                        </View>
                    </View>
                ) : isLeft ? (
                    // Left aligned items
                    <View style={styles.leftItem}>
                        <View style={styles.leftContent}>
                            <View style={styles.titleRow}>
                                <Pressable
                                    onPress={selectionMode ? () => handleEventSelect(event) : undefined}
                                    onLongPress={selectionMode ? undefined : () => handleLongPress(event)}
                                >
                                    <Text style={styles.eventTitleLeft}>{event.title}</Text>
                                </Pressable>
                                {showUnclearDate && (
                                    <Pressable
                                        onPress={handleQuestionMarkPress}
                                        style={styles.questionMarkButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={styles.questionMark}>?</Text>
                                    </Pressable>
                                )}
                            </View>
                            <Text style={styles.eventDateLeft}>{dateTimeLabel}</Text>
                        </View>
                        <View style={styles.leftLineWrapper}>
                            <Image
                                source={Images.TIMELINE_LEFT_LINE}
                                style={styles.curveLineImage}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.centerLineContainer}>
                            <Image
                                source={Images.TIMELINE_MAIN_LINE}
                                style={styles.centerLineImage}
                                resizeMode="stretch"
                            />
                        </View>
                    </View>
                ) : (
                    // Right aligned items
                    <View style={styles.rightItem}>
                        <View style={styles.centerLineContainer}>
                            <Image
                                source={Images.TIMELINE_MAIN_LINE}
                                style={styles.centerLineImage}
                                resizeMode="stretch"
                            />
                        </View>
                        <View style={styles.rightLineWrapper}>
                            <Image
                                source={Images.TIMELINE_RIGHT_LINE}
                                style={styles.curveLineImage}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.rightContent}>
                            <View style={styles.titleRow}>
                                <Pressable
                                    onPress={selectionMode ? () => handleEventSelect(event) : undefined}
                                    onLongPress={selectionMode ? undefined : () => handleLongPress(event)}
                                >
                                    <Text style={styles.eventTitleRight}>{event.title}</Text>
                                </Pressable>
                                {showUnclearDate && (
                                    <Pressable
                                        onPress={handleQuestionMarkPress}
                                        style={styles.questionMarkButton}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={styles.questionMark}>?</Text>
                                    </Pressable>

                                )}
                            </View>
                            <Text style={styles.eventDateRight}>{dateTimeLabel}</Text>
                        </View>
                    </View>
                )}
            </View>
        );
    };

  return (
    <GestureHandlerRootView style={styles.container}>
      <CommonHeader
        onNotificationPress={() => navigation.navigate("Notifications")}
        showNotificationBadge={true}
        title={t("timeline.title")}
        showBackButton={true}
        onBackPress={handleBack}
      />

      {/* Instruction Text */}
      {!selectionMode && timelineEvents.length !== 0 && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            {t("timeline.long_press_instruction")}
          </Text>
        </View>
      )}
      {selectionMode && timelineEvents.length !== 0 && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            {t("timeline.select_event_instruction") ||
              "Tap on an event to select it"}
          </Text>
        </View>
      )}

      {/* Timeline Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={colors.PRIMARY} />
          </View>
        ) : timelineEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("timeline.empty_state")}</Text>
          </View>
        ) : (
          <>
            {loadingMore && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator color={colors.PRIMARY} size="small" />
              </View>
            )}
            {timelineEvents.map((event, index) =>
              renderTimelineItem(event, index, timelineEvents.length),
            )}
          </>
        )}
      </ScrollView>

      {/* Event Details Modal */}
      <TimelineEventDetailsModal
        visible={isDetailsModalVisible}
        onClose={() => {
          setIsDetailsModalVisible(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Edit Modal */}
      <EditTimelineEventModal
        visible={isEditModalVisible}
        onClose={() => {
          if (!isSaving) {
            setIsEditModalVisible(false);
            if (!isDetailsModalVisible) {
              setSelectedEvent(null);
            }
          }
        }}
        event={selectedEvent}
        onSave={handleSaveEvent}
        loading={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTimelineEventModal
        visible={isDeleteModalVisible}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalVisible(false);
            if (!isDetailsModalVisible) {
              setSelectedEvent(null);
            }
          }
        }}
        onConfirm={async () => {
          if (selectedEvent?.id) {
            await handleDeleteEvent(selectedEvent.id);
          }
        }}
        loading={isDeleting}
      />

      {/* Tooltip Modal */}
      <Modal
        transparent
        visible={tooltipVisible}
        animationType="fade"
        onRequestClose={() => {
          setTooltipVisible(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setTooltipVisible(false);
          }}
        >
          <View style={styles.tooltipOverlay}>
            <View style={styles.tooltipContainer}>
              <Text style={styles.tooltipText}>
                {t("timeline.unclear_date_message")}
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Matrics.vs(20),
    paddingBottom: Matrics.vs(30),
    paddingHorizontal: Matrics.s(20),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Matrics.vs(20),
  },
  loadMoreContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Matrics.vs(10),
  },
  timelineItemContainer: {
    marginBottom: Matrics.vs(0),
  },
  // Center item (first item)
  centerItem: {
    alignItems: "center",
    position: "relative",
    paddingTop: Matrics.vs(0),
    paddingBottom: Matrics.vs(0),
  },
  timelineDot: {
    width: Matrics.s(12),
    height: Matrics.s(12),
    borderRadius: Matrics.s(6),
    backgroundColor: colors.PRIMARY,
    marginBottom: Matrics.vs(6),
    zIndex: 3,
  },
  centerContent: {
    alignItems: "center",
    paddingVertical: Matrics.vs(8),
    paddingHorizontal: Matrics.s(15),
    maxWidth: "85%",
    zIndex: 3,
  },
  centerMainLineContainer: {
    width: Matrics.s(5),
    height: Matrics.vs(50),
    marginTop: Matrics.vs(0),
  },
  mainLineImage: {
    width: "100%",
    height: "100%",
  },
  // Left aligned items
  leftItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    position: "relative",
    minHeight: TIMELINE_CONSTANTS.itemMinHeight,
    paddingVertical: 0,
  },
  leftContent: {
    flex: 1,
    paddingRight: Matrics.s(5),
    paddingTop: 0,
    maxWidth: TIMELINE_CONSTANTS.contentMaxWidth,
    zIndex: 3,
  },
  leftLineWrapper: {
    position: "absolute",
    left: "50%",
    marginLeft: TIMELINE_CONSTANTS.leftCurveOffset,
    top: 0,
    width: TIMELINE_CONSTANTS.curveLineWidth,
    height: TIMELINE_CONSTANTS.curveLineHeight,
    zIndex: 2,
    pointerEvents: "none",
  },
  centerLineContainer: {
    position: "absolute",
    left: "50%",
    marginLeft: -(TIMELINE_CONSTANTS.centerLineWidth / 2),
    top: 0,
    width: TIMELINE_CONSTANTS.centerLineWidth,
    height: "101%",
    zIndex: 1,
    pointerEvents: "none",
  },
  centerLineImage: {
    width: "100%",
    height: "100%",
  },
  curveLineImage: {
    width: "100%",
    height: "100%",
  },
  // Right aligned items
  rightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    position: "relative",
    minHeight: TIMELINE_CONSTANTS.itemMinHeight,
    paddingVertical: 0,
  },
  rightLineWrapper: {
    position: "absolute",
    left: "50%",
    marginLeft: TIMELINE_CONSTANTS.rightCurveOffset,
    top: 0,
    width: TIMELINE_CONSTANTS.curveLineWidth,
    height: TIMELINE_CONSTANTS.curveLineHeight,
    zIndex: 2,
    pointerEvents: "none",
  },
  rightContent: {
    flex: 1,
    paddingLeft: Matrics.s(5),
    paddingTop: 0,
    alignItems: "center",
    marginLeft: "auto",
    maxWidth: TIMELINE_CONSTANTS.contentMaxWidth,
    zIndex: 3,
  },
  // Text styles
  eventTitleCenter: {
    fontSize: Matrics.ms(12),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginVertical: Matrics.vs(5),
    textAlign: "center",
  },
  eventDateCenter: {
    fontSize: Matrics.ms(11),
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: "center",
  },
  eventTitleLeft: {
    fontSize: Matrics.ms(12),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(0),
    textAlign: "center",
  },
  eventDateLeft: {
    fontSize: Matrics.ms(11),
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: "center",
  },
  eventTitleRight: {
    fontSize: Matrics.ms(12),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(0),
    textAlign: "center",
  },
  eventDateRight: {
    fontSize: Matrics.ms(11),
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Matrics.vs(40),
    paddingHorizontal: Matrics.s(20),
  },
  emptyText: {
    fontSize: Matrics.ms(12),
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_PRIMARY,
    opacity: 0.7,
    textAlign: "center",
  },
  instructionContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(5),
    paddingBottom: Matrics.vs(10),
  },
  instructionText: {
    fontSize: Matrics.ms(10),
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.SECONDARY || "#9CA3AF",
    textAlign: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  questionMarkButton: {
    marginLeft: Matrics.s(5),
    width: Matrics.ms(16),
    height: Matrics.ms(16),
    borderRadius: Matrics.ms(9),
    backgroundColor: colors.SECONDARY || "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  questionMark: {
    fontSize: Matrics.ms(10),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  tooltipContainer: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(15),
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipText: {
    fontSize: Matrics.ms(14),
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.TEXT_PRIMARY,
    textAlign: "center",
  },
});

export default RelationshipTimeline;
