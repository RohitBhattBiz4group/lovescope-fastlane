import React, {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo
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
	Keyboard,
	TouchableWithoutFeedback
} from "react-native";
import { CopilotStep, useCopilot } from "react-native-copilot";

import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import TypingIndicator from "../../components/common/TypingIndicator";
import SideMenu from "../../components/common/SideMenu";
import ChatSkeleton from "../../skeletons/ChatSkeleton";
import ChatService from "../../services/chatService";
import { toastMessageError, toastMessageInfo, toastMessageUpgrade } from "../../components/common/ToastMessage";
import useChat from "../../hooks/useChat";
import {
	IChatHistory,
	IConversationHistory
} from "../../interfaces/chatInterfaces";
import {
	LIMIT,
	KEYBOARD_OFFSET_IOS,
	KEYBOARD_OFFSET_ANDROID,
	APP
} from "../../constants/commonConstant";
import SpeakToText, {
	SpeakToTextRef
} from "../../components/common/SpeakToText";
import CommonFooter from "../../components/common/CommonFooter";
import { CopilotView } from "../../components/walkthrough";
import { getMaxLength, removeAsterisks } from "../../utils/helper";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { getUnreadNotificationCount } from "../../services/notifications";
import useAuth from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { updateOnboardingStatusLocally } from "../../stateManagement/features/authSlice";
import { updateFriendRequest } from "../../services/friends";
import onboardingService from "../../services/onboardingService";

