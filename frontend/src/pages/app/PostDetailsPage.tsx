import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteComment,
  deletePost,
  getPostById,
  getPostComments,
  type PostCommentDto,
} from "../../api/postsApi";
import type { PostDto } from "../../api/types";
import { assetUrl } from "../../api/assets";
import ConfirmModal from "../../components/ui/ConfirmModal";

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sr-RS");
}

export default function PostDetailsPage() {
  const nav = useNavigate();
  const { postId } = useParams();

  const id = useMemo(() => Number(postId), [postId]);
  const myUserId = Number(localStorage.getItem("userId") ?? 0);

  const [post, setPost] = useState<PostDto | null>(null);
  const [comments, setComments] = useState<PostCommentDto[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [commentMenuId, setCommentMenuId] = useState<number | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const commentMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;

      const postMenuEl = menuRef.current;
      const commentMenuEl = commentMenuRef.current;

      if (postMenuEl && !postMenuEl.contains(target)) {
        setMenuOpen(false);
      }

      if (commentMenuEl && !commentMenuEl.contains(target)) {
        setCommentMenuId(null);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, []);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadingPost(true);
        const p = await getPostById(id);
        if (cancelled) return;
        setPost(p);
      } catch {
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadingComments(true);
        setCommentsError(null);

        const list = await getPostComments(id, 50);

        if (cancelled) return;
        setComments(Array.isArray(list) ? list : []);
      } catch (err: unknown) {
        if (cancelled) return;

        const status =
          (err as { response?: { status?: number } })?.response?.status;

        if (status === 404) {
          setCommentsError("Komentari još nisu dostupni.");
        } else if (status === 401) {
          setCommentsError("Nisi autorizovan.");
        } else {
          setCommentsError("Ne mogu da učitam komentare.");
        }

        setComments([]);
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function requestDelete() {
    if (!post || deleteBusy) return;
    setDeleteModalOpen(true);
  }

  async function handleDelete() {
    if (!post || deleteBusy) return;

    try {
      setDeleteBusy(true);
      setDeleteError(null);

      await deletePost(post.postId);
      setDeleteModalOpen(false);
      nav("/app");
    } catch {
      setDeleteError("Ne mogu da obrišem post.");
    } finally {
      setDeleteBusy(false);
    }
  }

  function requestDeleteComment(commentId: number) {
    if (deletingCommentId === commentId) return;
    setCommentToDelete(commentId);
  }

  async function handleDeleteComment() {
    if (!post || commentToDelete === null) return;

    try {
      setDeletingCommentId(commentToDelete);

      await deleteComment(commentToDelete);

      setComments((prev) => prev.filter((x) => x.commentId !== commentToDelete));

      setPost((prev) =>
        prev
          ? {
              ...prev,
              commentCount: Math.max(0, (prev.commentCount ?? 0) - 1),
            }
          : prev
      );

      setCommentToDelete(null);
    } catch {
      setCommentsError("Ne mogu da obrišem komentar.");
    } finally {
      setDeletingCommentId(null);
    }
  }

  const ownerPic = assetUrl(post?.profilePic) ?? null;
  const postImg = assetUrl(post?.postImg) ?? null;
  const isMine = post !== null && myUserId > 0 && post.userId === myUserId;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => nav(-1)}
          className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          ← Nazad
        </button>

        <div className="text-sm text-neutral-400">
          Post #{Number.isFinite(id) ? id : "?"}
        </div>
      </div>

      {deleteError ? (
        <div className="mt-4 rounded-2xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
          {deleteError}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
        {loadingPost ? (
          <div className="text-sm text-neutral-400">Učitavanje posta...</div>
        ) : !post ? (
          <div className="text-sm text-neutral-400">Post nije pronađen.</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={() => nav(`/app/u/${post.username}`)}
                className="flex items-center gap-3 hover:opacity-90"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full border border-neutral-800 bg-neutral-900">
                  {ownerPic ? (
                    <img
                      className="h-full w-full object-cover"
                      src={ownerPic ?? undefined}
                      alt="profile"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-neutral-500">
                      :)
                    </div>
                  )}
                </div>

                <div className="text-left">
                  <div className="text-sm font-semibold">@{post.username}</div>
                  <div className="text-xs text-neutral-500">
                    {formatDate(post.createdAt)}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-3">
                {isMine ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen((prev) => !prev)}
                      className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
                    >
                      ⋯
                    </button>

                    {menuOpen ? (
                      <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            nav(`/app/posts/${post.postId}/edit`);
                          }}
                          className="block w-full border-b border-neutral-900 px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-900/40"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            requestDelete();
                          }}
                          disabled={deleteBusy}
                          className="block w-full px-4 py-3 text-left text-sm text-red-300 hover:bg-red-950/20 disabled:opacity-60"
                        >
                          {deleteBusy ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <span>
                    ❤️ <b className="text-neutral-200">{post.likeCount ?? 0}</b>
                  </span>
                  <span>
                    💬 <b className="text-neutral-200">{post.commentCount ?? 0}</b>
                  </span>
                </div>
              </div>
            </div>

            {postImg ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
                <img
                  src={assetUrl(post.postImg) ?? undefined}
                  alt="post"
                  className="max-h-[520px] w-full object-cover"
                />
              </div>
            ) : null}

            <div className="mt-4 whitespace-pre-wrap text-sm text-neutral-200">
              {post.content ?? ""}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
        <div className="text-sm font-semibold">Komentari</div>

        {commentsError ? (
          <div className="mt-3 rounded-xl border border-yellow-900/40 bg-yellow-950/30 p-3 text-sm text-yellow-200">
            {commentsError}
          </div>
        ) : null}

        <div className="mt-3 flex flex-col gap-3">
          {loadingComments ? (
            <div className="text-sm text-neutral-400">Učitavanje...</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-neutral-400">Nema komentara.</div>
          ) : (
            comments.map((c) => {
              const canDeleteComment =
                myUserId > 0 &&
                post &&
                (c.userId === myUserId || post.userId === myUserId);

              const commentDeleteBusy = deletingCommentId === c.commentId;

              return (
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

                    <div className="text-sm text-neutral-200">{c.text}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap text-xs text-neutral-500">
                      {formatDate(c.createdAt)}
                    </span>

                    {canDeleteComment ? (
                      <div
                        className="relative"
                        ref={commentMenuId === c.commentId ? commentMenuRef : null}
                      >
                        <button
                          onClick={() =>
                            setCommentMenuId((prev) =>
                              prev === c.commentId ? null : c.commentId
                            )
                          }
                          className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
                        >
                          ⋯
                        </button>

                        {commentMenuId === c.commentId ? (
                          <div className="absolute right-0 z-20 mt-2 w-32 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-xl">
                            <button
                              onClick={() => {
                                setCommentMenuId(null);
                                requestDeleteComment(c.commentId);
                              }}
                              disabled={commentDeleteBusy}
                              className="block w-full px-4 py-3 text-left text-sm text-red-300 hover:bg-red-950/20 disabled:opacity-60"
                            >
                              {commentDeleteBusy ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete post"
        message="Da li si siguran da želiš da obrišeš ovaj post? Ova akcija se ne može lako vratiti."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={deleteBusy}
        onCancel={() => {
          if (deleteBusy) return;
          setDeleteModalOpen(false);
        }}
        onConfirm={() => void handleDelete()}
      />

      <ConfirmModal
        open={commentToDelete !== null}
        title="Delete comment"
        message="Da li si siguran da želiš da obrišeš ovaj komentar?"
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={commentToDelete !== null && deletingCommentId === commentToDelete}
        onCancel={() => {
          if (deletingCommentId !== null) return;
          setCommentToDelete(null);
        }}
        onConfirm={() => void handleDeleteComment()}
      />
    </div>
  );
}