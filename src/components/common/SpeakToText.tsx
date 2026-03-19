import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle
} from "react";
import {
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { start, stop, subscribe } from "react-native-rn-voicekit";
import Images from "../../config/Images";
import {
  APP,
  SPEAK_TO_TEXT_LANGUAGE,
  SPEAK_TO_TEXT_RESTART_DELAY,
} from "../../constants/commonConstant";

export type SpeakToTextRef = {
  stopMic: () => void;
  startMic: () => void;
};

type Props = {
  onSpeechChange: (value: string) => void;
};

const SpeakToText = forwardRef<SpeakToTextRef, Props>((props, ref) => {
  const { onSpeechChange } = props;
  const [listening, setListening] = useState(false);

  const fullTextRef = useRef("");
  const restartTimeout = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    stopMic,
    startMic,
  }));

  // ---------- Restart logic ----------
  const safeRestart = () => {
    if (!listening) return;

    if (restartTimeout.current) clearTimeout(restartTimeout.current);

    restartTimeout.current = setTimeout(() => {
      start(SPEAK_TO_TEXT_LANGUAGE);
    }, SPEAK_TO_TEXT_RESTART_DELAY);
  };

  useEffect(() => {
    const unsub = subscribe({
      onSpeechStart: () => {
        if (!listening) return;
      },

      onSpeechPartialResults: (value) => {
        if (!listening) return;
        const partial = value?.join(" ") ?? "";
        onSpeechChange((fullTextRef.current + " " + partial).trim());
      },

      onSpeechResults: (value) => {
        if (!listening) return;
        const finalText = value?.join(" ") ?? "";
        fullTextRef.current += " " + finalText;
        onSpeechChange(fullTextRef.current.trim());
      },

      onSpeechEnd: () => {
        if (!listening) return;
        safeRestart();
      },

      onSpeechError: (speechError) => {
        if (!listening) return;
        console.log("❌ speech error", speechError);
        safeRestart();
      },
    });

    return () => {
      unsub();
      if (restartTimeout.current) clearTimeout(restartTimeout.current);
    };
  }, [listening]);

  // ---------- Permissions ----------
  const requestPermission = async () => {
    if (Platform.OS === APP.ANDROID) {
      return PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
    }
    return "granted";
  };

  // ---------- Start Mic ----------
  const startMic = async () => {
    const permission = await requestPermission();
    if (permission !== PermissionsAndroid.RESULTS.GRANTED) return;

    fullTextRef.current = "";
    start("en-US");
    setListening(true);
  };

  // ---------- Stop Mic ----------
  const stopMic = () => {
    if (restartTimeout.current) clearTimeout(restartTimeout.current);
    stop();
    setListening(false);
    // Keep the current input value in the parent when mic stops.
    // fullTextRef will be reset on next startMic call.
  };

  return (
    <TouchableOpacity onPress={listening ? stopMic : startMic}>
      <Image
        source={Images.MIC_ICON}
        style={{
          width: 22,
          height: 22,
          tintColor: listening ? "red" : "gray",
        }}
      />
    </TouchableOpacity>
  );
});

export default SpeakToText;