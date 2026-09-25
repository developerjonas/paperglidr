"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Header pill: sun / moon, highlighting whichever theme is showing. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  const options = [
    { value: "light", icon: Sun, label: "Light mode", active: mounted && !isDark },
    { value: "dark", icon: Moon, label: "Dark mode", active: isDark },
  ] as const;

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={cn(
        "flex h-9 items-center gap-0.5 rounded-full bg-secondary p-1",
        className,
      )}
    >
      {options.map(({ value, icon: Icon, label, active }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200",
            active
              ? "bg-background shadow-sm ring-1 ring-black/5 dark:bg-accent dark:ring-white/10"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              active && value === "light" && "text-amber-500",
              active && value === "dark" && "text-primary",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** Full control with labels and a System option — drawer and account menu. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="grid h-10 grid-cols-3 gap-1 rounded-full bg-secondary p-1"
    >
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={isActive}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-all duration-200",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:bg-accent dark:ring-white/10"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
