import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { getPostById, getPostComments, type PostCommentDto } from "../../api/postsApi";
import type { PostDto } from "../../api/types";

export type PostDetailsProps = {
  post: PostDto;
  onPostPatched?: (patched: PostDto) => void;
};

function imgUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `/uploads/${path}`;
}

export default function PostDetails({ post, onPostPatched }: PostDetailsProps) {
  const nav = useNavigate();
  const postId = useMemo(() => Number(post.postId), [post.postId]);
  const onPatchedRef = useRef<PostDetailsProps["onPostPatched"]>(onPostPatched);
  useEffect(() => {
    onPatchedRef.current = onPostPatched;
  }, [onPostPatched]);

  const [fullPost, setFullPost] = useState<PostDto>(post);
  const [comments, setComments] = useState<PostCommentDto[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  useEffect(() => {
    setFullPost(post);
    setComments([]);
    setCommentsError(null);
    setLoadingPost(true);
    setLoadingComments(true);
  }, [postId, post]);

  useEffect(() => {
    if (!postId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadingPost(true);
        const p = await getPostById(postId);
        if (cancelled) return;

        setFullPost(p);
        onPatchedRef.current?.(p);
      } catch {
        // ostavi bar feed post
        if (!cancelled) setFullPost(post);
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId, post]);

  useEffect(() => {
    if (!postId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadingComments(true);
        setCommentsError(null);

        const list = await getPostComments(postId, 50);
        if (cancelled) return;

        setComments(Array.isArray(list) ? list : []);
      } catch (err) {
        if (cancelled) return;

        const ax = err as AxiosError;
        const status = ax.response?.status;

        if (status === 404) setCommentsError("Komentari još nisu dostupni (API /comments nije dodat).");
        else if (status === 401) setCommentsError("Nisi autorizovan (token).");
        else setCommentsError("Ne mogu da učitam komentare.");

        setComments([]);
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const ownerPic = imgUrl(fullPost.profilePic ?? null);
  const postImg = imgUrl(fullPost.postImg ?? null);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
      {loadingPost ? (
        <div className="text-sm text-neutral-400">Učitavanje posta...</div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={() => nav(`/app/u/${fullPost.username}`)}
              className="flex items-center gap-3 hover:opacity-90"
            >
              <div className="h-10 w-10 rounded-full border border-neutral-800 bg-neutral-900 overflow-hidden">
                {ownerPic ? (
                  <img className="h-full w-full object-cover" src={ownerPic} alt="profile" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-xs text-neutral-500">:)</div>
                )}
              </div>

              <div className="text-left">
                <div className="text-sm font-semibold">@{fullPost.username}</div>
                <div className="text-xs text-neutral-500">{fullPost.createdAt ?? ""}</div>
              </div>
            </button>

            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span>❤️ {fullPost.likeCount ?? 0}</span>
              <span>💬 {fullPost.commentCount ?? 0}</span>
              <button
                onClick={() => nav(`/app/posts/${fullPost.postId}`)}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
              >
                Otvori
              </button>
            </div>
          </div>

          {postImg ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
              <img src={postImg} alt="post" className="w-full max-h-[520px] object-cover" />
            </div>
          ) : null}

          <div className="mt-4 text-sm text-neutral-200 whitespace-pre-wrap">
            {fullPost.content ?? ""}
          </div>
        </>
      )}

      <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="text-sm font-semibold">Komentari</div>

        {commentsError && (
          <div className="mt-3 rounded-xl border border-yellow-900/40 bg-yellow-950/30 p-3 text-sm text-yellow-200">
            {commentsError}
          </div>
        )}

        <div className="mt-3 flex flex-col gap-3">
          {loadingComments ? (
            <div className="text-sm text-neutral-400">Učitavanje...</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-neutral-400">Nema komentara.</div>
          ) : (
            comments.map((c) => (
              <div key={c.commentId} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => nav(`/app/u/${c.username}`)}
                    className="text-sm font-semibold hover:text-blue-300"
                  >
                    @{c.username}
                  </button>
                  <span className="text-xs text-neutral-500">{c.createdAt ?? ""}</span>
                </div>
                <div className="mt-2 text-sm text-neutral-200 whitespace-pre-wrap">{c.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}