# GTM TODO: what stands between Chiyali and launch

A plain checklist of what's left before go-to-market. The detailed plan and reasoning are in [GTM_PLAN.md](./GTM_PLAN.md); legal review status is in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md).

Last updated: 2026-10-03.

**Legend:** 🔴 blocks taking real money · 🟠 blocks the app store launch · 🟡 needed for a good launch · ⏳ slow (takes weeks), start now · ✍️ Claude can draft or prepare it; you review and finish

---

## 1. Ship what's built (this week)

- [x] 🟠 **Pushed (3 Oct):** the admin panel (Users, Courses, Products, Payments, Commissions), `/account/delete` opening signed out, and the script fixes. Check after Vercel deploys: `https://www.chiyali.com/account/delete` opens without signing in.
- [ ] 🟡 **GlitchTip:**
  - set `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_ENVIRONMENT=production` in Vercel;
  - add an alert ("1 event in 1 minute" → email or Discord) in **both** projects: Chiyali Web and Chiyali Expo App (the app's reporting is already in its preview and production builds);
  - add a **Heartbeat** monitor (5-minute interval, 10 minutes grace) and put its URL in `CRON_HEARTBEAT_URL`;
  Steps: [OBSERVABILITY.md](./OBSERVABILITY.md).

## 2. Business and money

- [ ] 🟡⏳ **Fonepay:** Ask early whether they need a fixed server IP; Vercel doesn't have one by default.
- [ ] 🟡 **Tax on creator payouts:** whether TDS must be withheld on what we pay creators, and how it's reported. **(confirm with an accountant)**

## 3. Android app (Google Play, personal account): fast track

iOS comes later, once there's an Apple developer account.

**The one step that can't be shortened:** a new personal Play account must run a **closed test with at least 12 testers opted in for 14 days in a row** before it can apply for production. So the fast track is: get the closed test live with 12+ testers **as early as possible**, and do everything else alongside it.

| When | What |
|---|---|
| Day 0 (3–4 Oct) | Builds done; app created in Play Console; listing and App content forms filled; AAB uploaded to internal and closed testing |
| Day 1–3 | Google reviews the closed test release; testers opt in. **The 14 days count from when 12+ testers are opted in** |
| ~Day 17 (≈ 20 Oct) | Apply for production access in Play Console |
| ~Day 18–24 | Google answers (usually within 7 days); then release to production (that review takes hours to a few days) |

Realistic public launch on Play: **around 22–27 October**, if 12+ testers are opted in by 5–6 October.

- [x] 🟠 **Play Console set up (3 Oct):** app "Chiyali: Courses in Nepal" (`com.developerjonas.chiyali`) created; store listing, graphics and App content forms filled ([GTM_STORE_TEXTS.md](./GTM_STORE_TEXTS.md)); first AAB (versionCode 2) uploaded to internal testing.
  - The screenshots in `~/Desktop/Chiyali-Play-assets/` show demo courses: replace them with real ones before the public launch.
- [ ] 🟠 **Reviewer account password:** create it once a first course is live on production (`pnpm reviewer:create --yes` in `apps/web`; add `--product=<id>` for a free course), then put the password in App content → Sign in details. Sign in once with it to check before Google reviews the app.
- [ ] 🟠⏳ **Closed test: 12+ testers for 14 days (start now).** In Play Console → Dashboard → "Set up your closed test track":
  1. **Select countries and regions:** Nepal (plus wherever testers live).
  2. **Select testers:** create a Google Group (e.g. `chiyali-testers@googlegroups.com`), add testers' Gmail addresses to it, and add the group's address as the tester list. One list that's easy to grow.
  3. **Create a new release:** add the same AAB from the app bundle library (versionCode 2) and the release notes from GTM_STORE_TEXTS.md.
  4. **Preview and confirm**, then **send the release to Google for review** (Publishing overview → Send changes for review).
  5. When it's approved, copy the opt-in link (Closed testing → Testers) and send it to testers. The 14 days count from when **12 or more are opted in**.
  - Recruit **15–20** testers, not exactly 12: if fewer than 12 stay opted in, the 14 days may have to start again. Good candidates are first creators, students, and friends with Android phones; the Gmail address they give must be the one signed in on their phone.
  - Ask them to open the app a few times over the two weeks and send feedback: Google asks about tester engagement when you apply.
- [ ] 🟠 **Apply for production access** (Dashboard → Apply for production) once the 14 days are done. Google asks how you tested, what feedback you got and what you changed.
- [ ] 🟠 **After that, updates without the Console:**
  - create a Google Service Account key and upload it to EAS;
  - then run `npx eas-cli@latest build -p android --profile production` and `npx eas-cli@latest submit -p android` (goes to internal testing as a draft).
- [ ] 🟡 **Later, for iOS:** Apple's payment rules. The app shows prices but has no buy button, so there's no in-app purchase; keep it that way, with no "buy on the website" links or wording in the iOS app.

## 4. Content supply (besides seeding courses yourself)

- [ ] 🔴 **10–15 approved courses across at least 3 topics** before the public launch, each with a free preview that plays on a mid-range Android over 4G.
- [ ] 🟡✍️ **Shortlist 60 creators:** Loksewa, IOE/CEE entrance, EPS-TOPIK/IELTS, Nepali tech YouTubers, accounting/Excel. Ranked by audience size. Claude can do a first pass from public searches; check follower numbers yourself, since they go out of date.
- [ ] 🟡 **Founder calls:** 20 calls → 15 committed → 10–15 published. Ask each creator to join the closed test too.
- [ ] 🟡 **The quick win: free courses from existing YouTube playlists.** In the course editor, **Import YouTube playlist** turns a playlist into a section of lessons in one step (free or not-yet-on-sale courses). The creator adds notes or PDFs, publishes it free, and sells a deeper course with uploaded videos alongside it.
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

Everything runs from the admin panel (`/admin`). The **Overview** lists what needs attention, and the sidebar shows the counts.

- [ ] 🟡 **Daily routine:**
  - work through the Overview's "Needs attention" cards;
  - approve submitted courses (`/admin/products`, "Waiting for review");
  - check stuck and disputed payments (`/admin/purchases`; open a payment to see its gateway events and Re-check it);
  - handle new reports and support tickets.
- [ ] 🟡 **Weekly routine:**
  - pay creators (`/admin/payouts`) on a fixed day; `/admin/commissions` shows what each one is owed;
  - refunds are done by hand in the gateway dashboard, then marked in `/admin/refunds`;
  - glance at `/admin/launch` and call the creators it lists with no sale yet.
- [ ] 🟡 **Support:** someone answers tickets within 12 hours. Saved replies are built into the admin ticket page (`features/support/lib/savedReplies.ts` to add more).
  - For "I paid but can't open my course": find the user in `/admin/users` and open the payment. If it was really paid, Re-check it, or give the course from their user page.
