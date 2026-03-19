import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { getPostById, updatePost } from "../../api/postsApi";
import type { PostDto } from "../../api/types";
import Button from "../../components/ui/Button";

type ApiError = {
  message?: string;
};

export default function EditPostPage() {
  const nav = useNavigate();
  const { postId } = useParams();
  const id = useMemo(() => Number(postId), [postId]);
  const myUserId = Number(localStorage.getItem("userId") ?? 0);

  const [post, setPost] = useState<PostDto | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const p = await getPostById(id);
        if (cancelled) return;

        if (myUserId <= 0 || p.userId !== myUserId) {
          setError("Nemaš dozvolu da menjaš ovaj post.");
          setPost(null);
          return;
        }

        setPost(p);
        setText(p.content ?? "");
      } catch {
        if (!cancelled) {
          setError("Ne mogu da učitam post.");
          setPost(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, myUserId]);

  async function handleSave() {
    const value = text.trim();

    if (!value) {
      setError("Post text je obavezan.");
      return;
    }

    if (value.length > 2000) {
      setError("Post text je predugačak.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updatePost(id, value);
      nav(`/app/posts/${id}`);
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      setError(error.response?.data?.message ?? "Ne mogu da sačuvam izmene.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-neutral-400">Učitavanje...</div>;
  }

  if (!post) {
    return <div className="text-neutral-400">{error ?? "Post nije pronađen."}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => nav(-1)}>
          ← Nazad
        </Button>
        <div className="text-sm text-neutral-400">Edit Post</div>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
        <div className="mb-4">
          <div className="text-lg font-semibold text-white">Izmeni post</div>
          <div className="mt-1 text-sm text-neutral-400">
            Za sada menjaš tekst posta.
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={2000}
          className="w-full resize-none rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-neutral-700"
          placeholder="Izmeni tekst posta..."
        />

        <div className="mt-2 text-right text-xs text-neutral-500">
          {text.length}/2000
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>

          <Button variant="ghost" onClick={() => nav(-1)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}