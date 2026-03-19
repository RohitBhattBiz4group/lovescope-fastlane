const endpoints = {
	auth: {
		SIGNIN: "/auth/sign-in",
		SIGNUP: "/auth/sign-up",
		GOOGLE_SIGNIN: "/auth/google/sign-in",
		GOOGLE_SIGNUP: "/auth/google/sign-up",
		FORGOT_PASSWORD: "/auth/forgot-password",
		RESET_PASSWORD: "/auth/reset-password",
		VERIFY_OTP: "/auth/verify-otp",
		RESEND_OTP: "/auth/resend-otp",
		APPLE_SIGNIN: "/auth/apple/sign-in",
	},
	user_profile: {
		CHANGE_PASSWORD: "/user/change-password",
		PROFILE: "/user/profile",
		UPDATE_PROFILE_IMAGE: "/user/update-profile-image",
		DELETE_ACCOUNT: "/user/delete-account",
		UPDATE_USER_PROFILE: "/user/update-profile",
	},
	analyzer: {
		TEXT_ANALYSIS: "/analyze/analyze-text",
		IMAGE_ANALYZER: "/analyze/analyze-image",
		GET_ANALYZER_IMAGE_PRESIGNED_URL: "/analyze/get-analyzer-image-presigned-url",
		SYNC_WITH_CHAT: "/analyze/sync-to-chat",
		LINE_BY_LINE_TEXT : '/analyze/line-by-line-text',
		LINE_BY_LINE_IMAGE : '/analyze/line-by-line-image',
		GET_TEXT_ANALYSES : '/analyze/text-analyses/{profile_id}',
	},
	chat: {
		CHAT_HISTORY: "/chat/{chatId}",
		CREATE_CHAT: "/chat/create",
		CONVERSATION_HISTORY: "/chat/conversation-history",
  	},
	friends: {
		SEND_REQUEST: "/friends/send-request",
		APPROVE_REQUEST: "/friends/approve-request",
		REJECT_REQUEST: "/friends/reject-request",
		REQUESTS: "/friends/requests",
		LIST: "/friends/list",
		DELETE: "/friends/delete",
		ALL: "/friends/all",
		SEND_INVITE : "/friends/send-invite",
		UPDATE_REQUEST : "/friends/update-request"
	},
	notifications: {
		LIST: "/notifications/list",
		MARK_ALL_AS_READ: "/notifications/mark-all-as-read",
		UNREAD_COUNT: "/notifications/unread-count"
	},
	onboarding: {
		QUESTIONS: "/onboarding/questions",
		ANSWER_QUESTION: "/onboarding/answer",
	    UPDATE_ONBOARDING_STATUS: "/onboarding/update-onboarding-status",
	    FETCH_ANSWER: "/onboarding/fetch-answer",
	    FETCH_ALL_ANSWERS: "/onboarding/fetch-all-answers",
	    COMPLETE_PROFILE_CREATION: "/onboarding/complete-profile-creation",
	    UPDATE_ONBOARDING_FIELD: "/onboarding/update-onboarding-field",
	    QUESTION_PAGES: "/onboarding/question-pages",
	    SUBMIT_RESPONSES: "/onboarding/submit-responses",
	    FETCH_RESPONSES: "/onboarding/fetch-responses",
	},
	preferences: {
		QUESTIONS: "/preferences/questions",
		ANSWER_QUESTION: "/preferences/answer",
		FETCH_ANSWER: "/preferences/fetch-answer",
		FETCH_ALL_ANSWERS: "/preferences/fetch-all-answers",
	},
	profiles: {
		CREATE: "/profiles",
		GET_ALL: "/profiles",
		GET_BY_ID: "/profiles",
		UPDATE: "/profiles",
		DELETE: "/profiles",
	},
	portrait: {
		GENERATE : '/portrait/generate-analysis'
	},
	group: {
		CREATE: "/group",
		LIST: "/group",
		GROUP_DETAIL: "/group/{group_id}",
		PRESIGNED_GROUP_URL: "/group/get-presigned-group-url",
		UPDATE_GROUP: "/group/{group_id}",
		ADD_MEMBER: "/group/add-member",
		REMOVE_MEMBER: "/group/remove-member",
		LEAVE_GROUP: "/group/{group_id}/leave",
		DELETE: "/group/{group_id}",
		FETCH_FRIENDS_NOT_IN_GROUP :'/group/{group_id}/friends-not-in-group',
		GET_GROUP_MEMBERS_LIST : "/group/{group_id}/members"
	},
	quiz: {
		CREATE: "/quiz",
		LIST: "/quiz",
		COUNT: "/quiz/count",
		QUIZ_DETAIL: "/quiz/{quiz_id}",
		UPDATE: "/quiz/{quiz_id}",
		DELETE: "/quiz/{quiz_id}",
		SHARE_QUIZ : '/quiz/share',
		GET_FRIEND_QUIZ : "/quiz/friend-chat/{friend_id}",
		SUBMIT_ANSWERS : "/quiz/submit-answers",
		VIEW_RESPONSE : "/quiz/view-response",
		GET_GROUP_QUIZ : "/quiz/group-chat/{group_id}",
		PRE_MADE_QUIZ : "/quiz/pre-made-quiz",
		SYNC_SUMMARY_TO_CHAT : "/quiz/sync-summary-to-chat",
		GENERATE_TITLE : "/quiz/generate-title",
	},
	timeline: {
		GET_TIMELINE : "/timeline",
		GET_TIMELINE_SUMMARY : "/timeline/summary",
		UPDATE_TIMELINE_ENTRY : "/timeline/entry",
		DELETE_TIMELINE_ENTRY : "/timeline/entry",
	},
	subscriptions: {
		GET_PLANS: "/subscriptions",
		CREATE_USER_SUBSCRIPTION: "/subscriptions/create",
		GET_USER_SUBSCRIPTIONS: "/subscriptions/user-subscription",
	},
	argumentAnalyzer: {
		ANALYSE_ARGUMENT: "/argument-analyser/analyse",
		GET_FORM_DATA: "/argument-analyser/{profile_id}"
	},
};

export default endpoints;

