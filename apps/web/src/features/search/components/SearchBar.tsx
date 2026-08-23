"use client";

import { Input } from "@/components/ui/input";
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export function SearchBar({
  redirectTo = "/browse",
  className,
  autoFocus = false,
  onNavigateAction,
}: {
  redirectTo?: string;
  className?: string;
  autoFocus?: boolean;
  /** Fired right after a navigation is triggered — lets a parent overlay close itself. */
  onNavigateAction?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onResultsPage = pathname === redirectTo;

  const [value, setValue] = useState(
    onResultsPage ? (searchParams.get("q") ?? "") : "",
  );
  const [isPending, startTransition] = useTransition();

  // FIX: Using ReturnType<typeof setTimeout> resolves browser/Node type conflict
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (onResultsPage) setValue(searchParams.get("q") ?? "");
  }, [searchParams, onResultsPage]);

  function navigateNow() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const params = new URLSearchParams(
      onResultsPage ? searchParams.toString() : "",
    );
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.push(`${redirectTo}${params.toString() ? `?${params}` : ""}`, {
        scroll: onResultsPage ? false : true,
      });
    });
    onNavigateAction?.();
  }

  useEffect(() => {
    timeoutRef.current = setTimeout(navigateNow, 350);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={`relative w-full ${className ?? ""}`}>
      <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-500 transition-colors group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-200" />

      <Input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigateNow();
        }}
        placeholder="Search courses by title..."
        className="h-10 rounded-full border border-neutral-300 bg-white/80 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-500 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-neutral-400 focus-visible:border-neutral-900 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:hover:border-neutral-700 dark:focus-visible:border-neutral-400 dark:focus-visible:bg-neutral-900 dark:focus-visible:ring-neutral-400"
      />

      <div className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {isPending && (
          <Loader2Icon className="size-4 animate-spin text-neutral-400 dark:text-neutral-500" />
        )}

        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="rounded-full p-0.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Clear search"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
