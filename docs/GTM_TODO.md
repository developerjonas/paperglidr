# GTM TODO: what stands between Chiyali and launch

A plain checklist of everything blocking go-to-market, from company paperwork to the app stores to the first students. The detailed plan and reasoning are in [GTM_PLAN.md](./GTM_PLAN.md); legal review status is in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md).

Last updated: 2026-09-28.

**Legend:** 🔴 blocks taking real money · 🟠 blocks the app store launch · 🟡 needed for a good launch · ⏳ slow (takes weeks), start now

> Items marked **(confirm)** are Nepali legal or tax requirements as we understand them. Check each with a lawyer or accountant before relying on it.

---

## 1. Company and government (start today ⏳)

Everything payments and app stores need depends on these.

- [ ] 🔴⏳ **Register the company** at the Office of the Company Registrar (OCR) as *Chiyali Technology Pvt. Ltd.* Then put the number in `apps/web/src/config/company.ts` (`registrationNumber`).
- [ ] 🔴⏳ **PAN** from the Inland Revenue Department. Put it in `company.ts` (`pan`).
- [ ] 🔴 **Ward office business registration** for the registered address (Lalitpur-22). **(confirm)**
- [ ] 🔴 **Business bank account** in the company's name. Gateways pay settlements into it, and you pay creators from it.
- [ ] 🔴 **E-Commerce Act, 2081:** check whether Chiyali must register as an e-commerce business with the Department of Commerce, and what the site must display (registration details, grievance officer, complaint process). **(confirm)**
- [ ] 🟡 **VAT registration** once turnover passes the threshold. Invoices already support a VAT rate. **(confirm the threshold)**
- [ ] 🟡 **Tax on creator payouts:** whether TDS must be withheld on what we pay creators, and how it's reported. **(confirm with an accountant)**
- [ ] 🟡 **Privacy law:** make sure the Privacy Policy meets the Individual Privacy Act, 2075. **(confirm)**
- [ ] 🟡 **Accountant on retainer** for monthly VAT/TDS filings and year-end.
- [ ] 🟡 Optional: register the **"Chiyali" trademark** (Department of Industry).

## 2. Legal pages

- [ ] 🔴 **Lawyer reviews all policy pages** (ToS, Privacy, Refund, Creator Terms, Content, DMCA, Contact) and signs off in [LEGAL_REVIEW.md](./LEGAL_REVIEW.md). Gateways check these pages during KYC.
- [ ] 🔴 Replace "Registration in progress" with the real registration number and PAN (the `company.ts` change above).
- [ ] 🟡 The email addresses the site shows (`support@chiyali.com`, `legal@chiyali.com`) must actually receive mail. Set up the mailboxes or forwarding.

## 3. Payments (the real critical path ⏳)

Going live is only env changes; the code is done. Approval is what takes weeks.

- [ ] 🔴⏳ **Khalti merchant account:** apply with company registration, PAN, bank details and the live site.
- [ ] 🔴⏳ **eSewa merchant account:** same documents. Register the return URLs under `https://www.chiyali.com/api/payments/esewa/...`.
- [ ] 🟡⏳ **Fonepay:** goes through the acquiring bank. Ask early whether they need a fixed server IP; Vercel doesn't have one by default.
- [ ] 🔴 Launch on **whichever gateway is approved first.** The checkout hides gateways that aren't configured.
- [ ] 🔴 **Go live, one gateway at a time:** set its live keys and `PAYMENT_MODE=live` in Vercel **Production only**. Then run the ₹10–₹50 real-money smoke test in GTM_PLAN §2.9: buy, close the tab early, replay, cancel, refund.

## 4. Production setup (this week)

- [ ] 🔴 **Run the database catch-up** (`apps/web/scripts/catch-up-migrations-0001-0012.sql`) on the production Neon database. Until then, browse, search, the home page, refunds and payouts fail with "column does not exist". Commit the script too; it isn't in git yet.
- [ ] 🔴 **Vercel env vars point at the final domain:**
  - `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` = `https://www.chiyali.com`. `/api/v1/config` still reports `paperglidr.com`.
  - `BETTER_AUTH_TRUSTED_ORIGINS=https://chiyali.com,chiyali://`
  - `MOBILE_API_ENABLED=true`
  - Redeploy afterwards.
