import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Modal,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { ScreenProps, IUserOnboardingStatus } from "../../interfaces/commonInterfaces";
import CommonHeader from "../../components/common/CommonHeader";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import useChat from "../../hooks/useChat";
import ChatService from "../../services/chatService";
import {
  toastMessageError,
  toastMessageInfo,
  toastMessageUpgrade,
} from "../../components/common/ToastMessage";
import {
  LIMIT,
  KEYBOARD_OFFSET_IOS,
  KEYBOARD_OFFSET_ANDROID,
  APP
} from "../../constants/commonConstant";
import TypingIndicator from "../../components/common/TypingIndicator";
import ChatSkeleton from "../../skeletons/ChatSkeleton";
import { IChatHistory } from "../../interfaces/chatInterfaces";
import SpeakToText, {
  SpeakToTextRef
} from "../../components/common/SpeakToText";
import LinearGradient from "react-native-linear-gradient";
import { getMaxLength, removeAsterisks } from "../../utils/helper";
import useTranslation from "../../hooks/useTranslation";
import { useFocusEffect } from "@react-navigation/native";
import { CopilotStep, useCopilot } from "react-native-copilot";
import useAuth from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { updateOnboardingStatusLocally } from "../../stateManagement/features/authSlice";
import onboardingService from "../../services/onboardingService";
import { CopilotView } from "../../components/walkthrough";

interface ProfileChatParams {
  loveProfileId: number;
  profileName?: string;
}

const DEFAULT_ONBOARDING_STATUS: IUserOnboardingStatus = {
  skip_profile_creation: false,
  skip_onboarding_question: false,
  skip_walkthrough: false,
  profile_creation_completed: false,
  love_profile_onboarding: false,
  analyser_onboarding: false,
  global_chat_onboarding: false,

  friends_onboarding: false,
};

