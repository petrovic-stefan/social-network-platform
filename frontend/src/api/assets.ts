export const BACKEND_ORIGIN = "https://localhost:7248";

export function assetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  let normalized = path.replace(/^\/+/, "");

  if (
    normalized.startsWith("profiles/") ||
    normalized.startsWith("posts/")
  ) {
    normalized = `uploads/${normalized}`;
  }

  return `${BACKEND_ORIGIN}/${normalized}`;
}
