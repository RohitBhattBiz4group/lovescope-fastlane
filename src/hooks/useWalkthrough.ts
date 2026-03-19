import { useEffect, useCallback } from "react";
import { useCopilot } from "react-native-copilot";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  WALKTHROUGH_STORAGE_KEYS,
  WALKTHROUGH_START_DELAY,
  WalkthroughSection,
} from "../constants/walkthroughConstants";

interface UseWalkthroughReturn {
  startWalkthrough: () => Promise<void>;
  start: () => void;
  markComplete: () => Promise<void>;
  resetWalkthrough: () => Promise<void>;
}

/**
 * Hook to manage walkthrough state for a specific section
 * Handles checking completion status, starting walkthrough, and marking as complete
 */
export const useWalkthrough = (section: WalkthroughSection): UseWalkthroughReturn => {
  const { start, copilotEvents } = useCopilot();

  const storageKey = WALKTHROUGH_STORAGE_KEYS[section];

  const markComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(storageKey, "true");
    } catch (error) {
      console.log("Failed to save walkthrough completion status:", error);
    }
  }, [storageKey]);

  const resetWalkthrough = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.log("Failed to reset walkthrough status:", error);
    }
  }, [storageKey]);

  const startWalkthrough = useCallback(async () => {
    try {
      const completed = await AsyncStorage.getItem(storageKey);
      console.log(`[Walkthrough] Section: ${section}, StorageKey: ${storageKey}, Completed: ${completed}`);
      if (!completed) {
        console.log(`[Walkthrough] Starting walkthrough in ${WALKTHROUGH_START_DELAY}ms...`);
        setTimeout(() => {
          console.log("[Walkthrough] Calling start()...");
          start();
        }, WALKTHROUGH_START_DELAY);
      } else {
        console.log("[Walkthrough] Already completed, skipping.");
      }
    } catch (error) {
      console.log("Failed to check walkthrough status:", error);
    }
  }, [storageKey, start, section]);

  useEffect(() => {
    const handleStop = () => {
      markComplete();
    };

    copilotEvents.on("stop", handleStop);

    return () => {
      copilotEvents.off("stop", handleStop);
    };
  }, [copilotEvents, markComplete]);

  return {
    startWalkthrough,
    start,
    markComplete,
    resetWalkthrough,
  };
};

export default useWalkthrough;
