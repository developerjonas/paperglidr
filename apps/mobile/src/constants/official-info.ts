import type { OfficialSource } from '@/api/types';

// Google Play's Misleading Claims policy: the app covers government exams
// (Loksewa, entrance, EPS-TOPIK), so it must say it isn't a government app
// and link the official sources. The server's copy (/api/v1/config
// officialInfo, from apps/web/src/config/officialSources.ts) wins; this one
// is shown until the config has loaded, or offline. Keep the two in step.

export const NOT_GOVERNMENT_DISCLAIMER =
  'Chiyali is a private education platform run by Paperglidr Technology Pvt. Ltd. ' +
  'It is not a government app, and it is not affiliated with, endorsed by or acting for the Government of Nepal, ' +
  'the Public Service Commission (Lok Sewa Aayog), any university, or any exam body. ' +
  'Courses are made by independent teachers. For official notices, syllabuses, dates and results, check the official source.';

export const OFFICIAL_SOURCES: readonly OfficialSource[] = [
  {
    topicSlug: 'loksewa',
    exam: 'Loksewa (civil service exams)',
    body: 'Public Service Commission, Government of Nepal',
    url: 'https://psc.gov.np',
  },
  {
    topicSlug: 'entrance-prep',
    exam: 'IOE engineering entrance',
    body: 'Institute of Engineering, Tribhuvan University',
    url: 'https://ioe.tu.edu.np',
  },
  {
    topicSlug: 'languages',
    exam: 'EPS-TOPIK (work in Korea)',
    body: 'EPS Section, Department of Foreign Employment, Government of Nepal',
    url: 'https://epsnepal.gov.np',
  },
];
