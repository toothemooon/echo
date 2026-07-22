# ECHO — Daily Quote Experience

A zen-minimalist iOS reading experience built with **Expo**, **React Native**, and **TypeScript**. Typography-forward, gesture-driven, and designed with generous whitespace to create a calm, tactile paper-like experience.

## Features

- **1,285 TestFlight-ready bundled quotes** across 8 current top-level categories, selected from a preserved 3,014-record working catalog
- **Attribution display** — quote, author, specific identity or work source when available
- **Smart navigation** — previous/next controls with fade-and-slide animation and an in-memory browsing stack
- **Bookmark & Share** — persist saved quote snapshots and share a quote as text or an image
- **History sheet** — spring-physics bottom sheet showing saved quotes with a delete action
- **Share sheet** — copy text, share as an image, use the system share panel, Twitter, or WhatsApp
- **Three themes** — Light, Dark, and textured Archive themes with persistence
- **Quote transition preference** — Fade, Horizontal, or None
- **Category preferences** — choose which categories appear in future quote selections
- **Settings** — theme, quote appearance, animation, preferences, feedback, and legal information; App sharing is hidden until a real App Store URL exists
- **Resilient local storage** — validates stored preferences and saved records before using them

## Design System

| Element    | Value                                          |
| ---------- | ---------------------------------------------- |
| Quote Font | Cormorant Garamond Italic (serif)              |
| UI Font    | System sans-serif (uppercase + letter-spacing) |
| Light BG   | `#E5E0D8` warm beige                           |
| Dark BG    | `#1A1A18` matte black                          |
| Archive BG | Aged-paper texture with sepia ink tokens       |
| Accent     | `#8FAE8B` sage green                           |

## 8 Categories

| Category    | Color     |
| ----------- | --------- |
| Mindfulness | `#8FAE8B` |
| Wisdom      | `#C9A96E` |
| Courage     | `#A0B4C8` |
| Love        | `#D4A0A0` |
| Nature      | `#7BA88E` |
| Growth      | `#B8A8C8` |
| Healing     | `#A8C5B8` |
| Gratitude   | `#C8B89A` |

The current JSON still supports multiple tags in `categories`. The MVP content
migration described below will replace this with exactly one
`primary_category` and one `subcategory` per quote.

## Architecture

### Application and Data Flow

```text
assets/quotes.json (bundled, read-only content)
  │
  ▼
src/data/quotes.ts (validation + synchronous lookup/filter/random selection)
  │
  ▼
src/app/index.tsx (runtime State + conditional page rendering)
  │
  ├── home → Header, QuoteCard, ActionBar, HistorySheet, ShareSheet
  ├── settings → SettingsScreen
  ├── theme → ThemeScreen
  ├── quote settings → QuoteSettingsScreen
  ├── animation settings → AnimationSettingsScreen
  └── preferences (current category UI) → PersonalizationScreen

AsyncStorage
  ├── src/storage/preferences.ts → theme + quote appearance + animation + preferences
  └── src/storage/savedQuotes.ts → complete saved quote snapshots
          │
          └── restored into index.tsx State for immediate UI updates
```

- `assets/quotes.json` is the single source of bundled quote content. It is not copied into another local store.
- `src/data/quotes.ts` validates the JSON and exposes synchronous read operations such as ID lookup, category filtering, and random selection.
- `src/app/index.tsx` owns runtime State, conditionally renders pages, and passes data and callbacks through props.
- Screens and components remain presentation-focused and do not access persistence directly.
- Navigation uses the `currentPage` State; the app does not use `router.push` for these pages.
- The previous/next browsing stack (`quoteHistory` and `historyIndex`) is runtime-only and resets when the app restarts.
- `HistorySheet` is the saved-quotes collection despite its UI name; it is not the runtime browsing stack.

### Coding Convention — Props

```tsx
type Props = {
  colors: (typeof COLORS)["light"];
  isDark: boolean;
  onBack: () => void;
};

export default function ThemeScreen(props: Props) {
  const currentTheme = props.isDark ? "dark" : "light";
  return (
    <View style={{ backgroundColor: props.colors.background }}> ... </View>
  );
}
```

