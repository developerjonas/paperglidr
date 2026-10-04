# Legal review checklist

For the lawyer reviewing Chiyali's policies. The pages are complete drafts for a Nepal-based course marketplace; nothing on the site is marked as a draft, and review status is tracked **only here**.

Last updated: 2026-10-04.

## How the pages are built (so edits stay consistent)

- **Company details** (legal name, registered address, registration number, PAN, emails) come from one file: `apps/web/src/config/company.ts`. The registration number and PAN are `null` and show "Registration in progress"; filling each in is a one-line change.
- **Numbers** (refund window, completion threshold, platform fees, minimum payout, referral window, minimum description length) are read from the constants the code enforces, via `apps/web/src/config/policyTerms.ts`. **To change a number, change the code, not the text**, or the policy and the product will disagree.
- **"Last updated"** on every page is `LEGAL_LAST_UPDATED` in `company.ts`. Change it whenever a page's wording changes.
- Pages live in `apps/web/src/app/(consumer)/(legal)/<route>/page.tsx`.

## Status

| Page | Route | Status | Reviewer | Date |
|---|---|---|---|---|
| Terms of Service | `/tos` | ☐ Not reviewed | | |
| Privacy Policy | `/privacy` | ☐ Not reviewed (updated 4 Oct, see below) | | |
| Refund Policy | `/refund-policy` | ☐ Not reviewed | | |
| Creator Terms | `/creator-terms` | ☐ Not reviewed | | |
| Content Policy | `/content` | ☐ Not reviewed | | |
| DMCA & Takedown Policy | `/dmca` | ☐ Not reviewed | | |
| Contact | `/contact` | ☐ Not reviewed | | |
| Legal index | `/legal` | ☐ Not reviewed | | |
| Footer company block | every page | ☐ Not reviewed | | |

## Recent changes to review

On 4 October the Privacy Policy was brought up to date with the product. **Confirm the new wording:**
- **§1:** sign-up by email, username and password (the password stored only as a hash), besides Google.
- **§1:** a new "When you use the Android app" section: crash reports (device model, OS, app version, a random installation ID; no IP, name or email), the camera used only on the phone to scan certificate QR codes, the sign-in kept in the phone's secure storage, and public course info saved for offline use.
- **§4:** hosting and database providers named: Vercel and Neon.
- **§5 and §7:** self-service account deletion (Account → Delete account, on the website and in the app), what's deleted, and what's kept (purchase, invoice and refund records; reviews and Q&A shown as "Deleted user"; issued certificates).

These match the Google Play Data safety answers in [GTM_STORE_TEXTS.md](./GTM_STORE_TEXTS.md). If the policy changes, keep the two in step.

## Decisions needed across all pages

1. **Company registration and PAN.** Both are pending. May the site operate and take payments while showing "Registration in progress"?
2. **E-commerce legislation.** Does the E-Commerce Act, 2081 apply? If so, what must the site show: registration details, a grievance officer, a complaint procedure, response times?
3. **Individual Privacy Act, 2075 and Regulation, 2077.** Which data-subject rights, consents and response times must be stated? Is a privacy or grievance officer required? The policy states rights in general terms without citing sections.
4. **Electronic Transactions Act, 2063.** Is clickwrap acceptance (creating an account or buying means agreeing) effective? Do electronic invoices and records meet its requirements?
5. **Consumer Protection Act, 2075.** Does the refund policy conflict with statutory consumer rights? The draft says it doesn't limit them.
6. **Tax.** How long must purchase, invoice and payout records be kept (the policy says "as long as the law requires", without a number)? Must Chiyali withhold TDS on creator payouts? When does VAT registration apply (invoices show no VAT and no PAN)?
7. **Governing courts.** "Competent courts of Nepal", or a named court (e.g. Lalitpur District Court)? Add arbitration?
8. **Minimum age.** The drafts use 18, with under-18s allowed with a parent or guardian, and creators 18+. On Google Play the app targets 16+. Confirm, and what "consent" requires in practice.
9. **Cross-border processing.** Cloudflare, Resend, Google, GlitchTip, Vercel and Neon process data outside Nepal. Are consent or other safeguards required?

