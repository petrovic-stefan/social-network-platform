import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assetUrl } from "../../api/assets";
import { chatApi, type InboxItemDto } from "../../api/chatApi";
import { useChat } from "../../realtime/useChat";

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sr-RS");
}

function timeAgo(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

export default function InboxPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<InboxItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlinePeerIds, setOnlinePeerIds] = useState<number[]>([]);

  useChat({
    onMessage: () => {
      void reloadInbox();
    },
    onRead: () => {
      void reloadInbox();
    },
    onOnlinePeers: (payload) => {
      setOnlinePeerIds(payload.peers ?? []);
    },
    onPresence: (payload) => {
      setOnlinePeerIds((prev) => {
        const has = prev.includes(payload.userId);
        if (payload.isOnline && !has) return [...prev, payload.userId];
        if (!payload.isOnline && has) return prev.filter((x) => x !== payload.userId);
        return prev;
      });
    },
  });

  async function reloadInbox() {
    try {
      const data = await chatApi.getInbox();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Inbox reload error:", err);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await chatApi.getInbox();
        if (cancelled) return;

        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Inbox load error:", err);
        if (!cancelled) {
          setError("Ne mogu da učitam inbox.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const ad = a.lastSentAt ? new Date(a.lastSentAt).getTime() : 0;
      const bd = b.lastSentAt ? new Date(b.lastSentAt).getTime() : 0;
      return bd - ad;
    });
  }, [items]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <div className="text-2xl font-semibold text-white">Messages</div>
        <div className="mt-1 text-sm text-neutral-400">
          Tvoji razgovori i privatne poruke.
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-xl">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-neutral-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded bg-neutral-800" />
                    <div className="h-3 w-56 rounded bg-neutral-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl">💬</div>
            <div className="mt-4 text-base font-medium text-neutral-200">
              Nema razgovora
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              Otvori nečiji profil i klikni na Message da započneš razgovor.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-neutral-900">
            {sortedItems.map((item) => {
              const pic = assetUrl(item.peerProfilePic);
              const isOnline = onlinePeerIds.includes(item.peerUserId);

              return (
                <button
                  key={item.conversationId}
                  onClick={() =>
                    nav(`/app/messages/${item.conversationId}`, {
                      state: {
                        peerUserId: item.peerUserId,
                        peerUsername: item.peerUsername,
                        peerProfilePic: item.peerProfilePic,
                      },
                    })
                  }
                  className="w-full px-5 py-4 text-left transition hover:bg-neutral-900/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0">
                      <div className="h-12 w-12 overflow-hidden rounded-full border border-neutral-800 bg-neutral-900">
                        {pic ? (
                          <img
                            src={pic ?? undefined}
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
                          isOnline ? "bg-emerald-500" : "bg-neutral-700",
                        ].join(" ")}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-sm font-semibold text-white">
                          @{item.peerUsername}
                        </div>
                        <div className="shrink-0 text-xs text-neutral-500">
                          {timeAgo(item.lastSentAt)}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className="truncate text-sm text-neutral-400">
                          {item.lastMessageText || "No messages yet"}
                        </div>

                        {item.unreadCount > 0 ? (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] text-white">
                            {item.unreadCount > 99 ? "99+" : item.unreadCount}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 text-xs text-neutral-600">
                        {formatDate(item.lastSentAt)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}