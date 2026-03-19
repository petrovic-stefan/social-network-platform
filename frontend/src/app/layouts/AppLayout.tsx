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

  if (sec < 10) return "just now";
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
  const time = payload.createdAt ? safeFormatDate(payload.createdAt) : new Date().toLocaleString("sr-RS");

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
  const connDot = useMemo(() => (connected ? "bg-emerald-500" : "bg-red-500"), [connected]);

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
      setNotifItems((prev) => prev.map((x) => (sameItem(x, n) ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }

    if (n.notificationId) {
      notificationsApi.readOne(n.notificationId).catch((err) => console.log("readOne error:", err));
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
      <NotificationToasts items={toasts} onClose={(id) => setToasts((prev) => prev.filter((x) => x.id !== id))} />

      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/app")}
            className="font-semibold text-lg text-white hover:text-blue-400 transition-colors"
          >
            SocialNetwork
          </button>
          <NavLink
            to="/app"
            className={({ isActive }) => (isActive ? "text-blue-400" : "text-neutral-400 hover:text-white")}
          >
            Feed
          </NavLink>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className={`h-2 w-2 rounded-full ${connDot}`} />
            Realtime {connected ? "ON" : "OFF"}
          </div>
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
              <div className="absolute right-0 left-0 mt-2 rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl overflow-hidden z-[9999]">
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
                        className="w-full px-4 py-3 text-left border-b border-neutral-900 hover:bg-neutral-900/40 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0">
                            {pic ? (
                              <img
                                src={pic ?? undefined}
                                alt="profile"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full grid place-items-center text-xs text-neutral-500">
                                :)
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-neutral-100">
                              @{u.username}
                            </div>
                            <div className="text-xs text-neutral-400 truncate">
                              {fullName || "User"}
                            </div>
                          </div>

                          {u.isFollowedByMe ? (
                            <span className="text-[11px] rounded-full border border-emerald-900/40 bg-emerald-950/30 px-2 py-1 text-emerald-300">
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
                <span className="absolute -top-1 -right-1 min-w-[18px] rounded-full bg-red-600 px-1 text-[11px] text-white text-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[420px] rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl overflow-hidden z-[9999]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="text-sm font-semibold">Notifications</div>
                  <button
                    onClick={markAllRead}
                    className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-800"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-[360px] overflow-auto">
                  {notifItems.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-400">Nema notifikacija.</div>
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
                            "w-full text-left px-4 py-3 border-b border-neutral-900 transition",
                            "hover:bg-neutral-900/40",
                            n.isRead ? "opacity-70" : "bg-neutral-900/20",
                            !clickable ? "cursor-default opacity-60" : "",
                          ].join(" ")}
                        >
                          <div className="text-sm text-neutral-100 flex items-center gap-2">
                            <span>{notifEmoji(n)}</span>
                            {!n.isRead ? <span className="h-2 w-2 rounded-full bg-blue-500" /> : null}

                            <span className="min-w-0">
                              {n.fromUsername ? <span className="font-semibold">@{n.fromUsername} </span> : null}
                              <span className="text-neutral-200">{notifText(n)}</span>
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-neutral-500 flex items-center gap-2">
                            <span>{timeAgo(n.createdAt)}</span>
                            {n.createdAt ? <span>·</span> : null}
                            <span>{safeFormatDate(n.createdAt)}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
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

          <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">
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