# Echo — Daily Quote Generator

A zen-minimalist iOS reading experience built with **Expo**, **React Native**, and **TypeScript**. Typography-forward, gesture-driven, and designed with generous whitespace to create a calm, tactile paper-like experience.

## Features

- **160 curated quotes** across 8 categories, each with author identity and role
- **Multi-category system** — quotes can have multiple category tags and one primary category for display
- **Smart navigation** — previous/next controls with fade-and-slide animation and an in-memory browsing stack
- **Bookmark & Share** — persist saved quote snapshots and share a quote as text or an image
- **History sheet** — spring-physics bottom sheet showing saved quotes with a delete action
- **Share sheet** — copy text, share as an image, use the system share panel, Twitter, or WhatsApp
- **Dark mode** — light/dark themes with system preference detection and persistence
- **Category preferences** — choose which categories appear in future quote selections
- **Settings** — theme, categories, language placeholder, widgets, notifications, feedback, and about
- **Resilient local storage** — validates stored preferences and saved records before using them

## Design System

| Element    | Value                                          |
| ---------- | ---------------------------------------------- |
| Quote Font | Cormorant Garamond Italic (serif)              |
| UI Font    | System sans-serif (uppercase + letter-spacing) |
| Light BG   | `#E5E0D8` warm beige                           |
| Dark BG    | `#1A1A18` matte black                          |
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

Each quote supports multiple category tags in `categories` and has a `primary_category` used by the home card.

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
  └── personalization → PersonalizationScreen

AsyncStorage
  ├── src/storage/preferences.ts → theme + preferred categories
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
│   │   └── PersonalizationScreen.tsx
│   ├── constants/
│   │   ├── colors.ts                 # Light/dark color tokens
│   │   └── categories.ts             # Category type, values, and colors
│   ├── data/
│   │   └── quotes.ts                 # Quote type, validation, and read-only queries
│   ├── storage/
│   │   ├── preferences.ts            # Theme and category preferences
│   │   └── savedQuotes.ts            # Full saved-quote snapshots
│   └── services/
│       └── notifications.ts          # Local reminder scheduling and quote selection
├── assets/
│   └── quotes.json                   # Single bundled quote content source
├── app.json                          # Expo configuration
├── package.json                      # Dependencies and scripts
└── tsconfig.json                     # TypeScript configuration
```

## Data Storage Architecture

| Data | Source or location | Lifetime | Notes |
| ---- | ------------------ | -------- | ----- |
| Bundled quotes | `assets/quotes.json` | App version | Read-only content; never persisted wholesale |
| Quote queries | `src/data/quotes.ts` | Runtime | Synchronous validated access to bundled content |
| Theme | AsyncStorage key `@echo/theme` | Across restarts | Only `light` or `dark` is accepted |
| Preferred categories | AsyncStorage key `@echo/preferred_categories` | Across restarts | Unknown values are discarded and valid values are deduplicated |
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
- One quote appears once in the single JSON file; `categories` expresses all of its category membership.
- `primary_category` must also appear in the quote's `categories` array.
- User settings never belong in `quotes.json`.
- AsyncStorage stores user-owned settings and saved snapshots, not the complete bundled catalog.

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
| Notifications | `expo-notifications` |
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
