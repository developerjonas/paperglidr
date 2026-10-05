import { COMPANY } from "./company"

// Google Play's Misleading Claims policy: an app that covers government
// information (here: government exams) must say clearly that it isn't a
// government entity, and link to the official sources. Shown in the site
// footer, on these topics' Browse pages, and in the app (via /api/v1/config),
// and repeated in the store listing (docs/GTM_STORE_TEXTS.md). Every URL
// here was checked to load; keep it that way.

export const NOT_GOVERNMENT_DISCLAIMER =
  // legalName ends with "." already ("Pvt. Ltd.").
  `${COMPANY.brandName} is a private education platform run by ${COMPANY.legalName} ` +
  "It is not a government app, and it is not affiliated with, endorsed by or acting for the Government of Nepal, " +
  "the Public Service Commission (Lok Sewa Aayog), any university, or any exam body. " +
  "Courses are made by independent teachers. For official notices, syllabuses, dates and results, check the official source."

export type OfficialSource = {
  /** The Browse topic (category slug) whose courses prepare for this exam. */
  topicSlug: string
  exam: string
  body: string
  url: string
}

export const OFFICIAL_SOURCES: readonly OfficialSource[] = [
  {
    topicSlug: "loksewa",
    exam: "Loksewa (civil service exams)",
    body: "Public Service Commission, Government of Nepal",
    url: "https://psc.gov.np",
  },
  {
    topicSlug: "entrance-prep",
    exam: "IOE engineering entrance",
    body: "Institute of Engineering, Tribhuvan University",
    url: "https://ioe.tu.edu.np",
  },
  {
    topicSlug: "languages",
    exam: "EPS-TOPIK (work in Korea)",
    body: "EPS Section, Department of Foreign Employment, Government of Nepal",
    url: "https://epsnepal.gov.np",
  },
]

export function officialSourcesForTopic(slug: string | null | undefined) {
  return OFFICIAL_SOURCES.filter(source => source.topicSlug === slug)
}
