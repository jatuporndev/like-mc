import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Renders a team crest from football-data.org, falling back to a circular
 * monogram when no crest is available (e.g. TBD placeholder teams).
 */
export function TeamCrest({
  src,
  name,
  size = 40,
  className,
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    const initials = name.slice(0, 3).toUpperCase();
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground",
          className
        )}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {initials}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={`${name} crest`}
      width={size}
      height={size}
      className={cn("object-contain", className)}
      unoptimized={src.endsWith(".svg")}
    />
  );
}