const ProfileChat: React.FC<ScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { authData, setAuthData } = useAuth();
  const dispatch = useDispatch();
  const { start, stop, copilotEvents } = useCopilot();
  const currentPlan = authData?.plan;

  const flatListRef = useRef<FlatList>(null);
  const { loveProfileId, profileName } =
    (route?.params as ProfileChatParams) || {};

  const startRef = useRef(start);
  const walkthroughStartedRef = useRef(false);
  const isUserInitiatedStopRef = useRef(true);
  const isTransitioningRef = useRef(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [currentTooltipStep, setCurrentTooltipStep] = useState<'timeline' | 'input' | 'choice' | 'completed'>('timeline');
  const [modalState, setModalState] = useState<'hidden' | 'showing' | 'shown'>('hidden');
  const [loadingChoice, setLoadingChoice] = useState<'skip' | 'continue' | null>(null);
  const [hasReceivedBotResponse, setHasReceivedBotResponse] = useState(false);
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const modalTriggeredRef = useRef(false);
  const lastProcessedMessageId = useRef<string | null>(null);
  const onboardingCompletedRef = useRef(false);

  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [chatId, setChatId] = useState<number>();
  const [historyMessages, setHistoryMessages] = useState<IChatHistory[]>([]);

  const {
    messages,
    send,
    typingLoader,
    messageLimitReached,
    messageLimitMessage,
  } = useChat(chatId!);

  const micRef = useRef<SpeakToTextRef>(null);
  const charLimitToastShownRef = useRef(false);
  const textInputRef = useRef<TextInput>(null);

  const onboardingStatus = authData?.user?.onboarding_status;
  const shouldShowOnboardingTooltip = useMemo(() =>
    onboardingStatus &&
    onboardingStatus.profile_creation_completed === true &&
    onboardingStatus.love_profile_onboarding !== true,
    [onboardingStatus]
  );
  const showOnboardingTooltipRef = useRef(false);
  const showOnboardingTooltip = useMemo(() =>
    shouldShowOnboardingTooltip && isScreenFocused,
    [shouldShowOnboardingTooltip, isScreenFocused]
  );
  
  // Keep the ref in sync
  useEffect(() => {
    showOnboardingTooltipRef.current = showOnboardingTooltip || false;
  }, [showOnboardingTooltip]);

  // Function to trigger choice modal - simplified without setTimeout
  const triggerChoiceModal = useCallback(() => {
    if (!modalTriggeredRef.current && !hasReceivedBotResponse && showOnboardingTooltip && modalState === 'hidden' && !onboardingCompletedRef.current) {
      modalTriggeredRef.current = true;
      setHasReceivedBotResponse(true);
      setModalState('showing');
      setCurrentTooltipStep('choice');

      // Dismiss keyboard when modal is triggered
      Keyboard.dismiss();
    }
  }, [hasReceivedBotResponse, showOnboardingTooltip, modalState]);

  // Track when bot responds to show choice modal - using message ID for stability
  useEffect(() => {
    if (messages.length > 0 && showOnboardingTooltip && !hasReceivedBotResponse && !modalTriggeredRef.current && !onboardingCompletedRef.current) {
      const lastMessage = messages[messages.length - 1];
      const messageId = `live-${messages.length - 1}`;

      // Only process if this is a new bot message we haven't seen before
      if (lastMessage.isBot && lastProcessedMessageId.current !== messageId) {
        lastProcessedMessageId.current = messageId;
        triggerChoiceModal();
      }
    }
  }, [messages, showOnboardingTooltip, hasReceivedBotResponse, triggerChoiceModal]);

  // ---------------------------
  // FIX: FETCH HISTORY
  // ---------------------------

  const fetchHistory = useCallback(
    async (initial: boolean = false) => {
      if (!chatId || loading || !hasMore) return;
      try {
        setLoading(true);
        const nextSkip = initial ? 0 : skip;
        const response = await ChatService.getChatHistory(
          chatId,
          nextSkip,
          LIMIT
        );

        if (response.success && response.data?.length) {
          const mapped = response.data.map((item) => ({
            id: String(item.id),
            message: item.message,
            isBot: !item.isBot,
            messageType: item.messageType,
            sharedBy: item.sharedBy
          }));

          if (initial) {
            setHistoryMessages(mapped);
          } else {
            setHistoryMessages((prev) => {
              const existingIds = new Set(prev.map((msg) => msg.id));
              const uniqueNew = mapped.filter(
                (msg) => !existingIds.has(msg.id)
              );
              return [...prev, ...uniqueNew];
            });
          }

          setSkip(nextSkip + response?.data?.length);

          if (response?.data?.length < LIMIT) {
            setHasMore(false);
          }
        } else if (
          response.success &&
          (!response.data || response.data.length === 0)
        ) {
          // no history for this chat, stop further pagination calls
          setHasMore(false);
        }
      } catch (error) {
        console.log("Failed to load chat history", error);
        toastMessageError(t("common.something_went_wrong"));
      } finally {
        setLoading(false);
      }
    },
    [chatId, loading, skip, hasMore]
  );

  const createChat = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      const response = await ChatService.createChat({ loveProfileId });

      if (response?.data?.id) {
        setChatId(response?.data?.id);
      }
    } catch (error) {
      console.log("Failed to create chat", error);
      toastMessageError(t("common.something_went_wrong"));
    } finally {
      setLoading(false);
    }
  }, [loveProfileId]);

  useEffect(() => {
    createChat();
  }, []);

  useEffect(() => {
    if (chatId) {
      fetchHistory(true);
    }
  }, [chatId]);

  // Focus effect to manage screen state and walkthrough - less aggressive resets
  useFocusEffect(
    useCallback(() => {
      isUserInitiatedStopRef.current = true;
      setIsScreenFocused(true);

      // Only reset modal state if it's not currently active and onboarding not completed
      // And only reset currentTooltipStep if the walkthrough hasn't started yet AND we're not in the middle of starting it
      if (modalState === 'hidden' && !onboardingCompletedRef.current) {
        // Check if we should reset - only if walkthrough hasn't started AND we're not about to start it AND we're not transitioning
        const shouldReset = !walkthroughStartedRef.current && !isTransitioningRef.current;
        
        if (shouldReset) {
          setCurrentTooltipStep('timeline');
          modalTriggeredRef.current = false;
          setHasReceivedBotResponse(false);
          lastProcessedMessageId.current = null;
        }
      }

      return () => {
        if (!walkthroughStartedRef.current) {
          setIsScreenFocused(false);
          if (!isUserInitiatedStopRef.current) {
            return;
          }
          stop();
        }
      };
    }, [stop, modalState])
  );

  // Keep startRef updated
  useEffect(() => {
    startRef.current = start;
  }, [start]);

  // Start onboarding tooltip on screen focus
  useEffect(() => {
    if (!showOnboardingTooltip || walkthroughStartedRef.current || onboardingCompletedRef.current) {
      return;
    }

    walkthroughStartedRef.current = true;
    setIsOnboardingActive(true);
    const timer = setTimeout(() => {
      // Double-check before starting to prevent race conditions
      if (!onboardingCompletedRef.current) {
        startRef.current('profileChatTimeline');
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [showOnboardingTooltip]);

  // Handle choice selection
  const handleChoice = useCallback(async (choice: 'skip' | 'continue') => {
    try {
      setLoadingChoice(choice);

      // Stop the current walkthrough immediately to prevent flickering
      stop();
      
      // Mark onboarding as completed to prevent re-triggering
      onboardingCompletedRef.current = true;
      
      // Set stable state to false immediately
      setIsOnboardingActive(false);

      // Always mark love_profile_onboarding as true first
      await onboardingService.updateOnboardingField(
        'love_profile_onboarding',
        true,
      );

      if (choice === 'skip') {
        // Set skip_walkthrough to true
        await onboardingService.updateOnboardingField(
          'skip_walkthrough',
          true,
        );
      }

      // Immediately update Redux state for instant UI feedback
      dispatch(updateOnboardingStatusLocally({
        love_profile_onboarding: true,
        ...(choice === 'skip' ? { skip_walkthrough: true } : {}),
      }));

      if (authData?.user) {
        const updatedOnboardingStatus: IUserOnboardingStatus = {
          ...DEFAULT_ONBOARDING_STATUS,
          ...(authData.user.onboarding_status ?? {}),
          love_profile_onboarding: true,
          ...(choice === 'skip' ? { skip_walkthrough: true } : {}),
        };

        setAuthData({
          ...authData,
          user: {
            ...authData.user,
            onboarding_status: updatedOnboardingStatus,
          },
        });
      }

      setCurrentTooltipStep('completed');
      setModalState('hidden');
      setLoadingChoice(null);

      if (choice === 'continue') {
        // Navigate back to PartnerProfiles to show files tab tooltip for continue tour
        navigation.navigate('PartnerProfiles', { continueTour: true });
      }
    } catch (error) {
      console.log('Failed to update onboarding status:', error);
      // Reset completion flag on error
      onboardingCompletedRef.current = false;
      setLoadingChoice(null);
    }
  }, [authData, setAuthData, navigation, stop]);

  // Handle modal state transitions
  useEffect(() => {
    if (modalState === 'showing') {
      // Transition from showing to shown
      setModalState('shown');
    }
  }, [modalState]);

  // Handle onboarding tooltip progression and completion
  useEffect(() => {
    if (!showOnboardingTooltipRef.current) return;

    const handleStepChange = (step: any) => {
      // Mark that we're in transition to prevent state resets
      isTransitioningRef.current = true;
      
      if (step?.name === 'profileChatTimeline') {
        setCurrentTooltipStep('timeline');
      } else if (step?.name === 'profileChatInput') {
        setCurrentTooltipStep('input');
      } else if (step?.name === 'profileChatChoice') {
        setCurrentTooltipStep('choice');
      }
      
      // Clear transition flag quickly
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 100);
    };

    const handleStop = async () => {
      if (!isUserInitiatedStopRef.current) return;

      // Don't complete onboarding here - it will be handled by choice selection
      if (currentTooltipStep === 'choice') {
        setModalState('hidden');
        // Don't mark as completed here - let handleChoice do it
      }
    };

    copilotEvents.on('stepChange', handleStepChange);
    copilotEvents.on('stop', handleStop);
    
    return () => {
      copilotEvents.off('stepChange', handleStepChange);
      copilotEvents.off('stop', handleStop);
    };
  }, [authData, copilotEvents, setAuthData]);
  useEffect(() => {
    if (messageLimitReached) {
      toastMessageInfo(
        messageLimitMessage ||
          t("profile_chat.limit_reached")
      );
    }
  }, [messageLimitReached, messageLimitMessage]);

  // ---------------------------
  // COMBINED MESSAGES
  // ---------------------------
  const combinedMessages = useMemo(() => {
    const liveMessages = messages.map((event, index) => ({
      id: `live-${index}`,
      message: event.message,
      isBot: !event.isBot,
      messageType: event.mt
    }));

    // FIX: overall order = oldest -> newest
    return [...liveMessages.reverse(), ...historyMessages];
  }, [historyMessages, messages]);

  // ---------------------------
  // SEND MESSAGE
  // ---------------------------
  const handleSend = () => {
    if (!inputText.trim()) return;
    if (messageLimitReached) return;

    send(inputText.trim(), loveProfileId);

    // Stop mic recording when user sends the message
    micRef.current?.stopMic?.();

    setInputText("");

    // FIX: scroll to bottom (FlatList inverted)
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };
  
    const handleTextChange = (text: string) => {
      const maxLength = getMaxLength(currentPlan);

      const isAtOrOverLimit = !!maxLength && text.length >= maxLength;
      if (!isAtOrOverLimit) {
        charLimitToastShownRef.current = false;
      }

      if (isAtOrOverLimit && !charLimitToastShownRef.current) {
        charLimitToastShownRef.current = true;

        toastMessageUpgrade(
          t("profile_chat.character_limit_reached", { limit: maxLength }),
          undefined,
          t("profile_chat.upgrade_to_send_longer_messages"),
          () => {
            const parentNav = navigation.getParent?.();
            if (parentNav) {
              parentNav.navigate("SettingsTab", {
                screen: "Subscription",
                params: {
                  navigationFrom: {
                    tab: "ProfilesTab",
                    screen: route?.name,
                  },
                },
              });
              return;
            }
            (navigation as any).navigate?.("Subscription", {
              navigationFrom: {
                tab: "ProfilesTab",
                screen: route?.name,
              },
            });
          }
        );
      }
      setInputText(text);
    };

  // ---------------------------
  // RENDER MESSAGE
  // ---------------------------
  const renderMessage = ({ item }: { item: IChatHistory }) => {
    const isAnalysisResult = item.messageType === "analysis_result";

    if (item.messageType === "quiz_summary") {
      const sharedByName = item.sharedBy || t("quiz.response.summary");
      return (
        <View style={styles.quizSharedContainer}>
          <View style={styles.quizSharedCard}>
            <Text style={styles.quizSharedText}>
              {t("quiz.chat.quiz_shared_by", { name: sharedByName })}
            </Text>
          </View>
        </View>
      );
    }

    if (isAnalysisResult) {
      return (
        <View style={styles.quizSharedContainer}>
          <View style={styles.quizSharedCard}>
            <Text style={styles.quizSharedText}>
              {t("profile_chat.text_analysis_result")}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          item.isBot ? styles.userMessageContainer : styles.botMessageContainer
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            item.isBot ? styles.userBubble : styles.botBubble
          ]}
        >
          <Image
            source={item.isBot ? Images.USER_POLYGON : Images.BOT_POLYGON}
            style={item.isBot ? styles.userPolygon : styles.botPolygon}
            resizeMode="contain"
          />

          <Text
            style={[
              styles.messageText,
              item.isBot ? styles.userMessageText : styles.botMessageText
            ]}
          >
            {removeAsterisks(item.message)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isOnboardingActive ? "rgba(226, 232, 252)" : "transparent" }]}>
      {!isOnboardingActive && (
        <LinearGradient
          colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
          locations={[0.1977, 1]}
          style={styles.gradient}
        />
      )}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      <CommonHeader
        variant="chat"
        profileName={
          profileName && profileName.length > 20
            ? `${profileName.substring(0, 20)}...`
            : profileName || t("love_profile.profile")
        }
        showTimeline={true}
        onTimelinePress={() => {
          navigation.navigate("RelationshipTimeline", {
            loveProfileId,
          });
        }}
        onBackPress={() => navigation.goBack()}
        timelineTooltip={isOnboardingActive ? {
          active: true,
          text: t("walkthrough.profile_chat.timeline"),
          order: 1,
          name: "profileChatTimeline",
        } : undefined}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={
          Platform.OS === APP.IOS
            ? KEYBOARD_OFFSET_IOS
            : KEYBOARD_OFFSET_ANDROID
        }
      >
        <FlatList
          ref={flatListRef}
          data={combinedMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted // ✅ FIX: Chat works bottom-up
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          // load older messages when scrolling up
          onEndReachedThreshold={0.2}
          onEndReached={() => {
            if (!loading && hasMore) fetchHistory(false);
          }}
          ListFooterComponent={loading ? <ChatSkeleton /> : null}
          ListHeaderComponent={
            typingLoader ? <TypingIndicator isUser={false} /> : null
          }
        />

        {messageLimitReached ? (
          <View style={styles.limitBanner}>
            <Text style={styles.limitBannerText}>
              {messageLimitMessage ||
                t("profile_chat.limit_reached")
                }
            </Text>
          </View>
        ) : null}

        {/* Input */}
        {isOnboardingActive ? (
          <CopilotStep
            text={t("walkthrough.profile_chat.input")}
            order={2}
            name="profileChatInput"
          >
            <CopilotView style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <SpeakToText onSpeechChange={setInputText} ref={micRef} />

                <TextInput
                  style={styles.textInput}
                  placeholder={t("common.type_here")}
                  placeholderTextColor="rgba(26, 26, 26, 0.4)"
                  value={inputText}
                  onChangeText={handleTextChange}
                  multiline
                  maxLength={Number(currentPlan?.limits?.text_limit)}
                />

                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSend}
                  disabled={!inputText.trim() || typingLoader || messageLimitReached}
                >
                  <Image
                    source={Images.SEND_ICON}
                    style={styles.sendIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </CopilotView>
          </CopilotStep>
        ) : (
          <View
            style={styles.inputContainer}
            pointerEvents={modalState !== 'hidden' ? 'none' : 'auto'}
          >
            <View style={styles.inputWrapper}>
              <SpeakToText
                onSpeechChange={setInputText}
                ref={micRef}
              />

              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                placeholder={t("common.type_here")}
                placeholderTextColor="rgba(26, 26, 26, 0.4)"
                value={inputText}
                onChangeText={handleTextChange}
                multiline
                maxLength={Number(currentPlan?.limits?.text_limit)}
                editable={modalState === 'hidden'}
                pointerEvents={modalState !== 'hidden' ? 'none' : 'auto'}
              />

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={!inputText.trim() || typingLoader || modalState !== 'hidden'}
              >
                <Image
                  source={Images.SEND_ICON}
                  style={styles.sendIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Choice Modal */}
      <Modal
        visible={modalState !== 'hidden' && currentTooltipStep === 'choice'}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          // Prevent closing modal by back button - user must make a choice
        }}
        onShow={() => {
          // Dismiss keyboard when modal shows
          Keyboard.dismiss();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("profile_chat.continue_your_journey")}</Text>
              <Text style={styles.modalSubtitle}>
                {t("profile_chat.you_started_chatting")}
              </Text>
            </View>

            <View style={styles.modalContent}>
              <TouchableOpacity
                style={[styles.modalButton, styles.continueModalButton, loadingChoice === 'continue' && { opacity: 0.7 }]}
                disabled={loadingChoice !== null}
                onPress={() => {
                  handleChoice('continue');
                }}
              >
                <View style={styles.buttonContent}>
                  {loadingChoice === 'continue' ? (
                    <ActivityIndicator size="small" color={colors.PRIMARY} />
                  ) : (
                    <>
                      <Text style={styles.continueModalButtonText}>{t("profile_chat.continue_tour")}</Text>
                      <Text style={[styles.buttonDescription, styles.continueButtonDescription]}>
                        {t("profile_chat.learn_about_analyzer")}
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.skipModalButton, loadingChoice === 'skip' && { opacity: 0.7 }]}
                disabled={loadingChoice !== null}
                onPress={() => {
                  handleChoice('skip');
                }}
              >
                <View style={styles.buttonContent}>
                  {loadingChoice === 'skip' ? (
                    <ActivityIndicator size="small" color={colors.PRIMARY} />
                  ) : (
                    <>
                      <Text style={styles.skipModalButtonText}>{t('profile_chat.skip_tour')}</Text>
                      <Text style={[styles.buttonDescription, styles.skipButtonDescription]}>
                        {t('profile_chat.start_using_app')}
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardAvoid: {
    flex: 1
  },
  messagesContainer: {
    paddingHorizontal: Matrics.s(16),
    paddingTop: Matrics.vs(20),
    paddingBottom: Matrics.vs(20)
  },
  messageContainer: {
    marginBottom: Matrics.vs(20),
    flexDirection: "row",
    position: "relative"
  },
  userMessageContainer: {
    justifyContent: "flex-end"
  },
  botMessageContainer: {
    justifyContent: "flex-start"
  },
  messageBubble: {
    maxWidth: "85%",
    paddingVertical: Matrics.vs(14),
    paddingHorizontal: Matrics.s(14),
    borderRadius: Matrics.s(12)
  },
  userBubble: {
    backgroundColor: colors.PRIMARY,
    borderTopRightRadius: Matrics.s(2)
  },
  botBubble: {
    backgroundColor: colors.BACKGROUND,
    borderTopLeftRadius: Matrics.s(4)
  },
  messageText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    lineHeight: Matrics.vs(16),
    fontWeight: "500",
  },
  userMessageText: { color: colors.WHITE },
  botMessageText: { color: colors.TEXT_DARK },
  inputContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(20),
    paddingTop: Matrics.vs(1)
  },
  limitBanner: {
    marginHorizontal: Matrics.s(20),
    marginBottom: Matrics.vs(10),
    paddingHorizontal: Matrics.s(14),
    paddingVertical: Matrics.vs(10),
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    borderRadius: Matrics.s(12),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  limitBannerText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    textAlign: "center",
    lineHeight: Matrics.vs(18),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(30),
    paddingHorizontal: Matrics.s(5),
    paddingVertical: Matrics.vs(4),
    borderColor: "#E8EBEC",
    borderWidth: 1
  },
  micButton: { marginRight: Matrics.s(5) },
  micIcon: {
    width: Matrics.s(22),
    height: Matrics.vs(22),
    tintColor: "rgba(26, 26, 26, 0.6)"
  },
  textInput: {
    flex: 1,
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: "rgba(26, 26, 26, 0.6)",
    maxHeight: Matrics.vs(55),
    paddingVertical: 0
  },
  sendButton: {
    width: Matrics.s(40),
    height: Matrics.s(40),
    borderRadius: Matrics.s(20),
    backgroundColor: colors.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Matrics.s(12)
  },
  sendIcon: { width: "100%", height: "100%" },
  userPolygon: {
    position: "absolute",
    top: 0,
    right: -9,
    width: 30,
    height: 10
  },
  botPolygon: { position: "absolute", top: 0, left: -9, width: 30, height: 10 },
  quizSharedContainer: {
    marginBottom: Matrics.vs(20),
    width: "100%",
    alignItems: "center",
  },
  quizSharedCard: {
    width: "100%",
    backgroundColor: "rgba(47, 89, 235, 0.08)",
    
    borderRadius: Matrics.s(8),
    paddingVertical: Matrics.vs(12),
    paddingHorizontal: Matrics.s(14),
  },
  quizSharedText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  analysisResultContainer: {
    marginBottom: Matrics.vs(20),
    width: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  analysisResultCard: {
    width: "100%",
    borderRadius: Matrics.s(10),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.20)"
  },
  cardImageStyle: {
    borderRadius: Matrics.s(10)
  },
  analysisResultContent: {
    paddingVertical: Matrics.vs(15),
    paddingHorizontal: Matrics.s(15)
  },
  analysisResultTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_DARK,
  },
  analysisResultText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    lineHeight: Matrics.vs(16),
    color: colors.TEXT_DARK,
  },
  summaryIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: Matrics.vs(8),
  },
  summaryIcon: {
    width: Matrics.s(20),
    height: Matrics.vs(20),
    marginRight: Matrics.s(10),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Matrics.s(20),
    zIndex: 9999,
    elevation: 20,
  },
  modalContainer: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(16),
    width: '100%',
    maxWidth: Matrics.s(400),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 15,
  },
  modalHeader: {
    padding: Matrics.s(24),
    paddingBottom: Matrics.vs(16),
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: '700',
    color: colors.TEXT_DARK,
    textAlign: 'center',
    marginBottom: Matrics.vs(8),
  },
  modalSubtitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: Matrics.vs(20),
  },
  modalContent: {
    padding: Matrics.s(24),
    paddingTop: Matrics.vs(8),
    gap: Matrics.vs(12),
  },
  modalButton: {
    borderRadius: Matrics.s(12),
    padding: Matrics.s(16),
    alignItems: 'flex-start',
  },
  continueModalButton: {
    backgroundColor: colors.PRIMARY,
  },
  skipModalButton: {
    backgroundColor: colors.WHITE,
    borderWidth: 1.5,
    borderColor: colors.PRIMARY,
  },
  buttonContent: {
    width: '100%',
  },
  continueModalButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: '700',
    color: colors.WHITE,
    marginBottom: Matrics.vs(4),
  },
  skipModalButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: '700',
    color: colors.PRIMARY,
    marginBottom: Matrics.vs(4),
  },
  buttonDescription: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    lineHeight: Matrics.vs(16),
  },
  continueButtonDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  skipButtonDescription: {
    color: colors.TEXT_SECONDARY,
  },
});

export default ProfileChat;
