import Link from "next/link";
import { BRAND_NAME, PLANE_MARK } from "@repo/brand";
import { cn } from "@/lib/utils";

/** Paper-plane mark + wordmark, from @repo/brand (the same mark as the app and every icon). */
export function Logo({
  className,
  children,
}: {
  className?: string;
  /** Rendered after the wordmark, e.g. a STUDIO badge. */
  children?: React.ReactNode;
}) {
  return (
    <Link
      href="/"
      aria-label={`${BRAND_NAME} home`}
      className={cn("flex shrink-0 items-center gap-2 text-primary", className)}
    >
      <svg
        viewBox={PLANE_MARK.viewBox}
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={PLANE_MARK.strokeWidth}
        strokeLinejoin={PLANE_MARK.strokeLinejoin}
        strokeLinecap={PLANE_MARK.strokeLinecap}
        aria-hidden="true"
      >
        {PLANE_MARK.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
      <span className="text-[19px] font-bold italic tracking-[-0.03em]">
        {BRAND_NAME}
      </span>
      {children}
    </Link>
  );
}
