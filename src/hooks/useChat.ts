// src/hooks/useChat.ts

import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import socket from "../utils/socket";
import { IChatEvent } from "../interfaces/chatInterfaces";
import useAuth from "./useAuth";

export default function useChat(chatId: number) {
  const [typingLoader, setTypingLoader] = useState(false);
  const [messages, setMessages] = useState<IChatEvent[]>([]);
  const [messageLimitReached, setMessageLimitReached] = useState(false);
  const [messageLimitMessage, setMessageLimitMessage] = useState<string>("");

  const { authData } = useAuth();
  const user = authData?.user;

  useFocusEffect(
    useCallback(() => {
      if (!chatId) {
        return;
      }

      setMessageLimitReached(false);
      setMessageLimitMessage("");

      socket.connect(chatId);

      const unsubscribeMessage = socket.onMessage((data: string) => {
        const event = JSON.parse(data) as IChatEvent;

        if (
          event.mt === "message_upload_confirm" &&
          String(event.chatId) === String(chatId)
        ) {
          setMessages((prev) => [...prev, event]);

          if (event.isBot) {
            setTypingLoader(false);
          }
        }

        if (
          event.mt === "message_limit_reached" &&
          String(event.chatId) === String(chatId)
        ) {
          setTypingLoader(false);
          setMessageLimitReached(true);
          setMessageLimitMessage(event.message);
        }
      });

      const unsubscribeConnection = socket.onConnectionChange((status) => {
        if (status === "error" || status === "closed") {
          setTypingLoader(false);
        }
      });

      return () => {
        unsubscribeMessage();
        unsubscribeConnection();
        socket.disconnect();
      };
    }, [chatId])
  );

  const send = (msg: string, loveProfileId?:number) => {
    if (!chatId || !user?.id) {
      return;
    }

    const data = {
      message: msg,
      isBot: false,
      chatId: String(chatId),
      userId: String(user.id),
      mt: "user_message_upload",
      loveProfileId: loveProfileId ? String(loveProfileId) : "",
    };
    setTypingLoader(true);
    setMessages((prev) => [...prev, data]);
    socket.sendMessage(JSON.stringify(data));
  };

  return {
    messages,
    send,
    typingLoader,
    setMessages,
    messageLimitReached,
    messageLimitMessage,
  };
}
