import config from "../config/config";
import { retrieveData, StorageKeys } from "../storage";

class SocketService {
  private static instance: SocketService;
  private socket: WebSocket | null = null;
  private listeners: ((msg: string) => void)[] = [];
  private connectionListeners: ((status: "open" | "closed" | "error") => void)[] = [];
  private reconnectInterval = 2000;
  private url = config.socketUrl || "";
  private shouldReconnect = true;
  private currentChatId?: number;
  private messageQueue: string[] = [];
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isSwitchingChat = false;

  private constructor() {}

  static getInstance() {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async connect(chatId?: number) {
    const previousChatId = this.currentChatId;
    if (chatId) {
      this.currentChatId = chatId;
    }

    if (!this.currentChatId) {
      console.log("Chat ID not found");
      return;
    }

    if (
      this.socket &&
      previousChatId &&
      this.currentChatId &&
      String(previousChatId) !== String(this.currentChatId) &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      this.isSwitchingChat = true;

      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }

      try {
        this.socket.close();
      } catch (e) {
        // ignore
      }

      this.socket = null;
    }

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.shouldReconnect = true;

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    const token = await this.getAuthToken();
    const wsUrl = token
      ? `${this.url}/chat/ws/connection/${this.currentChatId}?token=${encodeURIComponent(token)}`
      : `${this.url}/chat/ws/connection/${this.currentChatId}`;
    // const wsUrl = `${this.url}/chat/ws/connection/${this.currentChatId}`;

    this.socket = new WebSocket(wsUrl);


    this.socket.onopen = () => {
      console.log("WS Connected to", this.url);
      this.connectionListeners.forEach((cb) => cb("open"));

      this.isSwitchingChat = false;

      if (this.messageQueue.length) {
        const pending = [...this.messageQueue];
        this.messageQueue = [];
        pending.forEach((msg) => {
          try {
            this.socket?.send(msg);
          } catch (e) {
            this.messageQueue.push(msg);
          }
        });
      }
    };

    this.socket.onmessage = (event) => {
      this.listeners.forEach((cb) => cb(event.data));
    };

    this.socket.onerror = (err) => {
      console.log("WS Error", err);
      this.connectionListeners.forEach((cb) => cb("error"));
    };

    this.socket.onclose = (event) => {
      console.log(
        "WS Disconnected",
        "code:", event.code,
        "reason:", event.reason
      );

      this.connectionListeners.forEach((cb) => cb("closed"));

      if (this.isSwitchingChat) {
        return;
      }

      if (this.shouldReconnect) {
        console.log("WS Reconnecting in", this.reconnectInterval, "ms");
        if (this.reconnectTimeoutId) {
          clearTimeout(this.reconnectTimeoutId);
        }
        this.reconnectTimeoutId = setTimeout(
          () => { this.connect(this.currentChatId); },
          this.reconnectInterval
        );
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.socket) {
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close();
      }
    }

    this.socket = null;
    this.messageQueue = [];
  }

  sendMessage(message: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log("Sending message", message.length);
      this.socket.send(message);
    } else {
      this.messageQueue.push(message);
      this.connect(this.currentChatId);
    }
  }

  onMessage(callback: (data: string) => void) {
    this.listeners.push(callback);

    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  onConnectionChange(callback: (status: "open" | "closed" | "error") => void) {
    this.connectionListeners.push(callback);

    return () => {
      this.connectionListeners = this.connectionListeners.filter((cb) => cb !== callback);
    };
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const storedAuthData = await retrieveData(StorageKeys.authData);
      if (storedAuthData) {
        const parsed = JSON.parse(storedAuthData);
        return parsed.token || null;
      }
    } catch (error) {
      console.log("Failed to retrieve auth token for socket:", error);
    }
    return null;
  }
}

export default SocketService.getInstance();
