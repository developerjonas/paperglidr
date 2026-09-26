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
  // The query the URL already reflects. Only typing something different
  // navigates — otherwise every page load would redirect to /browse.
  const [synced, setSynced] = useState(value);

  // On the results page, follow the URL's ?q= (back/forward, links) —
  // adjusted during render when it changes, not in an effect.
  const urlQuery = onResultsPage ? (searchParams.get("q") ?? "") : null;
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (urlQuery != null) {
      setSynced(urlQuery);
      setValue(urlQuery);
    }
  }

  function navigateNow() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSynced(value);
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
    if (value === synced) return;
    timeoutRef.current = setTimeout(navigateNow, 350);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, synced]);

  return (
    <div className={`relative w-full ${className ?? ""}`}>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigateNow();
        }}
        placeholder="Search courses…"
        className="h-10 rounded-full border-transparent bg-secondary pl-10 pr-10 text-sm text-foreground shadow-none transition-colors placeholder:text-muted-foreground hover:bg-accent focus-visible:border-primary/40 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/15"
      />

      <div className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {isPending && (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        )}

        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Clear search"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
