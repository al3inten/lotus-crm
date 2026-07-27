import clsx from "clsx";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
  xxl: "h-28 w-28 text-4xl",
};

export function Avatar({
  name,
  size = "sm",
  src,
}: {
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  /** Profile photo URL — falls back to coloured initials when absent. */
  src?: string | null;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx("shrink-0 rounded-full object-cover", SIZE_CLASSES[size])}
      />
    );
  }
  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-600 font-bold text-white",
        SIZE_CLASSES[size]
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