Key rules:

- Props types are always named `Props`.
- Component parameters use `props: Props` without parameter destructuring.
- Components access values as `props.xxx` inside the function body.

## Project Structure

```text
ECHO/
├── src/
│   ├── app/
│   │   ├── _layout.tsx               # Root Stack (headerShown: false)
│   │   └── index.tsx                 # All runtime State + conditional rendering
│   ├── components/home/
│   │   ├── Header.tsx                # Date, theme toggle, and menu
│   │   ├── QuoteCard.tsx             # Primary category, quote, author, and role
│   │   ├── ActionBar.tsx             # Navigation, bookmark, share, and collection
│   │   ├── HistorySheet.tsx          # Saved-quotes bottom sheet
│   │   ├── ShareSheet.tsx            # Sharing options bottom sheet
│   │   └── ShareCard.tsx             # Offscreen image-share card
│   ├── screens/
│   │   ├── SettingsScreen.tsx
│   │   ├── ThemeScreen.tsx
│   │   ├── QuoteSettingsScreen.tsx
│   │   ├── AnimationSettingsScreen.tsx
│   │   └── PersonalizationScreen.tsx
│   ├── constants/
│   │   ├── colors.ts                 # Light/dark/archive color tokens
│   │   └── categories.ts             # Category type, values, and colors
│   ├── data/
│   │   └── quotes.ts                 # Quote type, validation, and read-only queries
│   ├── storage/
│   │   ├── preferences.ts            # Theme and category preferences
│   │   └── savedQuotes.ts            # Full saved-quote snapshots
├── assets/
│   ├── quotes.json                   # Single bundled quote content source
│   └── archive-paper-texture.jpg      # Archive theme texture
├── app.json                          # Expo configuration
├── package.json                      # Dependencies and scripts
└── tsconfig.json                     # TypeScript configuration
```

## Data Storage Architecture

| Data | Source or location | Lifetime | Notes |
| ---- | ------------------ | -------- | ----- |
| Bundled quotes | `assets/quotes.json` | App version | Read-only content; never persisted wholesale |
| Quote queries | `src/data/quotes.ts` | Runtime | Synchronous validated access to bundled content |
| Theme | AsyncStorage key `@echo/theme` | Across restarts | `light`, `dark`, or `archive` |
| Preferred categories | AsyncStorage key `@echo/preferred_categories` | Across restarts | Unknown values are discarded and valid values are deduplicated |
| Quote font and size | AsyncStorage | Across restarts | Controls quote typography |
| Quote animation | AsyncStorage key `@echo/quote_animation` | Across restarts | `fade`, `horizontal`, or `none` |
| Saved quotes | AsyncStorage key `@echo/saved_quotes` | Across restarts | Each record contains a full quote snapshot plus `savedAt` |
| Current page and sheet state | React State | Current session | Drives navigation and bottom-sheet visibility |
| Browsing stack and position | React State | Current session | Used only by previous/next navigation |

A saved record has this shape:

```ts
type SavedQuoteRecord = {
  quote: Quote;
  savedAt: string;
};
```

Saving the complete quote keeps an existing bookmark readable even if a later app release removes or replaces that quote in `quotes.json`. Stored records are validated during reads, duplicate quote IDs are prevented, and results are ordered from newest to oldest. Invalid local data falls back safely without crashing the app.

### Content Rules

- Quote IDs are permanent and must never be reassigned or reused, including IDs removed in a later release.
- New quotes receive IDs that have never appeared before.
- One quote appears once in the single JSON file.
- Target MVP schema: exactly one `primary_category` and one `subcategory` per quote.
- User settings never belong in `quotes.json`.
- AsyncStorage stores user-owned settings and saved snapshots, not the complete bundled catalog.

## MVP Product and Content Plan

This section describes the agreed product direction. Items here are plans until
their implementation and validation are complete.

### Product Principle