- [ ] 🔴 **Google sign-in:** add `https://www.chiyali.com/api/auth/callback/google` in Google Cloud.
- [ ] 🔴 **Email sending:** verify `chiyali.com` in Resend (SPF/DKIM DNS records), so invoices and password resets arrive and don't land in spam.
- [ ] 🔴 **Vercel Pro:** the Hobby plan doesn't allow commercial use. Pro also lets the payment-reconciliation cron run every 5 minutes instead of daily. Then set the schedule in `apps/web/vercel.json` back to every 5 minutes (see the `TODO(cron)` in `apps/web/src/app/api/cron/reconcile-payments/route.ts`).
- [ ] 🟡 `CRON_SECRET` set, and the cron shows successful runs.
- [ ] 🟡 **Sentry DSN** set, so errors reach you before users post about them.
- [ ] 🟡 **Uptime check** on the home page and `/api/v1/config`.
- [ ] 🔴 **Full end-to-end run in sandbox:** a creator signs up → uploads → you approve → a student buys → watches → finishes → gets a certificate → verifies its QR → asks for a refund → the creator requests a payout.
- [ ] 🟡 **Old lessons:** run `pnpm report:free-tier-video` against production and fix what it lists: free lessons with uploaded video, paid lessons with YouTube or Vimeo links.

## 5. Mobile app: App Store and Play Store 🟠

The website can launch without the apps. Launch web first, then **Android before iOS** (Nepal is mostly Android, and Play review is faster).

**Accounts ⏳**
- [ ] 🟠⏳ **D-U-N-S number** for the company. It's free, from Dun & Bradstreet, and takes days to weeks. Both stores need it for an organization account, which is what makes the listing show "Chiyali Technology Pvt. Ltd." as the publisher.
- [ ] 🟠 **Google Play Console:** organization account, one-time USD 25 fee.
- [ ] 🟠 **Apple Developer Program:** organization account, USD 99 per year.
- [ ] 🟡 If you use a *personal* Play account instead, Google requires a **closed test with 12+ testers for 14 days** before you can publish. Organization accounts skip this. Line up testers either way.

**Things missing in the code**
- [ ] 🟠 **Delete my account, in the app and on the web.** Both stores reject apps that let users create accounts but not delete them. Play also needs a web page or link for deletion. A `deleteUser` function exists in the database code (it anonymises the user), but no screen or action uses it yet.
- [ ] 🟠 **Store identifiers in `apps/mobile/app.json`:** `ios.bundleIdentifier` and `android.package` (e.g. `com.chiyali.app`). These can never change after the first upload.
- [ ] 🟠 **EAS setup:** there is no `eas.json` yet. Run `npx eas-cli@latest build:configure`, then create a production build for each store.
- [ ] 🟠 **Test on real phones:** the lesson player rotating to landscape, and YouTube/Vimeo videos marking the lesson complete when they end. Neither could be checked on the simulator.
- [ ] 🟠 **App icon and splash screen:** still the Expo template images from when the app was created. Stores need the real Chiyali icon.

**Store listings**
- [ ] 🟠 App name, short and full description, category (Education).
- [ ] 🟠 Screenshots: phone sizes for both stores, plus a Play feature graphic.
- [ ] 🟠 Privacy Policy URL: `https://www.chiyali.com/privacy`.
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

---

## Order of attack

1. **Today:** start company registration, PAN, bank account, D-U-N-S *(all slow)*. Run the database catch-up and fix the Vercel env.
2. **This week:** Vercel Pro, Resend domain, Google redirect URI, sandbox end-to-end run. Sign the first 5 creators onto free YouTube-based courses.
3. **When the company docs arrive:** apply to Khalti and eSewa; lawyer reviews the legal pages.
4. **In parallel:** build account deletion, app identifiers and EAS; Play Console internal test.
5. **First gateway approved:** go live, soft launch to creators' own audiences only, aim for the first 100 paid orders.
6. **Then:** public launch with press and ambassadors; submit to the App Store.
