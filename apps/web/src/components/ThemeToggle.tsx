"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="h-9 w-full rounded-full border border-white/30 bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
      />
    );
  }

  const options = [
    { value: "light", icon: Sun, label: "Light mode" },
    { value: "dark", icon: Moon, label: "Dark mode" },
    { value: "system", icon: Monitor, label: "System mode" },
  ] as const;

  return (
    <div className="relative flex h-9 items-center rounded-full border border-white/30 bg-white/40 p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={label}
            className={`relative flex h-7 flex-1 items-center justify-center rounded-full text-xs transition-colors duration-200 ${
              isActive
                ? "bg-white text-foreground shadow-sm shadow-black/10 dark:bg-neutral-800"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${
                value === "light" && isActive
                  ? "text-amber-500"
                  : value === "dark"
                    ? "text-slate-700 dark:text-slate-200"
                    : ""
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
