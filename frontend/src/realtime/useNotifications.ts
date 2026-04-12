import { useEffect, useRef, useState } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { createNotificationsConnection } from "./notificationsConnection";

export type NotificationPayload = {
  type?: string;
  fromUserId?: number;
  postId?: number;
  fromUsername?: string;
  text?: string;
  createdAt?: string;
  [k: string]: unknown;
};

export function useNotifications(onNotification?: (p: NotificationPayload) => void) {
  const connRef = useRef<HubConnection | null>(null);
  const onNotifRef = useRef<typeof onNotification>(onNotification);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onNotifRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    let disposed = false;
    if (connRef.current) return;

    const conn = createNotificationsConnection();
    connRef.current = conn;

    conn.on("notification", (payload: NotificationPayload) => {
      console.log("[SignalR notification]", payload);
      onNotifRef.current?.(payload);
    });

    conn.onreconnecting((err) => {
      console.log("[SignalR] reconnecting...", err?.message);
      setConnected(false);
    });

    conn.onreconnected(() => {
      console.log("[SignalR] reconnected");
      setConnected(true);
    });

    conn.onclose((err) => {
      console.log("[SignalR] closed", err?.message);
      setConnected(false);
    });

    (async () => {
      try {
        await conn.start();
        if (disposed) return;
        console.log("[SignalR] connected");
        setConnected(true);
      } catch (e) {
        if (disposed) return;
        console.log("[SignalR] start failed", e);
        setConnected(false);
      }
    })();

    return () => {
      disposed = true;
      conn.off("notification");
      conn.stop().catch(() => {});
      connRef.current = null;
    };
  }, []);

  return { connected };
}