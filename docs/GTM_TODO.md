# GTM TODO: what stands between Chiyali and launch

A plain checklist of what's left before go-to-market. The detailed plan and reasoning are in [GTM_PLAN.md](./GTM_PLAN.md); legal review status is in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md).

Last updated: 2026-10-04.

**Legend:** 🔴 blocks the launch · 🟠 blocks the Play Store launch · 🟡 needed for a good launch · ⏳ slow (takes weeks), start now · ✍️ Claude can draft or prepare it; you review and finish

---

## Where things stand

**Done:**
- Website live at www.chiyali.com: catalogue, checkout with eSewa, the payment cron (cron-job.org, with its failure emails), invoices, refunds, payouts, certificates, Search Console and share images.
- Admin panel: Overview, Users, Courses, Products, Payments, Commissions, Refunds, Payouts, Reports, Support.
- Error reporting: GlitchTip for the website and the app, with Discord alerts.
- Android app 1.0.1 (versionCode 3):
  - Play Console listing, graphics and App content forms are done ([GTM_STORE_TEXTS.md](./GTM_STORE_TEXTS.md));
  - the app is on internal testing and was submitted to closed testing on 4 Oct.

**The critical path now:** courses on production → reviewer password → closed test approved → 12+ testers opted in for 14 days → apply for production. Realistic Play launch: **late October**.

## 1. This week

- [ ] 🔴 **Publish the first 1–3 courses on production.** Approve them at `/admin/products`. The app shows "No courses published yet" until then, and Google can reject an empty app.
- [ ] 🟠 **Reviewer account password:**
  - run `pnpm reviewer:create --yes` in `apps/web`, adding `--product=<id>` for a free course;
  - put the password in Play Console → App content → **Sign in details**;
  - send changes for review again from Publishing overview.

  The closed test went for review without it: if Google rejects it for that, add the password and resubmit (no penalty on testing tracks). Sign in once with it to check.
- [ ] 🟠⏳ **Testers: recruit 15–20 now.**
  - Add them to the Google Group used as the closed test's tester list. Their Gmail must be the one signed in on their Android phone.
  - Once the closed test is approved, send them the opt-in link (Closed testing → Testers).
  - **The 14 days count from when 12 or more are opted in.** Recruit more than 12, because dropping below 12 may restart the count.
  - Ask them to open the app a few times over the two weeks, try it once with Wi-Fi off, and send feedback: Google asks about tester engagement.

## 2. During the 14 days

- [ ] 🔴 **10–15 approved courses across at least 3 topics** before the public launch, each with a free preview that plays on a mid-range Android over 4G.
- [ ] 🟡✍️ **Shortlist 60 creators:** Loksewa, IOE/CEE entrance, EPS-TOPIK/IELTS, Nepali tech YouTubers, accounting/Excel. Ranked by audience size. Claude can do a first pass from public searches; check follower numbers yourself, since they go out of date.
- [ ] 🟡 **Founder calls:** 20 calls → 15 committed → 10–15 published. Ask each creator to join the closed test too.
- [ ] 🟡 **The quick win: free courses from existing YouTube playlists.** In the course editor, **Import YouTube playlist** turns a playlist into a section of lessons in one step (free or not-yet-on-sale courses). The creator adds notes or PDFs, publishes it free, and sells a deeper course with uploaded videos alongside it.
- [ ] 🟡✍️ **Creator launch kit:** their `?ref=` link and a launch promo code (both built), plus outreach messages, a Reel/Short script template and a poster template (Claude can draft).
- [ ] 🟡✍️ **New Play screenshots** showing real courses: the ones in `~/Desktop/Chiyali-Play-assets/` use demo courses. Claude can retake them the same way.
- [ ] 🟡 **Watch GlitchTip** ("Chiyali Expo App") for crashes from testers, and fix anything that shows up in a 1.0.2 build before applying for production.

## 3. Play production (around 20 October)

- [ ] 🟠 **Apply for production access** (Dashboard → Apply for production) once the 14 days are done. Google asks how you tested, what feedback you got and what you changed; it usually answers within 7 days.
- [ ] 🟠 **Release to production** after approval (the release review takes hours to a few days).
- [ ] 🟡 **Updates without the Console** (optional):
  - create a Google Service Account key and upload it to EAS;
  - then run `npx eas-cli@latest build -p android --profile production` and `npx eas-cli@latest submit -p android` (goes to internal testing as a draft).

## 4. Business and money

- [ ] 🟡 **Tax on creator payouts:** whether TDS must be withheld on what we pay creators, and how it's reported. **(confirm with an accountant before the first payout)**
- [ ] 🟡⏳ **Fonepay (optional, a second gateway):** ask early whether they need a fixed server IP; Vercel doesn't have one by default. Only eSewa is switched on today.

## 5. Marketing and launch

- [ ] 🟡 **Brand accounts:** Facebook page, Instagram, TikTok, YouTube channel, a WhatsApp/Viber support number.
- [ ] 🟡 **Creators' own audiences first** (their `?ref=` links earn them 70%). This is the main channel.
- [ ] 🟡 **Facebook groups** (Loksewa, entrance, EPS-TOPIK, IT jobs): post free preview lessons, not bare sales links. Course links show a share card with the title, teacher and price.
- [ ] 🟡 **Short videos:** 30–60 second clips from preview lessons, in Nepali, posted by the creators.
- [ ] 🟡 **Launch promo codes:** 30–50% off for 72 hours, creator-scoped.
- [ ] 🟡✍️ **Campus ambassadors** (TU colleges, Pulchowk/Thapathali, KU, Pokhara) with referral codes. Claude can draft the one-pager.
- [ ] 🟡✍️ **Press** at public launch: Techpana, TechLekh, ICT Samachar. Angle: "Nepal's own Udemy, pay with eSewa, QR-verified certificates." Claude can draft the press release and pitch emails.

## Later

- **iOS**, once there's an Apple developer account. Apple's payment rules: the app shows prices but has no buy button, so there's no in-app purchase; keep it that way, with no "buy on the website" links or wording in the iOS app.

---

## Running Chiyali (routines, from the first sale)

Everything runs from the admin panel (`/admin`). The **Overview** lists what needs attention, and the sidebar shows the counts.

- **Daily:**
  - work through the Overview's "Needs attention" cards;
  - approve submitted courses (`/admin/products`, "Waiting for review");
  - check stuck and disputed payments (`/admin/purchases`; open a payment to see its gateway events and Re-check it);
  - handle new reports and support tickets.
- **Weekly:**
  - pay creators (`/admin/payouts`) on a fixed day; `/admin/commissions` shows what each one is owed;
  - refunds are done by hand in the gateway dashboard, then marked in `/admin/refunds`;
  - glance at `/admin/launch` and call the creators it lists with no sale yet.
- **Support:** answer tickets within 12 hours. Saved replies are built into the admin ticket page (`features/support/lib/savedReplies.ts` to add more).
  - For "I paid but can't open my course": find the user in `/admin/users` and open the payment. If it was really paid, Re-check it, or give the course from their user page.
- **Alerts:** errors arrive in Discord (GlitchTip); payment cron failures arrive by email (cron-job.org).