ECHO should learn what kind of support a person needs without asking them to
understand or manage a taxonomy. Categories and subcategories are internal
recommendation metadata, not the primary user interface.

The MVP therefore uses:

- a short wellbeing question on first launch;
- automatic preference generation from the answer;
- the same questionnaire under **Settings → Preferences**;
- no direct grid of 8 categories or 40 subcategories in the final preference UI;
- no advertising, purchase, notification, widget, account, or cloud-sync work
  until the existing reading experience and content quality are ready.

### First-Launch Preference Question

The first launch should ask one calm, non-clinical question:

> How have you been feeling lately?

Suggested answers and internal recommendation weights:

| User-facing answer | Primary recommendations | Secondary recommendations |
| --- | --- | --- |
| I feel overwhelmed | MINDFULNESS / INNER_PEACE | HEALING / REST |
| I need clarity | WISDOM / PERSPECTIVE | MINDFULNESS / AWARENESS |
| I am facing a challenge | COURAGE / RESILIENCE | GROWTH / DISCIPLINE |
| I feel disconnected | LOVE / COMPASSION | HEALING / HOPE |
| I feel stuck | GROWTH / CHANGE | COURAGE / RISK |
| I need quiet | MINDFULNESS / STILLNESS | NATURE / WILDERNESS |
| I am ready to grow | GROWTH / LEARNING | COURAGE / LEADERSHIP |
| I feel grateful | GRATITUDE / APPRECIATION | LOVE / COMPASSION |
| Surprise me | Balanced rotation across all categories | Balanced subcategory rotation |

The answer is a preference signal, not a diagnosis. Copy must not claim to
treat anxiety, grief, depression, or another health condition. The user can
skip the question and can change the answer later.

The stored preference should represent weighted interests rather than a list
of manually selected labels. A future shape can be:

```ts
type PreferenceProfile = {
  mood: string;
  categoryWeights: Partial<Record<Category, number>>;
  updatedAt: string;
};
```

The Settings row should be renamed from **Categories** to **Preferences**. Its
summary should describe the selected intention, such as `Calm & Clarity`,
instead of displaying `5 Selected`. Opening it should reuse the first-launch
questionnaire and include a reset option.

### Recommendation Rotation

Quote selection should be a constrained rotation rather than unrestricted
random choice. For each next quote:

1. Exclude recently displayed quote IDs.
2. Exclude authors shown in the previous 5 quotes.
3. Exclude every author already shown during the current local calendar day.
4. Select the next preferred top-level category using weighted round-robin.
5. Within that category, prefer the least recently served subcategory.
6. Randomly select from the remaining eligible quotes.

The daily author rule has higher priority than category balance. If a narrow
pool is exhausted, relax the subcategory balance first, then category balance;
do not immediately repeat a recent quote or author. Persist the local date and
authors shown that day so restarting the app does not reset the daily limit.

### Canonical Quote Taxonomy

Every quote should have exactly one top-level category and one subcategory.

| Primary category | Five subcategories |
| --- | --- |
| MINDFULNESS | PRESENCE, AWARENESS, MEDITATION, STILLNESS, INNER_PEACE |
| WISDOM | PHILOSOPHY, TRUTH, PERSPECTIVE, JUDGMENT, SELF_KNOWLEDGE |
| COURAGE | BRAVERY, RESILIENCE, RISK, ADVERSITY, LEADERSHIP |
| LOVE | ROMANTIC_LOVE, FAMILY, FRIENDSHIP, COMPASSION, SELF_LOVE |
| NATURE | WILDERNESS, SEASONS, ANIMALS, OCEAN, COSMOS |
| GROWTH | LEARNING, DISCIPLINE, CHANGE, AMBITION, CREATIVITY |
| HEALING | GRIEF, FORGIVENESS, RECOVERY, HOPE, REST |
| GRATITUDE | APPRECIATION, CONTENTMENT, JOY, HUMILITY, ABUNDANCE |

Classification is based on the quote's central meaning, not isolated keywords.
Natural imagery used only as a metaphor does not automatically make a quote
`NATURE`. `WISDOM / PERSPECTIVE` is a fallback for genuine general reflection,
not a bucket for every ambiguous result. Category counts must not be made equal
by assigning inaccurate labels.

