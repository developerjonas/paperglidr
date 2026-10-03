import { SparklesIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** "Founding creator": one of the first creators on Chiyali (set in /admin/creators). */
export function FoundingBadge({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-500/15 font-medium text-amber-700 dark:text-amber-400",
        compact ? "px-1.5 py-0 text-[11px]" : "px-2.5 py-0.5 text-xs",
        className,
      )}
      title="One of the first creators on Chiyali"
    >
      <SparklesIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />
      {compact ? "Founding" : "Founding creator"}
    </span>
  )
}