## Page by page: points to confirm

### Terms of Service (`/tos`)
- Clickwrap acceptance; access continues if a creator stops selling a course (the code keeps access).
- Liability cap: "the amount you paid us in the six months before the claim".
- Suspension and termination wording, including closing accounts without notice for serious breaches.
- The product page says "Access for as long as Chiyali operates" (not "lifetime access") and offers a "Certificate of completion".

### Privacy Policy (`/privacy`)
- Every data category and processor matches the code (email and Google/GitHub sign-in; the Android app; session IP and user agent; instructor phone numbers with only a hash of the OTP; payout bank or wallet details; gateway responses; invoices; progress, certificates and posted content; a session cookie and a 30-day referral cookie; processors eSewa, Khalti, Fonepay, Google, Cloudflare R2, Resend, SMSPasal, GlitchTip, hosting and database).
- No analytics or advertising cookies exist today; **update the policy if analytics are added.**
- Specific retention periods for closed accounts, logs and support tickets.
- Breach notification "as required by law": what does the law require?
- Anyone with a certificate's code can see the holder's name, course and date (the policy says so).

### Refund Policy (`/refund-policy`)
- The rule is the code's (`features/refunds/lib/eligibility.ts`): within 7 days (168 hours) of the order, **and** under 20% of the lessons complete, measured across all courses in a bundle, judged when the request is made.
- Buyers request on the purchase page; an admin approves or rejects at `/admin/refunds` and the buyer is emailed. Approval ends access and reverses the creator's earnings; the money is returned by hand in the gateway dashboard.
- Discretionary refunds wording ("may refund outside these conditions, e.g. materially different from the description").
- Whether to promise a processing time (the draft doesn't).
- Refunds go to the original payment method, for the amount actually paid, and access ends.

### Creator Terms (`/creator-terms`)
- Numbers from the code: a 30% platform fee when the buyer came through the creator's own `?ref=` link within 30 days (last click wins), 50% otherwise; on the amount actually paid after discounts; a bundle's price split equally across its courses; minimum payout NPR 1,000; earnings withdrawable only after the sale's 7-day refund window; a verified mobile number required for payouts; refunded sales deducted even after payout.
- Licence scope granted to Chiyali (hosting, streaming, promotion with previews, titles and the creator's name), and whether it survives after a creator leaves.
- Gateway fees are absorbed by the platform (not deducted from creators): state it?
- Payout timing: promise a service level (e.g. within 7 working days)?
- Notice period for fee changes.
- Any **founding-creator** reduced fee, once decided, must be written here.

### Content Policy (`/content`)
- Publishing requirements match the code: a thumbnail, price, a description of at least 100 characters, at least one course, and a preview lesson. Every course is reviewed by an admin before going on sale; the policy says review isn't an endorsement. Reports go through the Report button.
- The prohibited-content list for Nepal specifically (e.g. leaked exam papers, content involving minors, hate speech).

### DMCA & Takedown Policy (`/dmca`)
- A DMCA-*style* process under the Copyright Act, 2059 and the Electronic Transactions Act, 2063, without claiming US law applies; a plain accuracy statement instead of "under penalty of perjury". Is a stronger declaration needed?
- The 10 working days a complainant has to start proceedings after a counter-notice.
- Whether a designated agent must be named.

### Contact and Legal index (`/contact`, `/legal`)
- Support: support@chiyali.com. Legal, copyright and privacy: legal@chiyali.com. Registered office: Lalitpur Metropolitan City, Ward No. 22, Lalitpur, Nepal.
- Whether a phone number, office hours or a named grievance officer must be listed (decision 2).
