# GTM store texts: Google Play (and later the App Store)

Everything to paste into Play Console for the Chiyali Android app (`com.developerjonas.chiyali`), plus the App Store fields for when iOS comes. The **Data safety** and **content rating** answers come from checking what the app's code actually collects and sends (October 2026). If the app starts collecting something new, update this file first.

Last updated: 2026-10-04. Status: all of this is entered in Play Console (Data safety, content rating, listing, Sign in details except the reviewer password).

> **The one rule to keep in mind (Google Play payments policy):** the app must not point people to an outside payment method for courses. The app has no buy button, and every text here avoids "pay with eSewa/Khalti" and "buy on our website". Keep it that way in screenshots, release notes and replies to reviews too. The website itself can say anything.

---

## 1. Store listing (Grow → Store presence → Main store listing)

**App name** (max 30): `Chiyali: Courses in Nepal` (25)

**Short description** (max 80):
```
Learn from Nepali teachers: Loksewa, entrance prep, languages and tech.
```
(71 characters.) Alternative: `Courses from Nepal's best teachers. Free lessons, QR-verified certificates.` (75)

**Full description** (max 4,000):
```
Chiyali is Nepal's course platform: learn from Nepali teachers, in the subjects that matter here, on your phone.

LEARN WHAT YOU NEED
• Loksewa (PSC) preparation, IOE and CEE entrance prep, EPS-TOPIK and IELTS, programming, design, accounting and Excel, and more
• Courses made by Nepali teachers, in a way that fits how you study
• Free courses and free preview lessons, so you can see the teacher before you start

STUDY ANYWHERE
• Watch video lessons and open PDF notes in the app
• Pick up where you left off: your progress is saved
• Lessons turn to full screen when you rotate your phone
• Ask the teacher questions under each lesson, and read the answers to others' questions

EARN A CERTIFICATE
• Finish a course and get a certificate with your name on it
• Every certificate has a QR code: anyone can scan it in the app or on the website to check it's real
• Share your certificate with employers or on your CV

FIND THE RIGHT COURSE
• Browse by topic or search by name
• Read reviews and ratings from other students
• Save courses to your wishlist for later

YOUR ACCOUNT
• Browse without an account; sign up with your email to study, save courses and ask questions
• Courses on your Chiyali account appear in My learning, on the app and the website alike
• Get help through support tickets right in the app
• Delete your account any time from Account → Delete account

Chiyali works in light and dark mode.

Questions? Write to support@chiyali.com or visit www.chiyali.com.
```
Before pasting, check it: the courses it names should actually be on the site at launch.

**App category:** Education. **Tags** (pick up to 5 in Play Console): Education, Online courses, Exam prep, Language learning, Professional skills.

**Contact details:** email `support@chiyali.com` · website `https://www.chiyali.com` · phone (optional; leave empty unless someone answers it).

**Privacy Policy URL** (Policy → App content → Privacy policy): `https://www.chiyali.com/privacy`

