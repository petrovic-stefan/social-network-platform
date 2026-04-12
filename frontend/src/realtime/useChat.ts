import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

const HUB_URL = "https://localhost:7248/hubs/chat";
const TOKEN_KEY = "sn_access_token";

export type ChatMessageEvent = {
  messageId: number;
  conversationId: number;
  fromUserId: number;
  toUserId: number | null;
  text: string;
  sentAt: string;
};

export type ChatReadEvent = {
  conversationId: number;
  readByUserId: number;
  readAt: string;
};

export type ChatDeliveredEvent = {
  conversationId: number;
  deliveredByUserId: number;
  at: string;
  markedCount: number;
};

export type ChatPresenceEvent = {
  userId: number;
  isOnline: boolean;
  lastSeen?: string | null;
};

export type ChatTypingEvent = {
  conversationId: number;
  fromUserId: number;
  isTyping: boolean;
  at: string;
};

type OnlinePeersEvent = {
  userId: number;
  peers: number[];
};

type UseChatOptions = {
  onMessage?: (payload: ChatMessageEvent) => void;
  onRead?: (payload: ChatReadEvent) => void;
  onDelivered?: (payload: ChatDeliveredEvent) => void;
  onPresence?: (payload: ChatPresenceEvent) => void;
  onTyping?: (payload: ChatTypingEvent) => void;
  onOnlinePeers?: (payload: OnlinePeersEvent) => void;
};

export function useChat(options: UseChatOptions = {}) {
  const [connected, setConnected] = useState(false);
  const connRef = useRef<signalR.HubConnection | null>(null);

  const handlersRef = useRef<UseChatOptions>({});

  useEffect(() => {
    handlersRef.current = options;
  }, [options]);

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem(TOKEN_KEY) ?? "",
      })
      .withAutomaticReconnect([0, 1000, 2000, 5000])
      .build();

    conn.onreconnecting(() => setConnected(false));
    conn.onreconnected(() => setConnected(true));
    conn.onclose(() => setConnected(false));

    conn.on("chat:message", (payload: ChatMessageEvent) => {
      handlersRef.current.onMessage?.(payload);
    });

    conn.on("chat:read", (payload: ChatReadEvent) => {
      handlersRef.current.onRead?.(payload);
    });

    conn.on("chat:delivered", (payload: ChatDeliveredEvent) => {
      handlersRef.current.onDelivered?.(payload);
    });

    conn.on("chat:presence", (payload: ChatPresenceEvent) => {
      handlersRef.current.onPresence?.(payload);
    });

    conn.on("chat:typing", (payload: ChatTypingEvent) => {
      handlersRef.current.onTyping?.(payload);
    });

    conn.on("chat:onlinePeers", (payload: OnlinePeersEvent) => {
      handlersRef.current.onOnlinePeers?.(payload);
    });

    conn
      .start()
      .then(() => {
        connRef.current = conn;
        setConnected(true);
      })
      .catch((err) => {
        console.error("Chat hub start error:", err);
        setConnected(false);
      });

    return () => {
      conn.stop().catch(() => {});
      connRef.current = null;
      setConnected(false);
    };
  }, []);

  async function sendTyping(
    conversationId: number,
    peerUserId: number,
    isTyping: boolean
  ) {
    const conn = connRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;

    try {
      await conn.invoke("Typing", conversationId, peerUserId, isTyping);
    } catch (err) {
      console.error("Typing invoke error:", err);
    }
  }

  return {
    connected,
    sendTyping,
  };
}