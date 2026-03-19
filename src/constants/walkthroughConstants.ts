/**
 * Walkthrough constants for react-native-copilot
 * Storage keys and step ordering for each section
 */

export const WALKTHROUGH_STORAGE_KEYS = {
  GLOBAL_CHAT: "walkthrough_global_chat_completed",
  PROFILE: "walkthrough_profile_completed",
  ANALYZER: "walkthrough_analyzer_completed",
  QUIZ: "walkthrough_quiz_completed",
} as const;

export type WalkthroughSection = keyof typeof WALKTHROUGH_STORAGE_KEYS;

/**
 * Step ordering per section
 * Each section has a dedicated range to avoid conflicts
 * - Global Chat: 1-10
 * - Profile: 11-20
 * - Analyzer: 21-30
 * - Quiz: 31-40
 */
export const WALKTHROUGH_STEPS = {
  // Global Chat (1-10)
  GLOBAL_CHAT: {
    INPUT: { order: 1, name: "globalChatInput" },
    FOOTER: { order: 2, name: "globalChatFooter" },
  },

  // Profile (11-20)
  PROFILE: {
    LIST: { order: 1, name: "profileList" },
    CHAT_INPUT: { order: 2, name: "profileChatInput" },
    ADD_BUTTON: { order: 3, name: "profileAddButton" },
    SEARCH: { order: 4, name: "profileSearch" },
    FOOTER: { order: 5, name: "profileFooter" },
  },

  // Analyzer (21-30)
  ANALYZER: {
    TEXT_ANALYSIS: { order: 1, name: "analyzerTextAnalysis" },
    PARTNER_PORTRAIT: { order: 2, name: "analyzerPartnerPortrait" },
    ARGUMENT: { order: 3, name: "analyzerArgument" },
    FOOTER: { order: 4, name: "analyzerFooter" },
  },

  //FRIENDS (31-40)
  FRIENDS: {
    ADD_BUTTON: { order: 1, name: "friendsAddButton" }, 
    FOOTER: { order: 2, name: "friendsFooter" }, 
  },
  
} as const;

/**
 * Delay in milliseconds before starting walkthrough
 * Ensures all CopilotStep components are mounted
 */
export const WALKTHROUGH_START_DELAY = 1500;
