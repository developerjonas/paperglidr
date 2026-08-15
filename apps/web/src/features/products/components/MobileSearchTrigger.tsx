"use client";
import { useEffect, useState } from "react";
import { SearchIcon, ArrowLeftIcon } from "lucide-react";
import { SearchBar } from "./SearchBar";

export function MobileSearchTrigger() {
  const [open, setOpen] = useState(false);

  // Lock background scroll and allow Escape to close while the overlay is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground dark:hover:bg-white/10"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background/98 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3 dark:border-white/5">
            <button
              type="button"
              aria-label="Close search"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground dark:hover:bg-white/10"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <SearchBar
              className="flex-1"
              autoFocus
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
