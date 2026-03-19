import type { ButtonHTMLAttributes } from "react";

type Variant =
| "primary"
| "danger"
| "outline"
| "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
variant?: Variant;
};

export default function Button({
variant = "primary",
className = "",
...props
}: Props) {

const base =
"inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
primary: "bg-blue-600 text-white hover:bg-blue-500",
danger: "bg-red-600 text-white hover:bg-red-500",
outline:
"border border-neutral-700 bg-transparent text-neutral-100 hover:bg-neutral-800",
ghost:
"bg-transparent text-neutral-300 hover:bg-neutral-800",
};

return (
<button
{...props}
className={[base, variants[variant], className].join(" ")}
/>
);
}
