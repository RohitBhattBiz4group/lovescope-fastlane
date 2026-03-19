import { DEFAULT_TIMEZONE, PLANS } from "../constants/commonConstant";
import { NativeModules, Platform, Linking } from "react-native";

// Convert a string to title case (capitalize first letter of each word)
export const getTitleCase = (name: string): string => {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
/**
 * Get initials from a name string
 * @param name - The full name to extract initials from
 * @returns The initials (first and last name initials, or first 2 characters if single word)
 */
export const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

const TRUNCATE_LIMIT = 20;

export const truncateText = (value?: string, limit: number = TRUNCATE_LIMIT) => {
    if (!value) return "";
    return value.length > limit ? `${value.substring(0, limit)}...` : value;
};

const getDeviceTimezone = (): string => {
    try {
        if (Platform.OS === 'ios') {
            return NativeModules.SettingsManager?.settings?.timezone || DEFAULT_TIMEZONE;
        } else if (Platform.OS === 'android') {
            // Try to get timezone from Android's JavaScriptCore or Hermes
            const androidTimezone = NativeModules.RNDeviceInfo?.getTimezone?.()
                || NativeModules.PlatformConstants?.getConstants?.()?.timezone;
            if (androidTimezone) return androidTimezone;
        }
        // Fallback: try Intl API
        const intlTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (intlTimezone) return intlTimezone;

        // Last resort: use default
        return DEFAULT_TIMEZONE;
    } catch {
        return DEFAULT_TIMEZONE;
    }
};

export const formatQuizTime = (dateString?: string | null): string => {
    if (!dateString) return '';
    try {
        const timezone = getDeviceTimezone();
        // Check if date has timezone info (ends with Z or has +/- offset after time portion)
        const hasTimezone = dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString) || /[+-]\d{4}$/.test(dateString);

        // Assume UTC if no timezone specified, append Z
        const dateWithTz = hasTimezone ? dateString : dateString + 'Z';
        const date = new Date(dateWithTz);

        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone,
        });
    } catch {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }
};

/**
 * Remove all asterisks from a string
 * @param text - The text to remove asterisks from
 * @returns The text with all asterisks removed
 */
export const removeAsterisks = (text: string): string => {
    if (!text) return '';
    return text.replace(/\*/g, '');
};

/**
 * Format member names for display in group header
 * @param members - Array of member names or objects with full_name property
 * @param maxDisplay - Maximum number of names to display before showing "+X others"
 * @returns Formatted string like "Leslie, Anthony... +2 others"
 */
export const formatMemberNames = (
    members: Array<string | { full_name: string }>,
    maxDisplay: number = 2
): string => {
    if (!members || members.length === 0) return '';

    const memberNames = members.map(member =>
        typeof member === 'string' ? member : member.full_name
    );

    if (memberNames.length <= maxDisplay) {
        return memberNames.join(', ');
    }

    const displayedNames = memberNames.slice(0, maxDisplay);
    const remainingCount = memberNames.length - maxDisplay;
    return `${displayedNames.join(', ')}... +${remainingCount} others`;
};

export const isEmailValue = (value: string) => {
    const v = (value || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

export const getMaxLength = (currentPlan: any) => {
    const limit = Number(currentPlan?.limits?.text_limit);
    if (currentPlan && (currentPlan.product_id === null || currentPlan.product_id === undefined)) return limit;

    if (currentPlan.product_id.includes(PLANS.PREMIUM_PLUS)) {
        return limit;
    }
    if (currentPlan.product_id.includes(PLANS.PREMIUM)) {
        return limit;
    }
    return limit;
};


export const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
        console.error("Failed to open URL:", err),
    );
};