Target quote shape:

```json
{
  "id": 1,
  "text": "The road of excess leads to the palace of wisdom.",
  "author_id": "william_blake",
  "author": "William Blake",
  "role": "English Romantic poet, painter and printmaker",
  "source": "The Marriage of Heaven and Hell",
  "primary_category": "WISDOM",
  "subcategory": "PHILOSOPHY"
}
```

### Author and Attribution Standardization

Create a canonical author registry during content migration. Each author has a
stable ID, canonical display name, aliases, and a specific identity. Quotes use
`author_id` so spelling variants do not create multiple people.

```json
{
  "id": "william_blake",
  "canonical_name": "William Blake",
  "aliases": ["W. Blake"],
  "role": "English Romantic poet, painter and printmaker",
  "nationality": "English",
  "era": "Romantic era"
}
```

Rules:

- normalize whitespace, capitalization, punctuation, initials, and diacritics;
- merge aliases only after confirming they identify the same person;
- use a specific identity instead of `Writer`, `Author`, or `Famous writer`;
- keep author identity and work source in separate fields;
- store `source: null` when a work cannot be verified rather than guessing;
- keep provider names and verification URLs in an internal audit file, never
  in the quote card or public JSON attribution;
- prefer a smaller verified launch catalog over a larger uncertain catalog;
- preserve permanent quote IDs during cleanup and never reuse removed IDs.

### Content Migration Quality Gates

Before replacing the current quote schema:

1. Preserve a read-only copy of the imported raw text.
2. Normalize authors and detect exact and punctuation-insensitive duplicates.
3. Verify author attribution and work source independently.
4. Assign one primary category and one subcategory from the fixed taxonomy.
5. Send ambiguous attribution and low-confidence classifications to manual
   review instead of silently guessing.
6. Check author concentration, category distribution, long-text rendering, and
   source coverage.
7. Update the TypeScript `Quote` model and category query functions in the same
   change as the JSON migration.

### MVP Completion Priorities

#### P0 — Required before store submission

- Curate and verify a reliable launch quote catalog.
- Implement preference-question onboarding and the Preferences settings entry.
- Implement author cooldown, daily author limits, category rotation, and
  subcategory balancing.
- Test the longest quotes with Large quote size on the smallest supported
  screen; avoid clipping author and source attribution.
- Add accessibility labels, adequate touch targets, theme contrast checks, and
  automatic respect for the operating system's Reduce Motion preference.
- Restore the hidden Share App entry only after replacing it with the real App Store URL. Privacy Policy and Terms of Service already use live website URLs.
- Test persistence for theme, font, size, animation, preference profile, and
  bookmarks across a cold app restart.

#### P1 — Valuable if P0 is stable

- Improve the empty and removal states in the saved-quote History sheet.
- Make shared quote cards consistently reflect theme, font, author, and work.
- Add a lightweight first-run explanation of bookmark and preference controls.
- Complete physical-device testing and TestFlight feedback before submission.

#### Post-MVP

- Advertising and one-time purchase
- Notifications and widgets
- Accounts and cloud synchronization
- User-facing subcategory controls
- Advanced search and social features

## TestFlight MVP Readiness and Manual Release Runbook

Last reviewed: July 23, 2026.

This section records the local TestFlight preparation already completed and the
remaining account-dependent steps that must be performed manually. The current
working tree has not yet been committed, uploaded to Expo, or submitted to
Apple.

### Completed Local Changes

#### Application identity and release configuration

- The permanent iOS Bundle ID is `yachts.sarada.echo`.
- The Android package is also `yachts.sarada.echo` for cross-platform
  consistency.
- The public version remains `1.0.0`.
- The initial iOS build number is `1`; the Android version code is `1`.
- `eas.json` uses remote app-version management and automatically increments
  production build numbers.
- iPad support is disabled for the first MVP because the current interface has
  only been designed and checked as an iPhone portrait experience.
