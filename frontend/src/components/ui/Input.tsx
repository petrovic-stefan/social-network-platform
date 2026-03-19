import type { InputHTMLAttributes } from "react";

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5",
        "text-sm text-neutral-100 placeholder:text-neutral-500",
        "outline-none ring-0 focus:border-white/20 focus:bg-white/[0.06]",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