**Graphics**
- App icon: Play uses the 512×512 version of `apps/mobile/assets/images/icon.png` (resize the 1024 one; same design).
- Feature graphic (1024×500): brand blue (#0055ff), the white plane and "Chiyali", and the line *"Learn from Nepal's best teachers."* No payment logos, no prices.
- Phone screenshots (at least 2, ideally 6–8, 9:16, from a real phone or the emulator with real courses). Suggested order and captions:
  1. Home: *"Courses from Nepali teachers"*
  2. Browse by topic: *"Loksewa, entrance, languages, tech and more"*
  3. A course page: *"Watch a free preview first"*
  4. The lesson player: *"Learn on your phone, full screen"*
  5. Lesson Q&A: *"Ask the teacher"*
  6. My learning: *"Pick up where you left off"*
  7. A certificate: *"QR-verified certificates"*
  8. Verify by scanning: *"Anyone can check it's real"*

  Don't show a price-and-pay screen. A course page showing its price is fine; there's no buy button in the app.

**Release notes for the first version** (max 500):
```
The first version of Chiyali for Android: browse courses from Nepali teachers, watch free previews, study your courses with progress saved, ask questions under each lesson, earn QR-verified certificates, and save courses to your wishlist.
```

---

## 2. App access (Policy → App content → App access)

Choose **"All or some functionality is restricted"** and add instructions:

- **Name:** Reviewer account
- **Username / email:** `reviewer@chiyali.com` (or `store_reviewer`)
- **Password:** the one printed by `pnpm reviewer:create --yes` (run in `apps/web` against production; running it again sets a new password)
- **Instructions:**
  ```
  Browsing courses and free preview lessons works without signing in.
  To see the rest: Account → Sign in, with the details above. Then open My learning and the course there: lessons, PDFs, Q&A and certificates are available. The account has access to one course; no purchase is needed or possible in the app.
  ```

## 3. Ads (Policy → App content → Ads)

**No**, the app doesn't contain ads.

## 4. Content rating (Policy → App content → Content rating, IARC questionnaire)

- **Email:** `support@chiyali.com`
- **Category:** *All Other App Types* (the IARC form no longer lists "Reference, News, or Educational"). Then: **Downloaded app:** No ratings-relevant content · **User content sharing:** Yes (text reviews and Q&A; no private messaging, no location sharing) · **Online content:** Yes (courses come from Chiyali's servers, admin-approved, none of the restricted content types).
- **Violence, fear, sexuality, language, controlled substances, crude humour:** No to all. The Content Policy (`/content`) forbids adult, violent and hateful course material, and every course is approved by an admin before going on sale.
- **Gambling or simulated gambling:** No.
- **Does the app allow users to interact or exchange content with each other?** **Yes.** Users post reviews and ask and answer questions under lessons, which others can see. (There's no private messaging between users; support tickets go only to the Chiyali team.)
  - Moderation, if asked: users can report courses, lessons and instructors; admins review the reports, approve every course before it goes on sale, and can hide reviews.
- **Does the app share the user's current physical location with other users?** No.
- **Does the app allow users to purchase digital goods?** **No.** Nothing can be bought in the app.
- **Does the app provide unrestricted internet access, such as a web browser?** **No.** It plays lesson videos (including YouTube/Vimeo videos chosen by teachers) and opens Chiyali's own pages and lesson files.

Expected result: a low age rating (e.g. PEGI 3 / Everyone, or "Users interact"). Accept whatever IARC gives.

## 5. Target audience and content (Policy → App content → Target audience)

- **Target age groups:** **16–17** and **18 and over**. Loksewa, entrance and job-skills learners; not designed for children.
  - Adding 13–15 later (e.g. for SEE courses) is possible, but it brings stricter rules. Don't select anything under 13: that puts the app under Google's Families policy.
- **Could the app unintentionally appeal to children?** No.

## 6. Data safety (Policy → App content → Data safety)

### Overview questions
| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS only) |
| Do you provide a way for users to request that their data is deleted? | **Yes**: in the app (Account → Delete account) and at `https://www.chiyali.com/account/delete` |
| Account creation | The app lets users create an account (username and password); see the Account deletion section below |

**Shared with third parties?** **No** for every type below. The services that process data for Chiyali (hosting and database, email, GlitchTip for crash reports) act on Chiyali's behalf, which Google's definition doesn't count as "sharing". Nothing is sold, and there are no ads or analytics companies.

### Data types collected
Answer each type as below; anything not listed: **not collected**.

| Data type | Collected? | Required or optional | Purposes | Notes |
|---|---|---|---|---|
| **Personal info → Name** | Yes | Optional (the app works without an account; required to sign up) | App functionality, Account management | Shown on the profile, Q&A, reviews and certificates |
| **Personal info → Email address** | Yes | Optional (required to sign up) | App functionality, Account management, Developer communications | Sign-in, password reset, support replies |
| **Personal info → User IDs** | Yes | Optional (required to sign up) | App functionality, Account management | The username, and the account's internal ID |
| **Messages → Other in-app messages** | Yes | Optional | App functionality | Support tickets to the Chiyali team, and content reports |
| **App activity → Other user-generated content** | Yes | Optional | App functionality | Course reviews, Q&A questions and replies |
| **App activity → Other actions** | Yes | Optional | App functionality | Lessons marked complete, wishlist, certificates earned |
| **App activity → In-app search history** | Yes, **processed ephemerally** | Optional | App functionality | The search text is sent to fetch results and not stored; Google doesn't show ephemeral data on the listing |
| **App activity → App interactions** | Yes | Required (automatic) | Analytics | Only inside crash reports: the taps leading up to an error, to find the cause |
| **App info and performance → Crash logs** | Yes | Required (automatic) | Analytics | GlitchTip, from installed builds only |
| **App info and performance → Diagnostics** | Yes | Required (automatic) | Analytics | Device model, OS version, app version, sent with a crash report |
| **Device or other IDs** | Yes | Required (automatic) | Analytics, Fraud prevention/security | A random ID per installation, sent with crash reports (not a hardware or advertising ID); the server also records each sign-in session's IP address and device |

Not collected, so leave unticked: location, financial info (no payments in the app), health, contacts, calendar, photos and videos (the camera only scans QR codes, on the phone; no image is sent or stored), audio, files and docs, web browsing history, installed apps, and advertising ID.

**Ephemeral processing:** for the QR scan, if Play asks, the camera image is processed on the device only and never sent.

Passwords: Play's form has no type for them, so nothing to declare. They're sent over HTTPS at sign-in and stored hashed on the server.

## 7. Account deletion (Policy → App content → Data deletion)

- **Delete account URL:** `https://www.chiyali.com/account/delete`
- **In the app:** Account → Delete account (type DELETE to confirm).
- **What's deleted:** name, email, username, photo, password and sign-in links, sessions, wishlist, course access and progress.
- **What's kept, and why:** purchase, invoice and refund records, as Nepal's tax and accounting law requires. Reviews and Q&A stay, shown as "Deleted user". Certificates already issued stay verifiable.
- **Can users delete some data without deleting the account?** Yes: they can delete their reviews, and remove courses from the wishlist. Other requests go to `legal@chiyali.com`.

## 8. Other declarations (Policy → App content)

| Declaration | Answer |
|---|---|
| News app | No |
| COVID-19 contact tracing or status | No |
| Government app | No |
| Financial features | None (no payments, loans or crypto in the app) |
| Health apps | No |
| Data safety → Families | Not applicable (no under-13 audience) |
| **Permissions → CAMERA** | Used only to scan certificate QR codes (Verify a certificate). Shown to the user as: "Chiyali uses the camera to scan certificate QR codes." |

---

## 9. Later: Apple App Store (when there's an Apple developer account)

- **Name** (30): `Chiyali: Courses in Nepal`
- **Subtitle** (30): `Learn from Nepali teachers` (26)
- **Promotional text** (170): `Free preview lessons, Q&A with the teacher, and certificates anyone can verify with a QR code. Loksewa, entrance prep, languages, tech and more.`
- **Keywords** (100, comma-separated, no spaces after commas): `loksewa,psc,entrance,ioe,cee,eps topik,ielts,nepali,courses,exam prep,certificate,learn,nepal`
- **Description:** the Play full description above works as is.
- **Category:** Education. **Age rating:** answer as in section 4; expect 4+ or 12+ (because of user-generated content).
- **App Privacy ("nutrition labels"):** the same types as section 6.
  - **Contact info:** name, email.
  - **Identifiers:** user ID, device ID.
  - **User content:** customer support, other user content.
  - **Usage data:** product interaction.
  - **Diagnostics:** crash data, other diagnostic data.
  - All "not used for tracking"; all linked to the user except the crash data.
- **Sign in with Apple:** not required while the app only offers email/username sign-in. If Google sign-in is added to the iOS app, Apple then requires Sign in with Apple too.
- **Payments (App Review guideline 3.1):** no buy button or "buy on the website" wording in the iOS app. It may show courses the user already has.
- **Review notes:** the same reviewer account as section 2.