- `usesNonExemptEncryption` is set to `false`. This is appropriate only while
  ECHO uses no custom or non-exempt encryption. Re-evaluate it whenever a new
  security, networking, account, analytics, or cloud SDK is introduced.

#### Store-completeness and link changes

- The fake App Store URL ending in `id0000000000` was removed.
- The **Share App** settings row is hidden until Apple assigns the real App
  Store ID.
- Privacy Policy opens
  `https://sarada.yachts/projects/echo/privacy`.
- Terms of Service opens
  `https://sarada.yachts/projects/echo/terms`.
- Feedback continues to use `abc510433622@gmail.com`.
- Twitter and WhatsApp sharing now falls back to the system share sheet when
  the external destination cannot be opened.
- The current MVP includes no advertising, in-app purchase, subscription,
  paywall, notification, widget, account, or cloud-sync implementation.

#### Quote-content risk reduction

- The original working catalog contained 3,014 records.
- The TestFlight bundle now publishes 1,285 records from 186 authors.
- The published collection contains no empty author, `Unknown` author, empty
  role, generic `Writer`/`Author`/`Poet`/`Philosopher` role, or
  punctuation-insensitive duplicate text.
- The longest published quote is 247 characters.
- Ninety-seven published records currently have a verified work-level
  `source`. Missing work sources are left absent rather than guessed.
- The other 1,729 records are preserved in
  `data/quote-audit/quotes-unverified.json`; they were not permanently deleted.
- `quotes_remaining_all.txt` and the
  `asuender/motivational-quotes` dataset URL are internal provenance. The
  provider name must not be displayed as though it were a book or literary
  work source.
- Run `node scripts/prepare-mvp-quotes.mjs` to reproduce the same selection and
  update the audit report.

#### Checks already passed

```text
expo-doctor: 20/20 checks passed
TypeScript: npx tsc --noEmit passed
iOS Metro production export: passed (1,224 modules)
Quote validation: 1,285 published / 0 duplicates / 0 generic roles
Placeholder scan: no anonymous Bundle ID or fake App Store ID remains
```

The production export confirms that JavaScript and assets can be bundled. It
does not replace a signed EAS production build installed through TestFlight on
a physical iPhone.

### Before Starting the Manual Release

Prepare the following without posting credentials in an issue, commit, chat,
or screenshot:

1. An Expo account at <https://expo.dev/>.
2. An active Apple Developer Program membership.
3. An Apple Account with access to App Store Connect.
4. A trusted phone or device for Apple two-factor authentication.
5. Authority to accept any pending Apple agreements.
6. The Apple Account email addresses of people who will be internal testers.

Use the repository directory for every terminal command:

```bash
cd /Users/allen/Documents/GitHub/echo/ECHO
```

Do not send anyone the Expo password, Apple password, two-factor code,
recovery code, distribution certificate, `.p8` API key, private key, or
app-specific password.

### Step 1 — Review and Preserve the Local Working Tree

Check exactly what will be uploaded:

```bash
git status --short
git diff --check
git diff -- app.json eas.json src/screens/SettingsScreen.tsx src/components/home/ShareSheet.tsx
```

Also review:

```text
assets/quotes.json
data/quote-audit/mvp-audit-report.json
docs/TESTFLIGHT_SUBMISSION.md
```

Commit only after the diff is understood. A suggested commit sequence is:

```bash
git add app.json eas.json assets/quotes.json src/screens/SettingsScreen.tsx src/components/home/ShareSheet.tsx scripts/prepare-mvp-quotes.mjs data/quote-audit docs/TESTFLIGHT_SUBMISSION.md README.md
git commit -m "Prepare ECHO MVP for TestFlight"
```

Committing is not an Apple requirement, but it creates a recoverable snapshot
of the exact build sent to testers.

### Step 2 — Sign In to Expo/EAS

Run:

```bash
npx eas-cli login
npx eas-cli whoami
```

Enter Expo credentials only in the local terminal or official browser page.
Success means `whoami` prints the expected Expo username instead of
`Not logged in`.

