// Get the width of the screen to make the toast span the full width

import Toast from "react-native-toast-message";

// Get the width of the screen to make the toast span the full width
const toastMessageSuccess = (
    message: string,
    message2?: string,
    duration?: number
) => {
    Toast.show({
        type: "success",
        text1: message,
        text2: message2,
        visibilityTime: duration || 3000,
    });
};

const toastMessageError = (
    message: string,
    message2?: string,
    duration?: number
) => {
    Toast.show({
        type: "error",
        text1: message,
        text2: message2,
        visibilityTime: duration || 3000,
    });
};

const toastMessageInfo = (
    message: string,
    message2?: string,
    duration?: number
) => {
    Toast.show({
        type: "info",
        text1: message,
        text2: message2,
        visibilityTime: duration || 3000,
    });
};

const toastMessageUpgrade = (
    message: string,
    message2: string | undefined,
    ctaText: string,
    onPress: () => void,
    duration?: number
) => {
    Toast.show({
        type: "upgrade",
        text1: message,
        text2: message2,
        props: {
            ctaText,
            onPress: () => {
                Toast.hide();
                onPress?.();
            },
        },
        visibilityTime: duration || 5000,
    });
};

export { toastMessageError, toastMessageInfo, toastMessageSuccess, toastMessageUpgrade };

