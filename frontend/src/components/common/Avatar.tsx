import clsx from "clsx";

const PALETTE = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-teal-600",
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({ name, size = "sm" }: { name: string; size?: keyof typeof SIZE_CLASSES }) {
  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        SIZE_CLASSES[size],
        colorFor(name)
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
