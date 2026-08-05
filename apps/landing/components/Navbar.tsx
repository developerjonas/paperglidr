"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, GraduationCap, Presentation } from "lucide-react"

export function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_8px_30px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl backdrop-saturate-150
      dark:border-white/10 dark:bg-black/40 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_30px_-12px_rgba(0,0,0,0.5)]"
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-[#14213D] dark:text-[#F5F3EE]"
        >
          PAPERGLIDR
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/courses"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#14213D]/70 transition-colors hover:bg-white/50 hover:text-[#14213D] sm:flex dark:text-[#F5F3EE]/70 dark:hover:bg-white/10 dark:hover:text-[#F5F3EE]"
          >
            <GraduationCap className="h-4 w-4" />
            My Courses
          </Link>
          <Link
            href="/teach"
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#14213D]/70 transition-colors hover:bg-white/50 hover:text-[#14213D] sm:flex dark:text-[#F5F3EE]/70 dark:hover:bg-white/10 dark:hover:text-[#F5F3EE]"
          >
            <Presentation className="h-4 w-4" />
            Become a Tutor
          </Link>

          <ThemeToggle />

          <Link
            href="/sign-in"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-[#14213D]/70 transition-colors hover:bg-white/50 hover:text-[#14213D] dark:text-[#F5F3EE]/70 dark:hover:bg-white/10 dark:hover:text-[#F5F3EE]"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-[#14213D] px-4 py-1.5 text-sm font-medium text-[#F5F3EE] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-colors hover:bg-[#1d2e54] dark:bg-[#F5F3EE] dark:text-[#14213D] dark:hover:bg-white"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // avoid a hydration mismatch: theme is unknown on the server
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full" />
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[#14213D]/70 transition-colors hover:bg-white/50 hover:text-[#14213D] dark:text-[#F5F3EE]/70 dark:hover:bg-white/10 dark:hover:text-[#F5F3EE]"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
