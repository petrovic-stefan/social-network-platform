import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { clearAuth } from "../auth/authStorage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotifications, type NotificationPayload } from "../../realtime/useNotifications";
import NotificationToasts, { type Toast } from "../../components/ui/NotificationToasts";
import { notificationsApi, type NotificationDto } from "../../api/notificationsApi";
import { usersApi } from "../../api/usersApi";
import type { SearchUserDto } from "../../api/types";
import { assetUrl } from "../../api/assets";

const MAX_DROPDOWN_ITEMS = 20;

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

function notifKey(n: NotificationDto, idx: number): string {
  if (n.notificationId) return String(n.notificationId);
  return `${idx}-${n.fromUsername ?? ""}-${n.postId ?? ""}-${n.createdAt ?? ""}-${n.text ?? ""}`;
}

function notifText(n: NotificationDto): string {
  return n.text ?? "Nova notifikacija";
}

function notifEmoji(n: NotificationDto): string {
  const t = (n.text ?? "").toLowerCase();
  if (t.includes("like")) return "❤️";
  if (t.includes("comment")) return "💬";
  if (t.includes("follow")) return "➕";
  return "🔔";
}

function notifTypeLabel(n: NotificationDto): string {
  const t = (n.text ?? "").toLowerCase();
  if (t.includes("like")) return "Like";
  if (t.includes("comment")) return "Comment";
  if (t.includes("follow")) return "Follow";
  return "Notification";
}

