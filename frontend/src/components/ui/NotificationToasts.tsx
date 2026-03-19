export type Toast = {
  id: string;
  title: string;
  message: string;
  time: string;
  href?: string;
};

type Props = {
  items: Toast[];
  onClose: (id: string) => void;
};

export default function NotificationToasts({ items, onClose }: Props) {
  if (!items.length) return null;

  return (
    <div className="fixed right-4 top-4 z-[9999] flex w-[360px] flex-col gap-3">
      {items.map((t) => (
        <div
          key={t.id}
          onClick={() => t.href && window.location.assign(t.href)}
          role={t.href ? "button" : undefined}
          className={`rounded-2xl border border-neutral-800 bg-neutral-950/95 p-4 shadow-lg ${
            t.href ? "cursor-pointer hover:bg-neutral-900/60 transition-colors" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t.title}</div>
              <div className="mt-1 text-sm text-neutral-200 break-words">
                {t.message}
              </div>
              <div className="mt-2 text-xs text-neutral-500">{t.time}</div>
            </div>

            <button
              onClick={() => onClose(t.id)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
