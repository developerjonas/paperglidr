import Link from "next/link";
import { cn } from "@/lib/utils";

/** Paper-plane mark + wordmark. */
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
      aria-label="Chiyali home"
      className={cn("flex shrink-0 items-center gap-2 text-primary", className)}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M2.5 11.5 21.5 3l-6 18-4.5-7.5z" />
        <path d="M11 13.5 21.5 3" />
      </svg>
      <span className="text-[19px] font-bold italic tracking-[-0.03em]">
        Chiyali
      </span>
      {children}
    </Link>
  );
}
