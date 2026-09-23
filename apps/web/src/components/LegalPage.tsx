import { ReactNode } from "react"

/**
 * Shared layout for policy pages (ToS, privacy, refunds, DMCA, ...).
 * Styles plain h2/h3/p/ul/a children directly — the app has no Tailwind
 * typography plugin.
 */
export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated?: string
  children: ReactNode
}) {
  return (
    <article className="container max-w-3xl py-10">
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
        {title}
      </h1>
      {lastUpdated && (
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      )}
      <div className="mt-8 space-y-4 leading-7 text-foreground/90 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:pt-2 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_table]:w-full [&_table]:text-sm [&_td]:border-b [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_th]:border-b [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </article>
  )
}
