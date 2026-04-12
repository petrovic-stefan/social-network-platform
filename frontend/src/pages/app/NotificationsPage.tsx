import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi, type NotificationDto } from "../../api/notificationsApi";
import Button from "../../components/ui/Button";

type FilterType = "all" | "like" | "comment" | "follow";

function safeParseDate(value?: string | null): Date | null {
  if (!value) return null;

  let d = new Date(value);
  if (!isNaN(d.getTime())) return d;

  d = new Date(`${value}Z`);
  if (!isNaN(d.getTime())) return d;

  return null;
}

function safeFormatDate(value?: string | null): string {
  const d = safeParseDate(value);
  if (!d) return "";
  return d.toLocaleString("sr-RS");
}

function timeAgo(value?: string | null): string {
  const d = safeParseDate(value);
  if (!d) return "";

  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);

  if (sec < 10) return "upravo sada";
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;

  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function notifType(n: NotificationDto): FilterType {
  const t = (n.text ?? "").toLowerCase();
  if (t.includes("like")) return "like";
  if (t.includes("comment")) return "comment";
  if (t.includes("follow")) return "follow";
  return "all";
}

function notifEmoji(n: NotificationDto): string {
  const t = (n.text ?? "").toLowerCase();
  if (t.includes("like")) return "❤️";
  if (t.includes("comment")) return "💬";
  if (t.includes("follow")) return "➕";
  return "🔔";
}

function notifLabel(n: NotificationDto): string {
  const t = (n.text ?? "").toLowerCase();
  if (t.includes("like")) return "Like";
  if (t.includes("comment")) return "Comment";
  if (t.includes("follow")) return "Follow";
  return "Notification";
}

function notifPillClass(n: NotificationDto): string {
  const t = (n.text ?? "").toLowerCase();

  if (t.includes("like")) {
    return "border-pink-900/40 bg-pink-950/30 text-pink-300";
  }

  if (t.includes("comment")) {
    return "border-sky-900/40 bg-sky-950/30 text-sky-300";
  }

  if (t.includes("follow")) {
    return "border-emerald-900/40 bg-emerald-950/30 text-emerald-300";
  }

  return "border-neutral-800 bg-neutral-900 text-neutral-300";
}

function notifHref(n: NotificationDto): string | undefined {
  if (n.postId) return `/app/posts/${n.postId}`;
  if (n.fromUsername) return `/app/u/${n.fromUsername}`;
  return undefined;
}

export default function NotificationsPage() {
  const nav = useNavigate();

  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyReadAll, setBusyReadAll] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await notificationsApi.getAllForPage();
        if (cancelled) return;

        setItems(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          setError("Ne mogu da učitam notifikacije.");
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

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((x) => notifType(x) === filter);
  }, [items, filter]);

  const unreadCount = useMemo(
    () => items.filter((x) => !x.isRead).length,
    [items]
  );

  async function markAllRead() {
    try {
      setBusyReadAll(true);
      await notificationsApi.readAll();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } catch {
      setError("Ne mogu da označim notifikacije kao pročitane.");
    } finally {
      setBusyReadAll(false);
    }
  }

  async function openNotification(n: NotificationDto) {
    const href = notifHref(n);
    if (!href) return;

    if (!n.isRead && n.notificationId) {
      try {
        await notificationsApi.readOne(n.notificationId);
        setItems((prev) =>
          prev.map((x) =>
            x.notificationId === n.notificationId ? { ...x, isRead: true } : x
          )
        );
      } catch {
        // ne blokiramo navigaciju
      }
    }

    nav(href);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold text-white">Notifications</div>
          <div className="mt-1 text-sm text-neutral-400">
            Pregled aktivnosti vezanih za tvoj profil i objave.
          </div>
        </div>

        <Button onClick={markAllRead} disabled={busyReadAll || unreadCount === 0}>
          {busyReadAll ? "Marking..." : "Mark all read"}
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "All" },
          { key: "like", label: "Likes" },
          { key: "comment", label: "Comments" },
          { key: "follow", label: "Follows" },
        ].map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as FilterType)}
              className={[
                "rounded-full border px-4 py-2 text-sm transition",
                active
                  ? "border-blue-900/40 bg-blue-950/30 text-blue-300"
                  : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}

        <div className="ml-auto text-xs text-neutral-500">
          Unread: <span className="text-neutral-300">{unreadCount}</span>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-xl">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-44 rounded bg-neutral-800" />
                    <div className="h-3 w-64 rounded bg-neutral-800" />
                    <div className="h-3 w-28 rounded bg-neutral-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl">🔔</div>
            <div className="mt-4 text-base font-medium text-neutral-200">
              Nema notifikacija za ovaj filter
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              Kada se pojave nove aktivnosti, videćeš ih ovde.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-neutral-900">
            {filteredItems.map((n, idx) => (
              <button
                key={`${n.notificationId}-${idx}`}
                onClick={() => void openNotification(n)}
                className={[
                  "w-full px-5 py-4 text-left transition hover:bg-neutral-900/40",
                  n.isRead ? "bg-neutral-950" : "bg-neutral-900/20",
                ].join(" ")}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-lg">
                    {notifEmoji(n)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          notifPillClass(n),
                        ].join(" ")}
                      >
                        {notifLabel(n)}
                      </span>

                      {!n.isRead ? (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      ) : null}
                    </div>

                    <div className="mt-2 text-sm leading-6 text-neutral-100">
                      {n.fromUsername ? (
                        <span className="font-semibold text-white">
                          @{n.fromUsername}
                        </span>
                      ) : null}{" "}
                      <span className="text-neutral-300">
                        {n.text ?? "Nova notifikacija"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                      <span>{timeAgo(n.createdAt)}</span>
                      {n.createdAt ? <span>•</span> : null}
                      <span>{safeFormatDate(n.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}