function notifTypePillClass(n: NotificationDto): string {
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

function makeToast(payload: NotificationPayload): Toast {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const username = (payload.fromUsername ?? "someone").toString();
  const title = `${username}:`;
  const message = (payload.text ?? "Nova notifikacija").toString();
  const time = payload.createdAt
    ? safeFormatDate(payload.createdAt)
    : new Date().toLocaleString("sr-RS");

  const href =
    payload.postId
      ? `/app/posts/${payload.postId}`
      : payload.fromUsername
      ? `/app/u/${payload.fromUsername}`
      : undefined;

  return { id, title, message, time, href };
}

function payloadToItem(p: NotificationPayload): NotificationDto {
  return {
    notificationId: Number(p.notificationId ?? 0),
    fromUserId: p.fromUserId ?? null,
    toUserId: null,
    fromUsername: p.fromUsername ?? null,
    postId: p.postId ?? null,
    text: p.text ?? "Nova notifikacija",
    createdAt: p.createdAt ?? new Date().toISOString(),
    isRead: false,
  };
}

function sameItem(a: NotificationDto, b: NotificationDto): boolean {
  if (a.notificationId && b.notificationId) return a.notificationId === b.notificationId;

  return (
    (a.fromUsername ?? "") === (b.fromUsername ?? "") &&
    (a.postId ?? null) === (b.postId ?? null) &&
    (a.text ?? "") === (b.text ?? "") &&
    (a.createdAt ?? "") === (b.createdAt ?? "")
  );
}

export default function AppLayout() {
  const navigate = useNavigate();

  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifItems, setNotifItems] = useState<NotificationDto[]>([]);
  const notifBoxRef = useRef<HTMLDivElement | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchItems, setSearchItems] = useState<SearchUserDto[]>([]);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const onRealtimeNotification = useCallback((payload: NotificationPayload) => {
    const toast = makeToast(payload);

    setToasts((prev) => [toast, ...prev].slice(0, 5));
    setUnread((x) => x + 1);

    const item = payloadToItem(payload);

    setNotifItems((prev) => {
      if (prev.some((x) => sameItem(x, item))) return prev;
      return [item, ...prev].slice(0, MAX_DROPDOWN_ITEMS);
    });

    const t = window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== toast.id));
      delete timersRef.current[toast.id];
    }, 4500);

    timersRef.current[toast.id] = t;
  }, []);

  const { connected } = useNotifications(onRealtimeNotification);
  const connDot = useMemo(
    () => (connected ? "bg-emerald-500" : "bg-red-500"),
    [connected]
  );

  useEffect(() => {
    (async () => {
      try {
        const count = await notificationsApi.getUnreadCount();
        setUnread(count);
      } catch (err) {
        console.log("getUnreadCount error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (notifOpen) {
        const el = notifBoxRef.current;
        if (el && !el.contains(e.target as Node)) setNotifOpen(false);
      }

      if (searchOpen) {
        const el = searchBoxRef.current;
        if (el && !el.contains(e.target as Node)) setSearchOpen(false);
      }
    }

    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [notifOpen, searchOpen]);

  useEffect(() => {
    const q = searchValue.trim();

    if (!q) {
      setSearchItems([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        const items = await usersApi.search(q, 8);
        if (cancelled) return;
        setSearchItems(items);
        setSearchOpen(true);
      } catch (err) {
        if (!cancelled) {
          console.log("search users error:", err);
          setSearchItems([]);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchValue]);

  async function toggleNotifications() {
    const next = !notifOpen;
    setNotifOpen(next);

    if (next) {
      try {
        const list = await notificationsApi.getLatest(20);

        setNotifItems((prev) => {
          const merged: NotificationDto[] = [];
          for (const x of list) if (!merged.some((m) => sameItem(m, x))) merged.push(x);
          for (const x of prev) if (!merged.some((m) => sameItem(m, x))) merged.push(x);
          return merged.slice(0, MAX_DROPDOWN_ITEMS);
        });
      } catch (err) {
        console.log("getLatest notifications error:", err);
      }
    }
  }

  async function markAllRead() {
    try {
      await notificationsApi.readAll();
      setUnread(0);
      setNotifItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } catch (err) {
      console.log("readAll error:", err);
    }
  }

  async function openNotif(n: NotificationDto) {
    const href = notifHref(n);
    if (!href) return;

    setNotifOpen(false);

    const wasUnread = !n.isRead;
    if (wasUnread) {
      setNotifItems((prev) =>
        prev.map((x) => (sameItem(x, n) ? { ...x, isRead: true } : x))
      );
      setUnread((u) => Math.max(0, u - 1));
    }

    if (n.notificationId) {
      notificationsApi
        .readOne(n.notificationId)
        .catch((err) => console.log("readOne error:", err));
    }

    navigate(href);
  }

  function openUser(username: string) {
    setSearchOpen(false);
    setSearchValue("");
    setSearchItems([]);
    navigate(`/app/u/${username}`);
  }

  function logout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <NotificationToasts
        items={toasts}
        onClose={(id) =>
          setToasts((prev) => prev.filter((x) => x.id !== id))
        }
      />

      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/app")}
            className="font-semibold text-lg text-white hover:text-blue-400 transition-colors"
          >
            SocialNetwork
          </button>

          <NavLink
            to="/app"
            className={({ isActive }) =>
              isActive ? "text-blue-400" : "text-neutral-400 hover:text-white"
            }
          >
            Feed
          </NavLink>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className={`h-2 w-2 rounded-full ${connDot}`} />
            Realtime {connected ? "ON" : "OFF"}
          </div>
          <NavLink
            to="/app/messages"
            className={({ isActive }) =>
              isActive ? "text-blue-400" : "text-neutral-400 hover:text-white"
            }
          >
            Messages
          </NavLink>
          <NavLink
            to="/app/create"
            className={({ isActive }) =>
              isActive ? "text-blue-400" : "text-neutral-400 hover:text-white"
            }
          >
            Create
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-[320px]" ref={searchBoxRef}>
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => {
                if (searchItems.length > 0 || searchValue.trim()) setSearchOpen(true);
              }}
              placeholder="Search users..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-700"
            />

            {searchOpen && (
              <div className="absolute left-0 right-0 z-[9999] mt-2 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
                {searchLoading ? (
                  <div className="p-4 text-sm text-neutral-400">Searching...</div>
                ) : searchItems.length === 0 ? (
                  <div className="p-4 text-sm text-neutral-400">No users found.</div>
                ) : (
                  searchItems.map((u) => {
                    const pic = assetUrl(u.profilePic);
                    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");

                    return (
                      <button
                        key={u.userId}
                        onClick={() => openUser(u.username)}
                        className="w-full border-b border-neutral-900 px-4 py-3 text-left hover:bg-neutral-900/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-800 bg-neutral-900">
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

                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-neutral-100">
                              @{u.username}
                            </div>
                            <div className="truncate text-xs text-neutral-400">
                              {fullName || "User"}
                            </div>
                          </div>

                          {u.isFollowedByMe ? (
                            <span className="rounded-full border border-emerald-900/40 bg-emerald-950/30 px-2 py-1 text-[11px] text-emerald-300">
                              Following
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={notifBoxRef}>
            <button
              onClick={toggleNotifications}
              className="relative rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
              title="Notifications"
            >
              🔔
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[11px] text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 z-[9999] mt-2 w-[430px] overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl">
                <div className="border-b border-neutral-800 bg-neutral-950/95 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Notifications
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        Aktivnosti vezane za tvoj profil i objave
                      </div>
                    </div>

                    <button
                      onClick={markAllRead}
                      className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-800"
                    >
                      Mark all read
                    </button>
                  </div>
                </div>

                <div className="max-h-[420px] overflow-auto">
                  {notifItems.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <div className="text-3xl">🔔</div>
                      <div className="mt-3 text-sm font-medium text-neutral-200">
                        Nema notifikacija
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        Kada neko lajkuje, komentariše ili te zaprati, videćeš to ovde.
                      </div>
                    </div>
                  ) : (
                    notifItems.map((n, idx) => {
                      const href = notifHref(n);
                      const clickable = Boolean(href);

                      return (
                        <button
                          key={notifKey(n, idx)}
                          onClick={() => clickable && openNotif(n)}
                          disabled={!clickable}
                          className={[
                            "w-full border-b border-neutral-900/80 px-4 py-4 text-left transition",
                            clickable ? "hover:bg-neutral-900/50" : "cursor-default opacity-60",
                            n.isRead
                              ? "bg-neutral-950"
                              : "bg-neutral-900/25",
                          ].join(" ")}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-lg">
                              {notifEmoji(n)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={[
                                    "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                    notifTypePillClass(n),
                                  ].join(" ")}
                                >
                                  {notifTypeLabel(n)}
                                </span>

                                {!n.isRead ? (
                                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                                ) : null}
                              </div>

                              <div className="mt-2 text-sm leading-5 text-neutral-100">
                                {n.fromUsername ? (
                                  <span className="font-semibold text-white">
                                    @{n.fromUsername}
                                  </span>
                                ) : null}{" "}
                                <span className="text-neutral-300">
                                  {notifText(n)}
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
                      );
                    })
                  )}
                </div>

                <div className="border-t border-neutral-800 bg-neutral-950/95 px-4 py-3">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate("/app/notifications");
                    }}
                    className="w-full text-center text-xs text-neutral-400 hover:text-white"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/app/settings")}
            className="text-sm text-neutral-300 hover:text-white"
          >
            Settings
          </button>

          <button
            onClick={logout}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}