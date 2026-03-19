import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../../api/usersApi";
import Button from "../../components/ui/Button";

export default function CreatePostPage() {
  const nav = useNavigate();

  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;

    if (f.size > 5 * 1024 * 1024) {
      setError("Max 5MB.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) {
      setError("Only JPG, PNG, WEBP.");
      return;
    }

    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function removeImage() {
    setFile(null);
    setPreview(null);
  }

  async function submit() {
    if (!content.trim()) {
      setError("Post text je obavezan.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await usersApi.createPostMultipart(content, file ?? undefined);

      nav("/app"); 
    } catch (err) {
      console.error(err);
      setError("Greška pri kreiranju posta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <div className="text-2xl font-semibold">Create Post</div>
        <div className="text-sm text-neutral-400">
          Podeli nešto sa svojim pratiocima.
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
        {/* TEXT */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Šta ima novo?"
          rows={4}
          className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-white outline-none"
        />

        {/* IMAGE PREVIEW */}
        {preview && (
          <div className="mt-4 relative">
            <img
              src={preview}
              className="w-full rounded-xl border border-neutral-800"
            />

            <button
              onClick={removeImage}
              className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-1 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* FILE INPUT */}
        <div className="mt-4 flex items-center justify-between">
        <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 transition">
        📷 Upload image
        <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFileChange}
            className="hidden"
        />
        </label>

          <Button onClick={submit} disabled={loading}>
            {loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}