import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addPostComment,
  deletePost,
  getFeed,
  getPostComments,
  likePost,
  unlikePost,
  type PostCommentDto,
} from "../../api/postsApi";
import type { PostDto } from "../../api/types";
import { assetUrl } from "../../api/assets";
import ConfirmModal from "../../components/ui/ConfirmModal";

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sr-RS");
}

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

type FeedCommentState = {
  open: boolean;
  loading: boolean;
  sending: boolean;
  input: string;
  error: string | null;
  items: PostCommentDto[];
  loaded: boolean;
};

function createInitialCommentState(): FeedCommentState {
  return {
    open: false,
    loading: false,
    sending: false,
    input: "",
    error: null,
    items: [],
    loaded: false,
  };
}

export default function FeedPage() {
  const nav = useNavigate();
  const myUserId = Number(localStorage.getItem("userId") ?? 0);
  const [postToDelete, setPostToDelete] = useState<PostDto | null>(null);
  const [items, setItems] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [commentUi, setCommentUi] = useState<Record<number, FeedCommentState>>(
    {}
  );
  const PAGE_SIZE = 10;
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = menuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setMenuPostId(null);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, []);

  function getCommentState(postId: number): FeedCommentState {
    return commentUi[postId] ?? createInitialCommentState();
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const data = await getFeed(PAGE_SIZE);
      const nextItems = Array.isArray(data) ? data : [];

      setItems(nextItems);
      setHasMore(nextItems.length === PAGE_SIZE);
    } catch {
      setError("Ne mogu da učitam feed.");
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }
  async function loadMore() {
    if (loadingMore || loading || !hasMore || items.length === 0) return;

    const last = items[items.length - 1];
    const before = last?.createdAt;

    if (!before) {
      setHasMore(false);
      return;
    }

    try {
      setLoadingMore(true);
      setError(null);

      const data = await getFeed(PAGE_SIZE, before);
      const nextItems = Array.isArray(data) ? data : [];

      if (nextItems.length === 0) {
        setHasMore(false);
        return;
      }

      setItems((prev) => {
        const existingIds = new Set(prev.map((x) => x.postId));
        const uniqueNext = nextItems.filter((x) => !existingIds.has(x.postId));
        return [...prev, ...uniqueNext];
      });

      if (nextItems.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch {
      setError("Ne mogu da učitam još postova.");
    } finally {
      setLoadingMore(false);
    }
  } 

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getFeed(PAGE_SIZE);
        if (cancelled) return;

        const nextItems = Array.isArray(data) ? data : [];
        setItems(nextItems);
        setHasMore(nextItems.length === PAGE_SIZE);
      } catch {
        if (cancelled) return;
        setError("Ne mogu da učitam feed.");
        setItems([]);
        setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function patchPost(postId: number, patch: Partial<PostDto>) {
    setItems((prev) =>
      prev.map((p) => (p.postId === postId ? { ...p, ...patch } : p))
    );
  }

  function requestDeletePost(post: PostDto) {
  if (deletingPostId === post.postId) return;
  setPostToDelete(post);
}

async function confirmDeletePost() {
  if (!postToDelete) return;

  try {
    setDeletingPostId(postToDelete.postId);
    await deletePost(postToDelete.postId);

    setItems((prev) => prev.filter((x) => x.postId !== postToDelete.postId));

    setCommentUi((prev) => {
      const copy = { ...prev };
      delete copy[postToDelete.postId];
      return copy;
    });

    setPostToDelete(null);
  } catch {
    setError("Ne mogu da obrišem post.");
  } finally {
    setDeletingPostId(null);
  }
}

  async function handleToggleLike(post: PostDto) {
    const previousLiked = post.isLikedByMe;
    const previousCount = post.likeCount ?? 0;

    const nextLiked = !previousLiked;
    const nextCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));

    patchPost(post.postId, {
      isLikedByMe: nextLiked,
      likeCount: nextCount,
    });

    try {
      if (nextLiked) {
        await likePost(post.postId);
      } else {
        await unlikePost(post.postId);
      }
    } catch {
      patchPost(post.postId, {
        isLikedByMe: previousLiked,
        likeCount: previousCount,
      });
    }
  }

  async function toggleComments(postId: number) {
    const current = getCommentState(postId);

    if (current.open) {
      setCommentUi((prev) => ({
        ...prev,
        [postId]: {
          ...current,
          open: false,
        },
      }));
      return;
    }

    if (current.loaded) {
      setCommentUi((prev) => ({
        ...prev,
        [postId]: {
          ...current,
          open: true,
          error: null,
        },
      }));
      return;
    }

    setCommentUi((prev) => ({
      ...prev,
      [postId]: {
        ...current,
        open: true,
        loading: true,
        error: null,
      },
    }));

    try {
      const list = await getPostComments(postId, 20);

      setCommentUi((prev) => ({
        ...prev,
        [postId]: {
          ...(prev[postId] ?? createInitialCommentState()),
          open: true,
          loading: false,
          loaded: true,
          error: null,
          items: Array.isArray(list) ? list : [],
        },
      }));
    } catch {
      setCommentUi((prev) => ({
        ...prev,
        [postId]: {
          ...(prev[postId] ?? createInitialCommentState()),
          open: true,
          loading: false,
          loaded: false,
          error: "Ne mogu da učitam komentare.",
          items: [],
        },
      }));
    }
  }

  function setCommentInput(postId: number, value: string) {
    const current = getCommentState(postId);

    setCommentUi((prev) => ({
      ...prev,
      [postId]: {
        ...current,
        input: value,
      },
    }));
  }

  async function handleAddComment(post: PostDto) {
    const current = getCommentState(post.postId);
    const text = current.input.trim();

    if (!text) return;

    setCommentUi((prev) => ({
      ...prev,
      [post.postId]: {
        ...current,
        sending: true,
        error: null,
      },
    }));

    try {
      await addPostComment(post.postId, text);
      const refreshed = await getPostComments(post.postId, 20);

      setCommentUi((prev) => ({
        ...prev,
        [post.postId]: {
          ...(prev[post.postId] ?? createInitialCommentState()),
          open: true,
          loading: false,
          loaded: true,
          sending: false,
          input: "",
          error: null,
          items: Array.isArray(refreshed) ? refreshed : [],
        },
      }));

      patchPost(post.postId, {
        commentCount: (post.commentCount ?? 0) + 1,
      });
    } catch {
      setCommentUi((prev) => ({
        ...prev,
        [post.postId]: {
          ...(prev[post.postId] ?? createInitialCommentState()),
          sending: false,
          error: "Ne mogu da pošaljem komentar.",
        },
      }));
    }
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-2xl px-4 pt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold">Feed</h1>
            <p className="text-sm text-neutral-400">
              Postovi ljudi koje pratiš.
            </p>
          </div>

          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-60"
          >
            {loading ? "Učitavanje..." : "Reload"}
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/30 animate-pulse"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-full bg-neutral-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded bg-neutral-800" />
                    <div className="h-3 w-24 rounded bg-neutral-800" />
                  </div>
                </div>
                <div className="h-[360px] bg-neutral-800" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-56 rounded bg-neutral-800" />
                  <div className="h-3 w-40 rounded bg-neutral-800" />
                </div>
              </div>
            ))}
            <div className="mt-6 flex justify-center">
              {hasMore ? (
                <button
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              ) : (
                <div className="text-sm text-neutral-500">Nema više postova.</div>
              )}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-400">
            Nema postova za prikaz.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((p) => {
              const profileSrc = assetUrl(p.profilePic);
              const postImgSrc = assetUrl(p.postImg);
              const commentsState = getCommentState(p.postId);
              const isMine = myUserId > 0 && p.userId === myUserId;
              const deleteBusy = deletingPostId === p.postId;

              return (
                <article
                  key={p.postId}
                  className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-lg"
                >
                  <div className="flex items-center justify-between p-4">
                    <button
                      onClick={() => nav(`/app/u/${p.username}`)}
                      className="flex items-center gap-3 hover:opacity-90"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-neutral-800 bg-neutral-900">
                        {profileSrc ? (
                          <img
                            src={profileSrc ?? undefined}
                            alt="profile"
                            className="h-full w-full object-cover"
                            onError={hideOnError}
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs text-neutral-500">
                            :)
                          </div>
                        )}
                      </div>

                      <div className="text-left">
                        <div className="text-sm font-semibold">@{p.username}</div>
                        <div className="text-xs text-neutral-500">
                          {formatDate(p.createdAt)}
                        </div>
                      </div>
                    </button>

                    <div
                      className="relative"
                      ref={menuPostId === p.postId ? menuRef : null}
                    >
                      <button
                        onClick={() =>
                          setMenuPostId((prev) =>
                            prev === p.postId ? null : p.postId
                          )
                        }
                        className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800"
                      >
                        ⋯
                      </button>

                      {menuPostId === p.postId ? (
                        <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
                          <button
                            onClick={() => {
                              setMenuPostId(null);
                              nav(`/app/posts/${p.postId}`);
                            }}
                            className="block w-full border-b border-neutral-900 px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-900/40"
                          >
                            Open
                          </button>

                          {isMine ? (
                            <>
                              <button
                                onClick={() => {
                                  setMenuPostId(null);
                                  nav(`/app/posts/${p.postId}/edit`);
                                }}
                                className="block w-full border-b border-neutral-900 px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-900/40"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => {
                                  setMenuPostId(null);
                                  requestDeletePost(p);
                                }}
                                disabled={deleteBusy}
                                className="block w-full px-4 py-3 text-left text-sm text-red-300 hover:bg-red-950/20 disabled:opacity-60"
                              >
                                {deleteBusy ? "Deleting..." : "Delete"}
                              </button>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {postImgSrc ? (
                    <button
                      onClick={() => nav(`/app/posts/${p.postId}`)}
                      className="w-full bg-black"
                    >
                      <img
                        src={postImgSrc ?? undefined}
                        alt="post"
                        className="max-h-[680px] w-full object-cover"
                        onError={hideOnError}
                      />
                    </button>
                  ) : null}

                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => void handleToggleLike(p)}
                        className={[
                          "rounded-xl border px-3 py-2 text-sm transition",
                          p.isLikedByMe
                            ? "border-pink-700 bg-pink-950/40 text-pink-300"
                            : "border-neutral-800 bg-neutral-900 text-neutral-200 hover:bg-neutral-800",
                        ].join(" ")}
                      >
                        {p.isLikedByMe ? "💔 Unlike" : "❤️ Like"}
                      </button>

                      <button
                        onClick={() => void toggleComments(p.postId)}
                        className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
                      >
                        💬 {commentsState.open ? "Hide" : "Comment"}
                      </button>
                    </div>

                    <div className="mt-3 text-sm text-neutral-300">
                      <span className="font-semibold">{p.likeCount ?? 0}</span>{" "}
                      likes ·{" "}
                      <span className="font-semibold">{p.commentCount ?? 0}</span>{" "}
                      comments
                    </div>

                    {p.content ? (
                      <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-200">
                        <span className="font-semibold">@{p.username}</span>{" "}
                        <span>{p.content}</span>
                      </div>
                    ) : null}

                    {commentsState.open ? (
                      <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4">
                        <div className="mb-3 text-sm font-semibold text-neutral-200">
                          Komentari
                        </div>

                        {commentsState.error ? (
                          <div className="mb-3 rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
                            {commentsState.error}
                          </div>
                        ) : null}

                        {commentsState.loading ? (
                          <div className="text-sm text-neutral-400">
                            Učitavanje komentara...
                          </div>
                        ) : commentsState.items.length === 0 ? (
                          <div className="text-sm text-neutral-400">
                            Nema komentara.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {commentsState.items.map((c) => (
                              <div
                                key={c.commentId}
                                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/70 p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => nav(`/app/u/${c.username}`)}
                                    className="text-sm font-semibold hover:text-blue-300"
                                  >
                                    @{c.username}
                                  </button>

                                  <div className="text-sm text-neutral-200">
                                    {c.text}
                                  </div>
                                </div>

                                <span className="whitespace-nowrap text-xs text-neutral-500">
                                  {formatDate(c.createdAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-2">
                          <input
                            value={commentsState.input}
                            onChange={(e) =>
                              setCommentInput(p.postId, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void handleAddComment(p);
                              }
                            }}
                            placeholder="Napiši komentar..."
                            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-700"
                          />
                          <button
                            onClick={() => void handleAddComment(p)}
                            disabled={commentsState.sending}
                            className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-60"
                          >
                            {commentsState.sending ? "Slanje..." : "Pošalji"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmModal
      open={postToDelete !== null}
      title="Delete post"
      message="Da li si siguran da želiš da obrišeš ovaj post?"
      confirmText="Delete"
      cancelText="Cancel"
      danger
      loading={postToDelete !== null && deletingPostId === postToDelete.postId}
      onCancel={() => setPostToDelete(null)}
      onConfirm={() => void confirmDeletePost()}
    />
    </div>
  );
}