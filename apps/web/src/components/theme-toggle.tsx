"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid a hydration mismatch — resolvedTheme is only known client-side
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div
        aria-hidden
        className="h-9 w-[60px] shrink-0 rounded-full border border-white/30 bg-white/40 backdrop-blur-md dark:border-white/10 dark:bg-white/5"
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="group relative flex h-9 w-[60px] shrink-0 items-center rounded-full border border-white/30 bg-white/40 px-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] backdrop-blur-md backdrop-saturate-150 transition-colors duration-300 hover:bg-white/55 dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] dark:hover:bg-white/10"
    >
      {/* Faint icon watermarks so the track hints at both states */}
      <Sun className="pointer-events-none absolute left-1.5 h-3.5 w-3.5 text-amber-500/70 transition-opacity duration-300 group-hover:opacity-100 dark:opacity-30" />
      <Moon className="pointer-events-none absolute right-1.5 h-3.5 w-3.5 text-slate-300 opacity-30 transition-opacity duration-300 dark:text-slate-200 dark:opacity-90" />

      {/* The sliding glass knob */}
      <span
        className={`relative flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md shadow-black/10 ring-1 ring-black/5 transition-transform duration-300 ease-out dark:bg-neutral-800 dark:ring-white/10 ${
          isDark ? "translate-x-[26px]" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-slate-200" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </span>
    </button>
  )
}