If this is the first EAS project for the repository, associate it with the
Expo account:

```bash
npx eas-cli init
```

Confirm creation of a new EAS project when prompted. This normally adds an
EAS `projectId` under `expo.extra.eas` in the Expo configuration. Review and
commit that generated change before building.

If EAS offers to change the Bundle ID, decline and keep
`yachts.sarada.echo`. Stop if the identifier is already owned by an unrelated
Apple Developer team; do not silently substitute another identifier after an
App Store Connect record or build has been created.

### Step 3 — Verify Apple Developer Access

Open <https://developer.apple.com/account/> and confirm:

1. The Apple Developer Program membership is active.
2. There are no pending agreements blocking distribution.
3. The correct Team is selected if the Apple Account belongs to multiple
   teams.
4. The account has permission to create identifiers, certificates, and
   provisioning profiles.

EAS can register the explicit App ID and manage signing during the first
production build. If automatic registration fails, create an explicit App ID
under **Certificates, Identifiers & Profiles → Identifiers** with Bundle ID
`yachts.sarada.echo`, then retry the build.

Do not enable Push Notifications, In-App Purchase, App Groups, iCloud, or other
capabilities that the MVP does not use.

### Step 4 — Create the App Store Connect App Record

Open <https://appstoreconnect.apple.com/>, then:

1. Choose **My Apps**.
2. Press **+ → New App**.
3. Select **iOS**.
4. Enter the name `ECHO`. If the storefront name is unavailable, choose a
   user-facing alternative without changing the Bundle ID.
5. Set the primary language to **English (U.S.)**.
6. Select Bundle ID `yachts.sarada.echo`.
7. Enter SKU `echo-ios-2026`.
8. Choose the access level appropriate for the development team.
9. Create the app.

The Bundle ID and SKU should be treated as permanent after the record and first
build exist. Record the numeric Apple ID shown in **App Information**; it will
later form the real App Store URL.

Suggested metadata:

| Field | Value |
| --- | --- |
| Primary category | Lifestyle |
| Privacy Policy URL | `https://sarada.yachts/projects/echo/privacy` |
| Support URL | `https://sarada.yachts/projects/echo` |
| Marketing URL | `https://sarada.yachts/projects/echo` |
| Feedback email | `abc510433622@gmail.com` |

The Support URL must remain publicly reachable and contain a practical way to
contact the developer.

### Step 5 — Create the Signed Production Build

Run:

```bash
npx eas-cli build --platform ios --profile production
```

During the first build:

1. Confirm the intended Expo account and EAS project.
2. If remote versioning asks for an initial value, use build number `1`.
3. Choose the correct Apple Developer Team.
4. Allow EAS to create or reuse the iOS Distribution Certificate and App Store
   provisioning profile unless there is an existing credential policy that
   requires manual management.
5. Complete Apple two-factor authentication locally when requested.
6. Save the EAS build URL printed by the command.

Never create multiple builds merely because the queue is slow. Check the build
URL first. A successful result must say **Finished** and provide a downloadable
`.ipa` or submission option. A simulator build is not acceptable for
TestFlight.

For later builds, leave `version` at `1.0.0` while testing this release. The
production profile automatically increments the internal build number.

### Step 6 — Create or Verify App Store Connect API Access

EAS Submit may authenticate through the Apple Account or an App Store Connect
API key. An API key is preferable for repeatable submissions.

To create one manually in App Store Connect:

1. Open **Users and Access → Integrations → App Store Connect API**.
2. Request or enable API access if it is not already available.
3. Create a key with the minimum role needed to upload builds, normally
   **Developer** or **App Manager** depending on the team workflow.
4. Download the `.p8` key once and store it securely.
5. Record its Key ID and Issuer ID.

The `.p8` file cannot be downloaded again. Never add it to Git. If EAS offers
to manage a key securely and the account policy allows that, follow the EAS
prompt instead of copying the key into the repository.

### Step 7 — Submit the Latest Build to App Store Connect

After the production build finishes, run:

```bash
npx eas-cli submit --platform ios --profile production --latest
```

