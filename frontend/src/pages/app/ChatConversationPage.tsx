import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { assetUrl } from "../../api/assets";
import { chatApi, type MessageDto } from "../../api/chatApi";
import {
  useChat,
  type ChatMessageEvent,
  type ChatTypingEvent,
} from "../../realtime/useChat";

type LocationState = {
  peerUserId?: number;
  peerUsername?: string;
  peerProfilePic?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sr-RS");
}

function mapRealtimeMessage(payload: ChatMessageEvent): MessageDto {
  return {
    messages_Id: payload.messageId,
    conversation_Id: payload.conversationId,
    from_Users_Id: payload.fromUserId,
    to_Users_Id: payload.toUserId,
    message_Text: payload.text,
    sent_At: payload.sentAt,
  };
}

export default function ChatConversationPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams();

  const state = (location.state ?? {}) as LocationState;
  const id = useMemo(() => Number(conversationId), [conversationId]);
  const myUserId = Number(localStorage.getItem("userId") ?? 0);

  const peerUserId = state.peerUserId ?? 0;
  const peerUsername = state.peerUsername ?? "user";
  const peerProfilePic = state.peerProfilePic ?? null;

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const { sendTyping } = useChat({
    onMessage: (payload) => {
      if (payload.conversationId !== id) return;

      setMessages((prev) => {
        if (prev.some((x) => x.messages_Id === payload.messageId)) return prev;
        return [...prev, mapRealtimeMessage(payload)];
      });

      if (payload.fromUserId !== myUserId) {
        void chatApi.markRead(id);
        void chatApi.markDelivered(id);
      }
    },

    onTyping: (payload: ChatTypingEvent) => {
      if (payload.conversationId !== id) return;
      if (payload.fromUserId === myUserId) return;

      setPeerTyping(payload.isTyping);

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      if (payload.isTyping) {
        typingTimeoutRef.current = window.setTimeout(() => {
          setPeerTyping(false);
        }, 1800);
      }
    },

    onPresence: (payload) => {
      if (!peerUserId) return;
      if (payload.userId !== peerUserId) return;
      setPeerOnline(payload.isOnline);
    },

    onOnlinePeers: (payload) => {
      if (!peerUserId) return;
      setPeerOnline((payload.peers ?? []).includes(peerUserId));
    },
  });

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await chatApi.getMessages(id, 50);
        if (cancelled) return;

        const arr = Array.isArray(data) ? [...data].reverse() : [];
        setMessages(arr);

        await chatApi.markRead(id);
        await chatApi.markDelivered(id);
      } catch (err) {
        console.error("Chat messages load error:", err);
        if (!cancelled) {
          setError("Ne mogu da učitam poruke.");
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, peerTyping, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  function handleTypingChange(value: string) {
    setText(value);

    if (peerUserId > 0 && id > 0) {
      void sendTyping(id, peerUserId, value.trim().length > 0);
    }
  }

  async function sendMessage() {
    const value = text.trim();
    if (!value || sending || !Number.isFinite(id) || id <= 0) return;

    try {
      setSending(true);
      setError(null);

      await chatApi.sendMessage(id, value);

      const fresh = await chatApi.getMessages(id, 50);
      setMessages(Array.isArray(fresh) ? [...fresh].reverse() : []);
      setText("");

      if (peerUserId > 0) {
        void sendTyping(id, peerUserId, false);
      }
      } 
      catch (err: unknown) {
    console.error("Send message error:", err);

    const apiError = err as {
      response?: {
        data?: {
          error?: string;
          message?: string;
        };
      };
    };

    setError(
      apiError.response?.data?.error ??
        apiError.response?.data?.message ??
        "Ne mogu da pošaljem poruku."
    );
  } finally {
    setSending(false);
  }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => nav("/app/messages")}
          className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          ← Inbox
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11">
              <div className="h-11 w-11 overflow-hidden rounded-full border border-neutral-800 bg-neutral-900">
                {peerProfilePic ? (
                  <img
                    src={assetUrl(peerProfilePic) ?? undefined}
                    alt="profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-neutral-500">
                    :)
                  </div>
                )}
              </div>

              <span
                className={[
                  "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-neutral-950",
                  peerOnline ? "bg-emerald-500" : "bg-neutral-700",
                ].join(" ")}
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-white">
                @{peerUsername}
              </div>
              <div className="text-xs text-neutral-500">
                {peerTyping ? "typing..." : peerOnline ? "online" : "offline"}
              </div>
            </div>
          </div>

          <button
            onClick={() => nav(`/app/u/${peerUsername}`)}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
          >
            View profile
          </button>
        </div>

        <div className="h-[520px] overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="text-sm text-neutral-400">Učitavanje poruka...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="text-4xl">💬</div>
                <div className="mt-3 text-sm font-medium text-neutral-200">
                  Nema poruka
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Pošalji prvu poruku da započneš razgovor.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const mine = m.from_Users_Id === myUserId;

                return (
                  <div
                    key={m.messages_Id}
                    className={["flex", mine ? "justify-end" : "justify-start"].join(" ")}
                  >
                    <div
                      className={[
                        "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow",
                        mine
                          ? "bg-blue-600 text-white"
                          : "border border-neutral-800 bg-neutral-900 text-neutral-100",
                      ].join(" ")}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {m.message_Text}
                      </div>
                      <div
                        className={[
                          "mt-2 text-[11px]",
                          mine ? "text-blue-100/80" : "text-neutral-500",
                        ].join(" ")}
                      >
                        {formatDate(m.sent_At)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {peerTyping ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-300">
                    typing...
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-neutral-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <input
              value={text}
              onChange={(e) => handleTypingChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Napiši poruku..."
              className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-neutral-700"
            />

            <button
              onClick={() => void sendMessage()}
              disabled={sending || !text.trim()}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}