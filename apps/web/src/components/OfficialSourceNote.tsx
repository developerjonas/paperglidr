import { Info } from "lucide-react";
import { COMPANY } from "@/config/company";
import { officialSourcesForTopic } from "@/config/officialSources";

/**
 * On a government-exam topic (Loksewa, entrance, EPS-TOPIK): Chiyali isn't
 * the exam body, and here is the official source (Google Play's Misleading
 * Claims policy; see config/officialSources.ts). Nothing for other topics.
 */
export function OfficialSourceNote({ topicSlug }: { topicSlug: string }) {
  const sources = officialSourcesForTopic(topicSlug);
  if (sources.length === 0) return null;
  return (
    <div className="flex gap-3 rounded-lg border bg-background/60 p-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        {COMPANY.brandName} is not a government website and isn&apos;t affiliated with any exam body. For
        official notices, syllabuses, dates and results:{" "}
        {sources.map((source, i) => (
          <span key={source.url}>
            {i > 0 && "; "}
            {source.exam}: {source.body},{" "}
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline underline-offset-2">
              {source.url.replace(/^https:\/\//, "")}
            </a>
          </span>
        ))}
        .
      </p>
    </div>
  );
}