Select the ECHO App Store Connect record when prompted. If EAS asks for the
App Store Connect App ID, enter the numeric Apple ID from **App Information**,
not the Bundle ID and not the SKU.

Success means EAS reports that the upload was delivered to App Store Connect.
It does not mean Apple has finished processing it. Processing commonly takes
several minutes. Monitor **App Store Connect → ECHO → TestFlight** and wait for
the build to leave the processing state.

Because `usesNonExemptEncryption` is currently `false`, App Store Connect
should not require recurring export-compliance documentation. If Apple still
asks an encryption question, answer according to the actual binary and do not
guess. Stop and investigate before claiming an exemption that does not match
the app.

### Step 8 — Complete TestFlight Test Information

In **App Store Connect → ECHO → TestFlight → Test Information**, enter:

**Beta App Description**

> ECHO is an offline-first daily quote experience with personalized categories,
> three visual themes, typography controls, bookmarks, history, and shareable
> quote cards. No account, subscription, advertising, notification permission,
> or payment is required.

**What to Test**

> Please test first launch, quote navigation, category preferences,
> Light/Dark/Archive themes, font and animation settings, bookmarks, history,
> quote sharing, and persistence after restarting the app. Please report
> incorrect quote attribution, layout issues with long quotes, broken links,
> or crashes.

**Feedback Email**

```text
abc510433622@gmail.com
```

Use the following Beta App Review notes:

> ECHO does not require an account or demo credentials. Published quote content
> is bundled with the app and works offline. Preferences and bookmarks are
> stored locally. The build contains no ads, in-app purchases, subscriptions,
> notifications, widgets, account system, or paywall. Internet access occurs
> only when the user explicitly opens a legal page, email client, or external
> sharing destination. Privacy Policy and Terms of Service are available under
> Settings > About. Share App is intentionally hidden until a real App Store
> URL exists.

The same copy is preserved in `docs/TESTFLIGHT_SUBMISSION.md`.

### Step 9 — Configure App Privacy

Open **App Store Connect → ECHO → App Privacy**:

1. Enter the Privacy Policy URL.
2. Select **No, we do not collect data from this app** for the current build.
3. Confirm tracking is not used.
4. Publish the privacy response when App Store Connect allows it.

This answer is based on the current code: there is no analytics SDK, advertising
SDK, account backend, crash-reporting service, or cloud sync. System TestFlight
metrics and a user intentionally opening their email application do not mean
that ECHO itself silently collects an in-app profile.

Reassess the answer before every future submission. Adding analytics, crash
reporting, an account, cloud sync, remote notifications, advertising, or a
server endpoint can change the required disclosure.

### Step 10 — Start with Internal Testing

Internal testers must first be App Store Connect users; an arbitrary email
address is not enough.

1. Open **Users and Access**.
2. Invite each internal tester with the minimum suitable role.
3. Return to **ECHO → TestFlight**.
4. Under **Internal Testing**, create a group such as `ECHO Internal`.
5. Add the processed build.
6. Add the internal App Store Connect users to the group.
7. Enter the **What to Test** text for the build.
8. Enable automatic distribution only if every future uploaded build should go
   directly to this group.

Internal testing should cover at least:

- a physical small-screen iPhone and a current large-screen iPhone;
- cold launch, force quit, and relaunch;
- airplane-mode reading;
- Light, Dark, and Archive themes;
- font, size, animation, and preference persistence;
- previous/next navigation and author repetition;
- bookmark creation, removal, and empty History;
- text sharing, image sharing, cancellation, and missing WhatsApp;
- Privacy Policy, Terms of Service, and feedback email;
- the longest published quote with Large text;
- VoiceOver focus, touch targets, contrast, and Reduce Motion behavior.

Record each issue with build number, device model, iOS version, reproduction
steps, expected result, actual result, and screenshot when useful.

### Step 11 — Upload a Corrected Internal Build

After fixes pass local checks, create another production build:

```bash
npx expo-doctor
npx tsc --noEmit
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production --latest
```

