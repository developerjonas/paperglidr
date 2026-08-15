"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function SearchBar({
  redirectTo = "/",
  className,
}: {
  /** Where results are shown. Search always routes here + ?q=... */
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onResultsPage = pathname === redirectTo;

  const [value, setValue] = useState(
    onResultsPage ? (searchParams.get("q") ?? "") : "",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (onResultsPage) setValue(searchParams.get("q") ?? "");
  }, [searchParams, onResultsPage]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(
        onResultsPage ? searchParams.toString() : "",
      );
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(
          `${redirectTo}${params.toString() ? `?${params}` : ""}#courses`,
          { scroll: onResultsPage ? false : true },
        );
      });
    }, 350);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={`relative w-full ${className ?? ""}`}>
      <SearchIcon className="absolute left-4 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search courses by title..."
        className="h-11 rounded-full border-white/30 bg-white/50 pl-11 pr-9 text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-md transition-colors focus-visible:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:focus-visible:bg-white/[0.08]"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <XIcon className="size-4" />
        </button>
      )}
      {isPending && (
        <span className="absolute -bottom-5 left-1 text-xs text-muted-foreground">
          Searching…
        </span>
      )}
    </div>
  );
}
