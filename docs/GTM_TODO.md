# GTM TODO: what stands between Chiyali and launch

A plain checklist of everything blocking go-to-market, from company paperwork to the app stores to the first students. The detailed plan and reasoning are in [GTM_PLAN.md](./GTM_PLAN.md); legal review status is in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md).

Last updated: 2026-09-28.

**Legend:** 🔴 blocks taking real money · 🟠 blocks the app store launch · 🟡 needed for a good launch · ⏳ slow (takes weeks), start now

---

## TODOS:

- [ ] 🟡 **Tax on creator payouts:** whether TDS must be withheld on what we pay creators, and how it's reported. **(confirm with an accountant)**

- [ ] 🟡⏳ **Fonepay:** goes through the acquiring bank. Ask early whether they need a fixed server IP; Vercel doesn't have one by default.

- [ ] 🔴 **Vercel Pro:** the Hobby plan doesn't allow commercial use. Pro also lets the payment-reconciliation cron run every 5 minutes instead of daily. Then set the schedule in `apps/web/vercel.json` back to every 5 minutes (see the `TODO(cron)` in `apps/web/src/app/api/cron/reconcile-payments/route.ts`).

- [ ] 🟡 **Sentry DSN** set, so errors reach you before users post about them.

**Things missing in the code**
- [ ] 🟠 **Store identifiers in `apps/mobile/app.json`:** `ios.bundleIdentifier` and `android.package` (e.g. `com.chiyali.app`). These can never change after the first upload.
- [ ] 🟠 **EAS setup:** there is no `eas.json` yet. Run `npx eas-cli@latest build:configure`, then create a production build for each store.
- [ ] 🟠 **App icon and splash screen:** still the Expo template images from when the app was created. Stores need the real Chiyali icon.

**Store listings**
- [ ] 🟠 Screenshots: phone sizes for both stores, plus a Play feature graphic.
- [ ] 🟠 **Play Data safety form** and **Apple privacy labels:** what the app collects (name, email, username, learning progress; nothing sold).
- [ ] 🟠 A **demo account** for the store reviewers, with a purchased course, so they can see lessons.
- [ ] 🟠 Age / content rating questionnaires.
- [ ] 🟡 **Apple payment rules:** the app shows prices but has no buy button, so there's no in-app purchase. Keep it that way: no "buy on the website" links or wording in the iOS app, or Apple will reject it.

## 6. Content supply (besides seeding courses yourself)

- [ ] 🔴 **10–15 approved courses across at least 3 topics** before the public launch, each with a free preview that plays on a mid-range Android over 4G.
- [ ] 🟡 **Shortlist 60 creators:** Loksewa, IOE/CEE entrance, EPS-TOPIK/IELTS, Nepali tech YouTubers, accounting/Excel. Ranked by audience size.
- [ ] 🟡 **Founder calls:** 20 calls → 15 committed → 10–15 published.
- [ ] 🟡 **The quick win: free courses from existing YouTube videos.** Free courses and previews now use YouTube/Vimeo links, so a creator can publish their existing series as a free course in an hour. No upload, and no payment approval needed. Sell the advanced part later.
- [ ] 🟡 **White-glove onboarding:** you build their first course from a Google Drive handoff, write the description, make the thumbnail.
- [ ] 🟡 **Founding-creator deal:** e.g. a lower fee for 90 days, a badge, featured on the home page, payouts every Friday.
- [ ] 🟡 **Creator launch kit:** their `?ref=` link, a launch promo code, a Reel/Short script, a poster.
- [ ] 🟡 **Written creator terms accepted,** including that they own the rights to their content.

## 7. Marketing and launch

- [ ] 🟡 **Brand accounts:** Facebook page, Instagram, TikTok, YouTube channel, a WhatsApp/Viber support number.
- [ ] 🟡 **Creators' own audiences first** (their `?ref=` links earn them 70%). This is the main channel.
- [ ] 🟡 **Facebook groups** (Loksewa, entrance, EPS-TOPIK, IT jobs): post free preview lessons, not bare sales links.
- [ ] 🟡 **Short videos:** 30–60 second clips from preview lessons, in Nepali, posted by the creators.
- [ ] 🟡 **Launch promo codes:** 30–50% off for 72 hours, creator-scoped.
- [ ] 🟡 **Campus ambassadors** (TU colleges, Pulchowk/Thapathali, KU, Pokhara) with referral codes.
- [ ] 🟡 **Press** at public launch: Techpana, TechLekh, ICT Samachar. Angle: "Nepal's own Udemy, pay with eSewa/Khalti, QR-verified certificates."
- [ ] 🟡 **SEO basics:** a real OG image and title/description for sharing; submit the sitemap to Google Search Console.

## 8. Operations (be ready before the first sale)

- [ ] 🟡 **Daily routine:** approve submitted courses, check pending payments and new reports ([WATCHLIST.sql](./WATCHLIST.sql)).
- [ ] 🟡 **Weekly routine:** creator payouts every Friday; refunds are done by hand in the gateway dashboard, then marked in admin.
- [ ] 🟡 **Support:** someone answers tickets within 12 hours, with saved replies for "I paid but have no access" and "video won't play".
- [ ] 🟡 **Tracking:** a simple spreadsheet or saved queries for sign-ups, purchases, conversion, and share of sales via `?ref=`.