Do not manually reuse build number `1`. Remote version management and
`autoIncrement` should create build `2`, then `3`, and so on. Verify the number
on the EAS build page and again in App Store Connect.

### Step 12 — Request External TestFlight Review

Only proceed after the internal build has no known crash or blocking issue.

1. In **ECHO → TestFlight**, create an external group such as
   `ECHO External Beta`.
2. Select the internally verified build.
3. Confirm Beta App Description, What to Test, feedback email, privacy URL, and
   review notes are complete.
4. Confirm there are no placeholder links, dormant purchase controls, hidden
   paywall, required login, or unavailable backend.
5. Submit the build for TestFlight App Review.
6. Wait for approval before inviting external testers or enabling a public
   link.
7. After approval, add tester emails or configure a limited public link.

The first build distributed to external testers normally requires Beta App
Review. Later builds may be approved faster, but significant changes can be
reviewed again. TestFlight builds expire after 90 days.

### Step 13 — Restore Share App Only After the Store URL Exists

After Apple assigns the numeric App ID, the eventual URL has this form:

```text
https://apps.apple.com/app/idAPPLE_NUMERIC_ID
```

Do not restore **Share App** merely because the App Store Connect record exists.
Restore it when the link opens a useful public destination—for example, after
the public App Store listing is available. TestFlight invitations should be
shared through TestFlight groups or an approved public TestFlight link instead.

### Common Blocking Conditions

| Symptom | Check |
| --- | --- |
| `Not logged in` | Run `npx eas-cli login`, then verify with `npx eas-cli whoami`. |
| Bundle ID unavailable | Confirm the correct Apple Team and whether `yachts.sarada.echo` is already registered. |
| Apple agreements pending | Open App Store Connect and Apple Developer account pages as Account Holder. |
| Build cannot sign | Confirm Distribution Certificate and App Store provisioning-profile access. |
| Submit cannot find the app | Create the App Store Connect record and use its numeric Apple ID. |
| Build remains processing | Wait, inspect App Store Connect email, and check for Invalid Binary or compliance requests. |
| Export-compliance prompt | Reconfirm actual encryption use and the generated Info.plist; do not answer automatically. |
| External group cannot test | Complete Test Information and submit the first external build for Beta App Review. |

### Official References

- Apple TestFlight overview:
  <https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview>
- Apple TestFlight test information:
  <https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information>
- Apple App Review Guidelines:
  <https://developer.apple.com/app-store/review/guidelines/>
- Apple App Privacy:
  <https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/>
- Apple Export Compliance:
  <https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance>
- Expo EAS iOS production build:
  <https://docs.expo.dev/tutorial/eas/ios-production-build/>
- Expo app-version management:
  <https://docs.expo.dev/build-reference/app-versions/>

## Startup and Bookmark Flows

On startup, `index.tsx` restores the theme, preferred categories, and saved quote records from AsyncStorage. It reads bundled quotes synchronously through `src/data/quotes.ts`, selects the first eligible quote, initializes runtime navigation State, and renders once fonts and app initialization are ready.

When a bookmark is added, the app writes the complete current `Quote` with an ISO timestamp, then updates the in-memory saved list so the UI responds immediately. Removing a bookmark filters only the matching ID in persistent storage and State. The collection is restored on the next launch independently of the current bundled catalog.

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Expo SDK 57 |
| UI | React 19 / React Native 0.86 |
| Language and content access | TypeScript + bundled JSON |
| User persistence | `@react-native-async-storage/async-storage` |
| Image sharing | `react-native-view-shot` |
| Clipboard | `expo-clipboard` |
| Linking | `expo-linking` |
| Icons | `@expo/vector-icons` (Ionicons) |
| Animations | React Native Animated API |

## Getting Started

```bash
cd ECHO
npm install
npx expo prebuild --clean
npx expo run:ios
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm start` | Start the Expo development server |
| `npm run ios` | Build and run on iOS |
| `npm run android` | Build and run on Android |
| `npm run web` | Start the web target |

## License

See [LICENSE](./LICENSE) for details.
