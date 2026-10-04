import {
  BookOpen,
  Calculator,
  Code2,
  GraduationCap,
  Landmark,
  Languages,
  Laptop,
  Library,
  Palette,
  type LucideIcon,
} from "lucide-react"

// How a category looks on the home page and /browse: an icon and a colour,
// guessed from its slug so a new category gets a sensible look without code.

type CategoryStyle = {
  icon: LucideIcon
  /** Icon tile: tinted background and icon colour (light and dark). */
  tile: string
  /** Card hover: border and background tint. */
  hover: string
}

const STYLES: { match: RegExp; style: CategoryStyle }[] = [
  {
    match: /loksewa|psc|government|civil/,
    style: { icon: Landmark, tile: "bg-rose-500/10 text-rose-600 dark:text-rose-400", hover: "hover:border-rose-500/40 hover:bg-rose-500/5" },
  },
  {
    match: /entrance|exam|school|see|plus-two|neb|iom|ioe|cee/,
    style: { icon: GraduationCap, tile: "bg-amber-500/10 text-amber-600 dark:text-amber-400", hover: "hover:border-amber-500/40 hover:bg-amber-500/5" },
  },
  {
    match: /language|english|korean|japanese|ielts|topik|nepali/,
    style: { icon: Languages, tile: "bg-sky-500/10 text-sky-600 dark:text-sky-400", hover: "hover:border-sky-500/40 hover:bg-sky-500/5" },
  },
  {
    match: /program|coding|code|tech|web|it\b|computer|developer/,
    style: { icon: Code2, tile: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", hover: "hover:border-indigo-500/40 hover:bg-indigo-500/5" },
  },
  {
    match: /account|finance|business|excel|tally|ca\b|market/,
    style: { icon: Calculator, tile: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", hover: "hover:border-emerald-500/40 hover:bg-emerald-500/5" },
  },
  {
    match: /design|art|photo|video|creative/,
    style: { icon: Palette, tile: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400", hover: "hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5" },
  },
  {
    match: /digital|skill|office|freelanc/,
    style: { icon: Laptop, tile: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", hover: "hover:border-cyan-500/40 hover:bg-cyan-500/5" },
  },
  {
    match: /academic|science|math|study/,
    style: { icon: Library, tile: "bg-orange-500/10 text-orange-600 dark:text-orange-400", hover: "hover:border-orange-500/40 hover:bg-orange-500/5" },
  },
]

const DEFAULT_STYLE: CategoryStyle = {
  icon: BookOpen,
  tile: "bg-primary/10 text-primary",
  hover: "hover:border-primary/30 hover:bg-accent",
}

export function categoryStyle(slug: string): CategoryStyle {
  const s = slug.toLowerCase()
  return STYLES.find(({ match }) => match.test(s))?.style ?? DEFAULT_STYLE
}
