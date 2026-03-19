import { View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { walkthroughable } from "react-native-copilot";

/**
 * Walkthroughable components for react-native-copilot
 * These HOC-wrapped components can be highlighted during walkthrough
 */

export const CopilotView = walkthroughable(View);
export const CopilotText = walkthroughable(Text);
export const CopilotTouchableOpacity = walkthroughable(TouchableOpacity);
export const CopilotTextInput = walkthroughable(TextInput);
export const CopilotImage = walkthroughable(Image);
