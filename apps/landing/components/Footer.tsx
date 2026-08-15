import Link from "next/link"
const APP_URL = "https://app.paperglidr.com";

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <span
            className="text-lg text-[#14213D] dark:text-[#F5F3EE]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            PaperGlidr
          </span>
          <p className="mt-3 text-sm text-[#14213D]/60 dark:text-[#F5F3EE]/50">
            A registered e-commerce company in Nepal.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#14213D]/50 dark:text-[#F5F3EE]/40">
            Platform
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#14213D]/70 dark:text-[#F5F3EE]/60">
            <li>
              <Link
                href={`${APP_URL}/browse`}
                className="hover:text-[#14213D] dark:hover:text-[#F5F3EE]"
              >
                Browse courses
              </Link>
            </li>
            <li>
              <Link
                href={`${APP_URL}/instructors/onboarding`}
                className="hover:text-[#14213D] dark:hover:text-[#F5F3EE]"
              >
                Become a creator
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className="hover:text-[#14213D] dark:hover:text-[#F5F3EE]"
              >
                Blog
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#14213D]/50 dark:text-[#F5F3EE]/40">
            Legal
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#14213D]/70 dark:text-[#F5F3EE]/60">
            <li>
              <Link
                href="/legal"
                className="hover:text-[#14213D] dark:hover:text-[#F5F3EE]"
              >
                Business & Registration
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="hover:text-[#14213D] dark:hover:text-[#F5F3EE]"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/tos"
                className="hover:text-[#14213D] dark:hover:text-[#F5F3EE]"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/dmca"
                className="hover:text-[#14213D] dark:hover:text-[#F5F3EE]"
              >
                DMCA Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#14213D]/50 dark:text-[#F5F3EE]/40">
            Support
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#14213D]/70 dark:text-[#F5F3EE]/60">
            <li>
              <Link
                href="/content"
                className="hover:text-[#14213D] dark:hover:text-[#F5F3EE]"
              >
                Content Guidelines
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="font-medium hover:text-[#14213D] dark:hover:text-[#F5F3EE]"
              >
                Contact / File a Complaint
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#14213D]/10 pt-6 text-xs text-[#14213D]/50 sm:flex-row dark:border-[#F5F3EE]/10 dark:text-[#F5F3EE]/40">
        <span>
          &copy; {new Date().getFullYear()} PaperGlidr. All rights reserved.
        </span>
      </div>
    </footer>
  )
}
