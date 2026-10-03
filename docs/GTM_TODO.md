# GTM TODO: what stands between Chiyali and launch

A plain checklist of what's left before go-to-market. The detailed plan and reasoning are in [GTM_PLAN.md](./GTM_PLAN.md); legal review status is in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md).

Last updated: 2026-10-03.

**Legend:** 🔴 blocks taking real money · 🟠 blocks the app store launch · 🟡 needed for a good launch · ⏳ slow (takes weeks), start now · ✍️ Claude can draft or prepare it; you review and finish

---

## 1. Ship what's built (this week)

- [ ] 🟠 **Push and deploy the latest commits:** the admin panel (Users, Courses, Products, Payments, Commissions) and `/account/delete` opening signed out. Play checks the account deletion URL, so deploy before filling in the Data safety form. No migration needed.
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

- [x] 🟠 **App ready for its first build:** expo-doctor 21/21, the Android bundle exports, the production API responds. The upload keystore was generated and is stored by EAS. Never lose access to the Expo account (@thejonas): every update must be signed with that keystore.
- [ ] 🟠 **First builds (started 3 Oct on EAS):** the production AAB (versionCode 2) for Play, and a preview APK to install on phones. Download both from expo.dev → chiyali → Builds.
- [ ] 🟠 **Test the preview APK on real phones:**
  - rotating a lesson to landscape (full-screen player);
  - YouTube/Vimeo lessons marking themselves complete when the video ends;
  - the splash screen, which only shows correctly in a preview or production build;
  - a crash report reaching GlitchTip's "Chiyali Expo App" project.
- [ ] 🟠 **Play Console: create the app.** Name `Chiyali: Courses in Nepal`, default language English, App, Free. The first upload sets the package `com.developerjonas.chiyali`.
- [ ] 🟠✍️ **Store listing and App content forms.** Every answer is ready to paste in [GTM_STORE_TEXTS.md](./GTM_STORE_TEXTS.md):
  - listing texts;
  - app access (the reviewer account);
  - ads, content rating, target audience and Data safety;
  - account deletion URL `https://www.chiyali.com/account/delete` and privacy policy `https://www.chiyali.com/privacy`;
  - graphics: a 512×512 icon, the 1024×500 feature graphic and at least 2 phone screenshots (Claude can make them from the app with demo courses).
- [ ] 🟠 **Upload the first AAB by hand.** Google requires the very first upload to go through the Play Console, not the API. Go to Testing → Internal testing → Create release, and upload the `.aab`. Add yourself as an internal tester and install it from Play to check it.
- [ ] 🟠⏳ **Closed test: 12+ testers for 14 days (start now):**
  - create a Google Group (e.g. `chiyali-testers@googlegroups.com`) and add it as the closed test's tester list: one list that's easy to grow;
  - promote the same release to **Closed testing**, with Nepal as the country (plus wherever testers live);
  - recruit **15–20** testers, not exactly 12: if fewer than 12 stay opted in, the 14 days may have to start again. Good candidates are first creators, students, and friends with Android phones; the Gmail address they give must be the one signed in on their phone;
  - send them the opt-in link, and ask them to open the app a few times over the two weeks and send feedback. Google asks about tester engagement when you apply.
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
