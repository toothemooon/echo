# ECHO — Daily Quote Experience

A zen-minimalist iOS reading experience built with **Expo**, **React Native**, and **TypeScript**. Typography-forward, gesture-driven, and designed with generous whitespace to create a calm, tactile paper-like experience.

## Features

- **3,014 bundled quotes** across 8 current top-level categories
- **Attribution display** — quote, author, specific identity or work source when available
- **Smart navigation** — previous/next controls with fade-and-slide animation and an in-memory browsing stack
- **Bookmark & Share** — persist saved quote snapshots and share a quote as text or an image
- **History sheet** — spring-physics bottom sheet showing saved quotes with a delete action
- **Share sheet** — copy text, share as an image, use the system share panel, Twitter, or WhatsApp
- **Three themes** — Light, Dark, and textured Archive themes with persistence
- **Quote transition preference** — Fade, Horizontal, or None
- **Category preferences** — choose which categories appear in future quote selections
- **Settings** — theme, quote appearance, animation, preferences, feedback, sharing, and about
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
- Replace placeholder App Store, privacy-policy, and terms URLs with live URLs.
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
