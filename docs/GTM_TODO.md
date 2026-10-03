# GTM TODO: what stands between Chiyali and launch

A plain checklist of what's left before go-to-market. The detailed plan and reasoning are in [GTM_PLAN.md](./GTM_PLAN.md); legal review status is in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md).

Last updated: 2026-10-03.

**Legend:** 🔴 blocks taking real money · 🟠 blocks the app store launch · 🟡 needed for a good launch · ⏳ slow (takes weeks), start now · ✍️ Claude can draft or prepare it; you review and finish

---

## 1. Ship what's built (this week)

- [ ] 🔴 **Push the latest commits** (app crash reporting, draft-course rule, YouTube playlist import, lint fixes): ask Claude to push. Vercel deploys automatically.
- [ ] 🔴 **Run migration 0013 on the production database** if it isn't done yet: the deployed code already reads these columns (if `https://www.chiyali.com/api/health` shows `"schema":"fail"`, this is why):
  ```sql
  ALTER TABLE "products"    ADD COLUMN IF NOT EXISTS "featured_at" timestamp with time zone;
  ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "creator_terms_accepted_at" timestamp with time zone;
  ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "creator_terms_version" text;
  ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "is_founding" boolean DEFAULT false NOT NULL;
  ```
- [ ] 🔴 **Payment cron on cron-job.org:** every 5 minutes, `GET https://www.chiyali.com/api/cron/reconcile-payments` with header `Authorization: Bearer <CRON_SECRET>`, timeout 30s. Press **Test run**: 200 = working, 401 = wrong secret. Full steps: [PAYMENTS.md](./PAYMENTS.md) → Cron.
- [ ] 🟡 **GlitchTip:**
  - set `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_ENVIRONMENT=production` in Vercel;
  - add an alert ("1 event in 1 minute" → email or Discord) in **both** projects: Chiyali Web and Chiyali Expo App (the app's reporting is already in its preview and production builds);
  - add a **Heartbeat** monitor (5-minute interval, 10 minutes grace) and put its URL in `CRON_HEARTBEAT_URL`;
  - add uptime monitors for `/api/health`, `/` and `/api/v1/config`.

  Steps: [OBSERVABILITY.md](./OBSERVABILITY.md).
- [ ] 🟡 **Admin setup after deploying:**
  - turn on **Founding creator** (and **Verified**) for your first creators at `/admin/creators`;
  - **feature** your best courses at `/admin/products`.
- [ ] 🟡 **Google Search Console:** verify `www.chiyali.com` and submit `https://www.chiyali.com/sitemap.xml`. Check a course link's share image in Facebook's Sharing Debugger.
- [ ] 🟡 **YouTube playlist import:** in Google Cloud, create a project, enable **YouTube Data API v3**, create an API key (restrict it to that API), and add it to Vercel as `YOUTUBE_API_KEY`. Free; the daily quota covers thousands of imports. Until then the import button says it isn't set up.

## 2. Business and money

- [ ] 🔴 **Vercel Pro:** the Hobby plan doesn't allow commercial use. (The payment cron no longer depends on it; it runs from cron-job.org.)
- [ ] 🟡⏳ **Fonepay:** goes through the acquiring bank. Ask early whether they need a fixed server IP; Vercel doesn't have one by default.
- [ ] 🟡 **Tax on creator payouts:** whether TDS must be withheld on what we pay creators, and how it's reported. **(confirm with an accountant)**

## 3. Android app (Google Play, personal account)

iOS comes later, once there's an Apple developer account.

- [ ] 🟠 **First test build:** `npx eas-cli@latest build -p android --profile preview` in `apps/mobile`. Accept the generated keystore and never lose access to the Expo account (@thejonas), because every update must be signed with it.
- [ ] 🟠 **Test on real phones:**
  - rotating a lesson to landscape (full-screen player);
  - YouTube/Vimeo lessons marking themselves complete when the video ends;
  - the splash screen, which only shows correctly in a preview or production build;
  - a crash report reaching GlitchTip's "Chiyali Expo App" project.
- [ ] 🟠⏳ **Closed test: 12+ testers opted in for 14 continuous days.** Required for new personal Play accounts before production. Recruit them now: first creators and students.
- [ ] 🟠 **Play Console:**
  - create the app with package `com.developerjonas.chiyali`;
  - create a Google Service Account key and upload it to EAS;
  - then `npx eas-cli@latest build -p android --profile production` and `npx eas-cli@latest submit -p android` (goes to internal testing as a draft).
- [ ] 🟠 **Reviewer login:** run `pnpm reviewer:create --yes` in `apps/web` against production (or give Claude the production database connection string). It prints the password once. Put it in Play Console → App content → App access.
- [ ] 🟠✍️ **Store listing** (texts ready in [GTM_STORE_TEXTS.md](./GTM_STORE_TEXTS.md)):
  - short and full description;
  - phone screenshots and the 1024×500 feature graphic (Claude can make them from the app with demo courses; real-phone ones look slightly more native);
  - Privacy Policy URL `https://www.chiyali.com/privacy`;
  - account deletion URL `https://www.chiyali.com/account/delete`.
- [ ] 🟠✍️ **Data safety form and content rating questionnaire** (answers ready in [GTM_STORE_TEXTS.md](./GTM_STORE_TEXTS.md)). The app collects name, email, username and learning progress; nothing is sold. Q&A and reviews are user-generated content. Claude can check the code for exactly what's collected and write every answer for you to paste.
- [ ] 🟡 **Later, for iOS:** Apple's payment rules. The app shows prices but has no buy button, so there's no in-app purchase; keep it that way, with no "buy on the website" links or wording in the iOS app.

## 4. Content supply (besides seeding courses yourself)

- [ ] 🔴 **10–15 approved courses across at least 3 topics** before the public launch, each with a free preview that plays on a mid-range Android over 4G.
- [ ] 🟡✍️ **Shortlist 60 creators:** Loksewa, IOE/CEE entrance, EPS-TOPIK/IELTS, Nepali tech YouTubers, accounting/Excel. Ranked by audience size. Claude can do a first pass from public searches; check follower numbers yourself, since they go out of date.
- [ ] 🟡 **Founder calls:** 20 calls → 15 committed → 10–15 published.
- [ ] 🟡 **The quick win: free courses from existing YouTube playlists.** In the course editor, **Import YouTube playlist** turns a playlist into a section of lessons in one step (free or not-yet-on-sale courses). The creator adds notes or PDFs, publishes it free, and sells a deeper course with uploaded videos alongside it.
- [ ] 🟡 **White-glove onboarding:** you build their first course from a Google Drive handoff, write the description, make the thumbnail.
- [ ] 🟡 **Founding-creator deal:** decide the terms (e.g. a lower fee for 90 days). The badge and the home-page feature are built.
- [ ] 🟡✍️ **Creator launch kit:** their `?ref=` link and a launch promo code (both built), plus outreach messages, a Reel/Short script template and a poster template (Claude can draft).

## 5. Marketing and launch

- [ ] 🟡 **Brand accounts:** Facebook page, Instagram, TikTok, YouTube channel, a WhatsApp/Viber support number.
- [ ] 🟡 **Creators' own audiences first** (their `?ref=` links earn them 70%). This is the main channel.
- [ ] 🟡 **Facebook groups** (Loksewa, entrance, EPS-TOPIK, IT jobs): post free preview lessons, not bare sales links. Course links now show a share card with the title, teacher and price.
- [ ] 🟡 **Short videos:** 30–60 second clips from preview lessons, in Nepali, posted by the creators.
- [ ] 🟡 **Launch promo codes:** 30–50% off for 72 hours, creator-scoped.
- [ ] 🟡✍️ **Campus ambassadors** (TU colleges, Pulchowk/Thapathali, KU, Pokhara) with referral codes. Claude can draft the one-pager.
- [ ] 🟡✍️ **Press** at public launch: Techpana, TechLekh, ICT Samachar. Angle: "Nepal's own Udemy, pay with eSewa/Khalti, QR-verified certificates." Claude can draft the press release and pitch emails.

## 6. Operations (be ready before the first sale)

- [ ] 🟡 **Daily routine:**
  - approve submitted courses (`/admin/products`);
  - check pending payments and new reports ([WATCHLIST.sql](./WATCHLIST.sql));
  - glance at `/admin/launch`.
- [ ] 🟡 **Weekly routine:**
  - pay creators (`/admin/payouts`) on a fixed day;
  - refunds are done by hand in the gateway dashboard, then marked in `/admin/refunds`;
  - call the creators the launch dashboard lists with no sale yet.
- [ ] 🟡 **Support:** someone answers tickets within 12 hours. Saved replies are built into the admin ticket page (`features/support/lib/savedReplies.ts` to add more).