const GlobalChat: React.FC<ScreenProps> = ({ route,navigation }) => {
	const { t } = useTranslation();
	const flatListRef = useRef<FlatList>(null);
	const { start, stop, copilotEvents } = useCopilot();
	const startRef = useRef(start);
	const walkthroughStartedRef = useRef(false);
	const isUserInitiatedStopRef = useRef(true);

	const { authData, setAuthData } = useAuth();
	const dispatch = useDispatch();
	const authDataRef = useRef(authData);

	const currentPlan = authData?.plan;;

	const onboardingStatus = authData?.user?.onboarding_status;
	const shouldShowOnboarding = onboardingStatus && onboardingStatus.global_chat_onboarding !== true;
	const [isScreenFocused, setIsScreenFocused] = useState(false);
	const showOnboardingTooltip = shouldShowOnboarding && isScreenFocused;

	// Show User Tab tooltip after global chat onboarding is done,
	// but only if skip_walkthrough and friends_onboarding are both false
	const [showUserTabTooltip, setShowUserTabTooltip] = useState(false);

	const [skip, setSkip] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [inputText, setInputText] = useState("");
	const [isNewChat, setIsNewChat] = useState(true);
	const [searchText, setSearchText] = useState("");
	const [menuVisible, setMenuVisible] = useState(false);
	const [chatId, setChatId] = useState<number | null>(null);
	const [conversationSkip, setConversationSkip] = useState(0);
	const [conversationHasMore, setConversationHasMore] = useState(true);
	const [conversationLoading, setConversationLoading] = useState(false);
	const [historyMessages, setHistoryMessages] = useState<IChatHistory[]>([]);
	const [conversationHistory, setConversationHistory] = useState<
		IConversationHistory[]
	>([]);
	const [unreadCount, setUnreadCount] = useState<number>(0);

	const {
		messages,
		send,
		typingLoader,
		setMessages,
		messageLimitReached,
		messageLimitMessage,
	} = useChat(chatId!);

	const micRef = useRef<SpeakToTextRef>(null);

	const updateFriendRequestFunc = async () => {
		try {
			const phoneNumber = authData?.user?.phone_number;

			if (typeof phoneNumber !== "string" || !phoneNumber) {
				return;
			}

			await updateFriendRequest({ phoneNumber });
		} catch (error) {
			console.log(error, "error in update friend request");
			toastMessageError(t("common.something_went_wrong"));
		}
	};

	const createChat = useCallback(
		async (forceNew: boolean = false, chatIdProp?: number) => {
			if (chatId && !forceNew) {
				return;
			}

			try {
				const response = await ChatService.createChat(
					chatIdProp ? { chatId: chatIdProp } : {}
				);

				if (response?.data?.id) {
					setChatId(response?.data?.id);
				}
			} catch (e) {
				console.log("Failed to create chat", e);
			}
		},
		[chatId]
	);

	// Refresh only the first page to update order without resetting pagination
	const refreshFirstPage = useCallback(async () => {
		if (conversationLoading) return;
		try {
			const response = await ChatService.getConversationalHistory(0, LIMIT);

			if (response.success && response.data && response.data.length) {
				// Sort by updated_ts descending (latest first)
				const sortedFirstPage = [...response.data].sort((a, b) => {
					const timeA = a.updated_ts ? new Date(a.updated_ts).getTime() : 0;
					const timeB = b.updated_ts ? new Date(b.updated_ts).getTime() : 0;
					return timeB - timeA;
				});

				// Update existing list: replace first page items, keep the rest
				setConversationHistory((prev) => {
					const firstPageIds = new Set(sortedFirstPage.map((item) => item.id));
					// Keep items from pagination that aren't in the first page
					const remainingItems = prev.filter(
						(item) => !firstPageIds.has(item.id)
					);
					// Combine and re-sort
					const combined = [...sortedFirstPage, ...remainingItems];
					return combined.sort((a, b) => {
						const timeA = a.updated_ts ? new Date(a.updated_ts).getTime() : 0;
						const timeB = b.updated_ts ? new Date(b.updated_ts).getTime() : 0;
						return timeB - timeA;
					});
				});
			}
		} catch (e) {
			console.log("Failed to refresh first page", e);
		}
	}, [conversationLoading]);

	const getConversationHistory = useCallback(
		async (initial: boolean = false) => {
			if (conversationLoading || (!initial && !conversationHasMore)) return;
			try {
				setConversationLoading(true);

				const nextSkip = initial ? 0 : conversationSkip;
				const response = await ChatService.getConversationalHistory(
					nextSkip,
					LIMIT
				);

				if (response.success && response.data && response.data.length) {
					// Sort by updated_ts descending (latest first)
					const sortedData = [...response.data].sort((a, b) => {
						const timeA = a.updated_ts ? new Date(a.updated_ts).getTime() : 0;
						const timeB = b.updated_ts ? new Date(b.updated_ts).getTime() : 0;
						return timeB - timeA; // Descending order (latest first)
					});

					if (initial) {
						setConversationHistory(sortedData);
						// Reset skip counter when doing initial load
						setConversationSkip(sortedData.length);
					} else {
						setConversationHistory((prev) => {
							const combined = [...prev, ...sortedData];
							// Re-sort combined list by updated_ts
							return combined.sort((a, b) => {
								const timeA = a.updated_ts
									? new Date(a.updated_ts).getTime()
									: 0;
								const timeB = b.updated_ts
									? new Date(b.updated_ts).getTime()
									: 0;
								return timeB - timeA;
							});
						});
						// Increment skip counter for pagination
						setConversationSkip((prev) => prev + sortedData.length);
					}

					if (response.data.length < LIMIT) {
						setConversationHasMore(false);
					} else {
						setConversationHasMore(true);
					}
				} else if (
					!response.success &&
					(!response.data || response.data.length === 0)
				) {
					if (initial) {
						setConversationHistory([]);
						setConversationSkip(0);
					}
					setConversationHasMore(false);
				}
			} catch (e) {
				console.log("Failed to get conversation history", e);
			} finally {
				setConversationLoading(false);
			}
		},
		[conversationSkip, conversationHasMore, conversationLoading]
	);

	useEffect(() => {
		if (!chatId) {
			createChat();
		}
	}, [chatId, createChat]);

	// Load conversation history on mount
	useEffect(() => {
		updateFriendRequestFunc();
		getConversationHistory(true);
	}, []);

	// Reset walkthrough state and stop on screen blur
	useFocusEffect(
		useCallback(() => {
			// Reset walkthrough state on focus so it can start fresh
			walkthroughStartedRef.current = false;
			isUserInitiatedStopRef.current = true;
			setIsScreenFocused(true);

			return () => {
				setIsScreenFocused(false);
				// Stop any active walkthrough when leaving screen (not user-initiated)
				if (walkthroughStartedRef.current) {
					isUserInitiatedStopRef.current = false;
					stop();
				}
			};
		}, [stop])
	);

	// Refetch unread notification count on screen focus
	useFocusEffect(
		useCallback(() => {
			fetchUnreadNotificationCount();
		}, [])
	);

	// Keep refs updated to avoid stale closures
	useEffect(() => {
		startRef.current = start;
	}, [start]);

	useEffect(() => {
		authDataRef.current = authData;
	}, [authData]);

	// Start onboarding tooltip on screen focus
	useFocusEffect(
		useCallback(() => {
			if (walkthroughStartedRef.current) return;

			// Don't restart the input tooltip if the footer tooltip is pending.
			// After dismissing the input tooltip, setAuthData updates Redux async,
			// so showOnboardingTooltip can still be true on the next render while
			// showUserTabTooltip is already true. Without this guard the input
			// tooltip would restart and block the footer tooltip from starting.
			if (showUserTabTooltip) return;

			if (showOnboardingTooltip) {
				walkthroughStartedRef.current = true;
				const timer = setTimeout(() => {
					startRef.current("globalChatInput");
				}, Platform.OS === APP.ANDROID ? 50 : 500);
				return () => clearTimeout(timer);
			}

			// If onboarding already completed, do nothing
			if (onboardingStatus && onboardingStatus.global_chat_onboarding) {
				return;
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [showOnboardingTooltip, showUserTabTooltip])
	);

	// Handle onboarding tooltip dismissal (only on user interaction)
	useEffect(() => {
		if (!showOnboardingTooltip) return;

		const handleStop = async () => {
			// Only update if user tapped screen or pressed hardware back
			if (!isUserInitiatedStopRef.current) return;

			try {
				await onboardingService.updateOnboardingField(
					"global_chat_onboarding",
					true,
				);
				
				// Immediately update Redux state for instant UI feedback
				dispatch(updateOnboardingStatusLocally({
					global_chat_onboarding: true,
				}));
				
			} catch (error) {
				console.log("Failed to update global_chat_onboarding:", error);
			}
			const currentAuthData = authDataRef.current;
			if (currentAuthData?.user) {
				const currentStatus = currentAuthData.user.onboarding_status;
				setAuthData({
					...currentAuthData,
					user: {
						...currentAuthData.user,
						onboarding_status: {
							...currentStatus!,
							global_chat_onboarding: true,
						},
					},
				});

				// Chain the User Tab tooltip if skip_walkthrough and friends_onboarding are both false
				if (
					currentStatus?.skip_walkthrough !== true &&
					currentStatus?.friends_onboarding !== true
				) {
					walkthroughStartedRef.current = false;
					setShowUserTabTooltip(true);
				}
			}
		};

		copilotEvents.on("stop", handleStop);
		return () => {
			copilotEvents.off("stop", handleStop);
		};
	}, [showOnboardingTooltip, copilotEvents, setAuthData]);

	// Start User Tab tooltip after global chat tooltip is dismissed
	// (follows the same pattern as Analyzer's chat prompt tooltip)
	useEffect(() => {
		if (!showUserTabTooltip) return;

		const userTabStartedRef = { current: false };

		const triggerUserTabTooltip = () => {
			console.log("Triggering User Tab Tooltip");
			if (userTabStartedRef.current) return;
			userTabStartedRef.current = true;
			startRef.current("globalChatFooter");
		};

		const startTimer = setTimeout(triggerUserTabTooltip, 10);

		const handleUserTabStop = () => {
			setShowUserTabTooltip(false);
			if (isUserInitiatedStopRef.current) {
				navigation.navigate("UserTab" as never);
			}
		};

		copilotEvents.on("stop", handleUserTabStop);
		return () => {
			if (startTimer) clearTimeout(startTimer);
			copilotEvents.off("stop", handleUserTabStop);
		};
	}, [showUserTabTooltip, copilotEvents]);

	const fetchUnreadNotificationCount = useCallback(async () => {
		try {
			const res = await getUnreadNotificationCount();
			if (res.success && res.data?.unread_count !== undefined) {
				setUnreadCount(res.data.unread_count);
			}
		} catch (error) {
			console.log("Failed to get unread notification count", error);
		}
	}, []);

	// Refresh conversation history when bot message is received
	useEffect(() => {
		const botMessages = messages.filter((msg) => msg.isBot);
		if (botMessages.length > 0 && chatId) {
			// Debounce: refresh only first page to update order without resetting pagination
			const timer = setTimeout(() => {
				refreshFirstPage();
			}, 1500);
			return () => clearTimeout(timer);
		}
	}, [messages, chatId, refreshFirstPage]);

  useEffect(() => {
    if (messageLimitReached) {
      toastMessageInfo(
        messageLimitMessage ||
          t("global_chat.limit_reached")
      );
    }
  }, [messageLimitReached, messageLimitMessage]);

	const fetchHistory = useCallback(
		async (initial: boolean = false, chatId: number) => {
			if (!chatId || loading) return;
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
					}));
					if (initial) {
						setHistoryMessages(mapped);
					} else {
						setHistoryMessages((prev) => [...prev, ...mapped]);
					}

					setSkip(nextSkip + response?.data?.length);

					if (response?.data?.length < LIMIT) {
						setHasMore(false);
					}
				} else if (!response.success) {
					toastMessageError(t("common.something_went_wrong"));
				}
			} catch (e) {
				console.log("Failed to load chat history", e);
				toastMessageError(t("common.something_went_wrong"));
			} finally {
				setLoading(false);
			}
		},
		[chatId, loading, skip, hasMore]
	);

	const combinedMessages = useMemo(() => {
		const liveMessages = messages.map((event, index) => ({
			id: `live_${chatId}_${index}_${event.message.slice(0, 10)}`,
			message: event.message,
			isBot: !event.isBot,
		}));

		// FIX: overall order = oldest -> newest
		return [...liveMessages.reverse(), ...historyMessages];
	}, [historyMessages, messages, chatId]);

	const handleTextChange = (text: string) => {
		const maxLength = getMaxLength(currentPlan);

		if (maxLength && text.length >= maxLength) {
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
									tab: "GlobalChatTab",
									screen: route?.name,
								},
							},
						});
						return;
					}
					(navigation as any).navigate?.("Subscription", {
						navigationFrom: {
							tab: "GlobalChatTab",
							screen: route?.name,
						},
					});
				}
			);
		}

		setInputText(text);
	};

	const handleSend = async () => {
		if (!inputText.trim()) return;
		if (messageLimitReached) return;

		let currentChatId = chatId;

		// Create a new chat if chatId is null (new chat scenario)
		if (!currentChatId) {
			try {
				const response = await ChatService.createChat({});
				if (response?.data?.id) {
					currentChatId = response.data.id;
					setChatId(currentChatId);
					setIsNewChat(false);
					// Refresh conversation history to show the new chat
					setTimeout(() => {
						refreshFirstPage();
					}, 500);
				} else {
					return; // Don't send message if chat creation fails
				}
			} catch (e) {
				console.log("Failed to create chat", e);
				return; // Don't send message if chat creation fails
			}
		}

		// Ensure we have a valid chatId before sending
		if (!currentChatId) {
			return;
		}

		send(inputText.trim());
		// Stop mic recording when user sends the message
		micRef.current?.stopMic?.();
		setInputText("");

		// Refresh conversation history after sending message to update order
		setTimeout(() => {
			refreshFirstPage();
		}, 1000);

		// For inverted FlatList, offset 0 is the bottom (latest message)
		setTimeout(() => {
			flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
		}, 100);
	};

	const renderMessage = ({ item }: { item: IChatHistory }) => (
		<View
			style={[
				styles.messageContainer,
				item.isBot ? styles.userMessageContainer : styles.botMessageContainer,
			]}
		>
			<View
				style={[
					styles.messageBubble,
					item.isBot ? styles.userBubble : styles.botBubble,
				]}
			>
				{item.isBot ? (
					<Image
						source={Images.USER_POLYGON}
						style={styles.userPolygon}
						resizeMode="contain"
					/>
				) : (
					<Image
						source={Images.BOT_POLYGON}
						style={styles.botPolygon}
						resizeMode="contain"
					/>
				)}
				<Text
					style={[
						styles.messageText,
						item.isBot ? styles.userMessageText : styles.botMessageText,
					]}
				>
					{removeAsterisks(item.message)}
				</Text>
			</View>
		</View>
	);

	const renderEmptyState = () => (
		<View style={styles.emptyStateContainer}>
			<Image
				source={Images.LOVE_SEARCH}
				style={styles.loveSearchIcon}
				resizeMode="contain"
			/>
			<Text style={styles.emptyStateTitle}>{t("global_chat.empty_state_title")}</Text>
			<Text style={styles.emptyStateDescription}>
				{t("global_chat.empty_state_description")}
			</Text>
		</View>
	);

	const renderHeader = () => (
		<View style={styles.headerContainer}>
			<TouchableOpacity
				style={styles.menuButton}
				onPress={() => {
					Keyboard.dismiss();
					setMenuVisible(true);
				}}
			>
				<Image
					source={Images.MENU_ICON}
					style={styles.menuIcon}
					resizeMode="contain"
				/>
			</TouchableOpacity>

			<Image source={Images.LOGO} style={styles.logo} resizeMode="contain" />

			<TouchableOpacity
				style={styles.notificationButton}
				onPress={() => navigation.navigate("Notifications")}
			>
				<Image
					source={Images.NOTIFICATION_ICON}
					style={styles.notificationIcon}
					resizeMode="contain"
				/>
				{unreadCount > 0 && <View style={styles.badge} />}
			</TouchableOpacity>
		</View>
	);

	return (
		<ImageBackground
			source={Images.HOME_CHAT_BG}
			style={styles.container}
			resizeMode="cover"
		>
			<StatusBar
				barStyle="dark-content"
				backgroundColor="transparent"
				translucent={false}
			/>

			{renderHeader()}

			<KeyboardAvoidingView
				style={styles.keyboardAvoid}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={
					Platform.OS === APP.IOS
						? KEYBOARD_OFFSET_IOS
						: KEYBOARD_OFFSET_ANDROID
				}
			>
				{loading && combinedMessages.length === 0 ? (
					<View style={{ flex: 1 }}>
						<ChatSkeleton />
					</View>
				) : combinedMessages.length === 0 ? (
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View style={styles.emptyStateWrapper}>{renderEmptyState()}</View>
					</TouchableWithoutFeedback>
				) : (
					<FlatList
						ref={flatListRef}
						data={combinedMessages}
						renderItem={renderMessage}
						keyExtractor={(item) => item.id}
						inverted
						contentContainerStyle={styles.messagesContainer}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
						keyboardDismissMode="on-drag"
						ListHeaderComponent={typingLoader ? <TypingIndicator /> : null}
						onEndReached={() => {
							if (!loading && hasMore && chatId && !isNewChat) {
								fetchHistory(false, chatId);
							}
						}}
						ListFooterComponent={loading ? <ChatSkeleton /> : null}
					/>
				)}

        {messageLimitReached ? (
          <View style={styles.limitBanner}>
            <Text style={styles.limitBannerText}>
              {messageLimitMessage ||
                t("global_chat.limit_reached")
                }
            </Text>
          </View>
        ) : null}

				<CopilotStep
					text={
						t("walkthrough.global_chat.onboarding_tooltip")
					}
					order={1}
					name={'globalChatInput'}
					active={Boolean(showOnboardingTooltip && !showUserTabTooltip)}
				>
					<CopilotView style={styles.inputContainer}>
						<View style={styles.inputWrapper}>
							<SpeakToText onSpeechChange={setInputText} ref={micRef} />

							<TextInput
								style={styles.textInput}
								placeholder={t("global_chat.input_placeholder")}
								placeholderTextColor="rgba(26, 26, 26, 0.4)"
								value={inputText}
								onChangeText={handleTextChange}
								multiline
								maxLength={
									Number(currentPlan?.limits?.text_limit)
								}
							/>

							<TouchableOpacity
								style={styles.sendButton}
								onPress={handleSend}
								disabled={!inputText.trim() || typingLoader || !chatId || messageLimitReached}
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
			</KeyboardAvoidingView>

			<SideMenu
				visible={menuVisible}
				onClose={() => {
					Keyboard.dismiss();
					setMenuVisible(false);
				}}
				onNewChat={() => {
					setMenuVisible(false);
					setChatId(null);
					createChat(true);
					setMessages([]);
					setHistoryMessages([]);
					setSkip(0);
					setHasMore(false);
					setIsNewChat(true);
				}}
				onConversationPress={(item) => {
					Keyboard.dismiss();
					setMenuVisible(false);

					// Reset chat-specific state so messages don't bleed between chats
					setMessages([]);
					setHistoryMessages([]);
					setSkip(0);
					setHasMore(true);
					setIsNewChat(false);

					// Load history for the selected chat and (re)attach socket
					fetchHistory(true, Number(item.id));
					createChat(true, Number(item.id));
				}}
				conversationHistory={conversationHistory}
				conversationLoading={conversationLoading}
				searchValue={searchText}
				onSearchChange={setSearchText}
				onLoadMoreConversations={() => {
					if (!conversationLoading && conversationHasMore)
						getConversationHistory(false);
				}}
			/>

			<CommonFooter
				activeTab="chat"
				onChatPress={() => { }}
				onHeartPress={() => (navigation as any).navigate("ProfilesTab", {
					screen: "PartnerProfiles",
				})}
				onFilePress={() =>
					(navigation as any).navigate("FilesTab", {
						screen: "Analyzer",
						params: { resetSequence: Date.now() },
					})
				}
				onUserPress={() => navigation.navigate("UserTab" as never)}
				onSettingsPress={() => navigation.navigate("SettingsTab" as never)}
				bgColor="#fff"
				{...(showUserTabTooltip && {
					userTabTooltip: {
						active: showUserTabTooltip,
						text: t("walkthrough.global_chat.user_tab_tooltip"),
						order: 2,
						name: "globalChatFooter",
					},
				})}
			/>
		</ImageBackground>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent"
	},
	headerContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Matrics.s(20),
		paddingVertical: Matrics.vs(12),
		backgroundColor: "transparent"
	},
	menuButton: {
		padding: Matrics.s(4)
	},
	menuIcon: {
		width: Matrics.s(20),
		height: Matrics.vs(16),
		tintColor: colors.TEXT_PRIMARY
	},
	logo: {
		width: Matrics.s(90),
		height: Matrics.vs(25),
		objectFit: "contain"
	},
	notificationButton: {
		position: "relative",
		padding: Matrics.s(0)
	},
	notificationIcon: {
		width: Matrics.s(21),
		height: Matrics.vs(21)
	},
	badge: {
		position: "absolute",
		top: Matrics.vs(2),
		right: Matrics.s(2),
		width: Matrics.s(7),
		height: Matrics.s(7),
		minWidth: Matrics.s(7),
		minHeight: Matrics.s(7),
		borderRadius: Matrics.s(100),
		backgroundColor: colors.DANGER
	},
	keyboardAvoid: {
		flex: 1
	},
	emptyStateWrapper: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center"
	},
	emptyStateContainer: {
		alignItems: "center",
		paddingHorizontal: Matrics.s(40)
	},
	loveSearchIcon: {
		width: Matrics.s(40),
		height: Matrics.s(40),
		marginBottom: Matrics.vs(15)
	},
	emptyStateTitle: {
		fontSize: Matrics.ms(20),
		fontFamily: typography.fontFamily.Poppins.SemiBold,
		fontWeight: "600",
		color: colors.TEXT_DARK,
		textAlign: "center",
		marginBottom: Matrics.vs(10)
	},
	emptyStateDescription: {
		fontSize: FontsSize.Medium,
		fontFamily: typography.fontFamily.Satoshi.Medium,
		fontWeight: "500",
		color: colors.TEXT_PRIMARY,
		textAlign: "center",
		opacity: 0.6,
		lineHeight: Matrics.vs(18),
		paddingHorizontal: 15
	},
	messagesContainer: {
		paddingHorizontal: Matrics.s(16),
		paddingTop: Matrics.vs(20),
		paddingBottom: Matrics.vs(20)
	},
	messageContainer: {
		marginBottom: Matrics.vs(10),
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
	userMessageText: {
		color: colors.WHITE
	},
	botMessageText: {
		color: colors.TEXT_DARK
	},
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
		paddingEnd: Matrics.s(5),
		paddingStart: Matrics.s(10),
		paddingVertical: Matrics.vs(4),
		borderColor: "#E8EBEC",
		borderWidth: 1
	},
	micButton: {
		marginRight: Matrics.s(5),
		padding: Matrics.s(2)
	},
	micIcon: {
		width: Matrics.s(22),
		height: Matrics.vs(22),
		tintColor: "rgba(26, 26, 26, 0.6)"
	},
	textInput: {
		flex: 1,
		fontSize: FontsSize.Regular,
		fontFamily: typography.fontFamily.Satoshi.Medium,
		color: colors.TEXT_DARK,
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
	sendIcon: {
		width: Matrics.s(40),
		height: Matrics.s(40),
		marginTop: Matrics.vs(2),
	},
	userPolygon: {
		position: "absolute",
		top: Matrics.vs(0),
		right: Matrics.s(-9),
		width: Matrics.s(30),
		height: Matrics.s(10),
		zIndex: -1
	},
	botPolygon: {
		position: "absolute",
		top: Matrics.vs(0),
		left: Matrics.s(-9),
		width: Matrics.s(30),
		height: Matrics.s(10),
		zIndex: -1
	}
});

export default GlobalChat;
