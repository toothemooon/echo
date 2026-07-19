# Echo — Daily Quote Generator

A zen-minimalist iOS reading experience built with **Expo**, **React Native**, and **SQLite**. Typography-forward, gesture-driven, and designed with generous whitespace to create a calm, tactile paper-like experience.

## Features

- **160 curated quotes** across 8 categories, each with author identity and role
- **Multi-category system** — quotes tagged with multiple categories, one primary for display
- **Smart navigation** — left/right arrows with fade+slide animation, browse history stack
- **Bookmark & Share** — save quotes to collection (persisted in SQLite), share as text or image
- **History sheet** — spring-physics bottom sheet showing saved quotes with delete button
- **Share sheet** — copy text, share as image, share via system panel, Twitter, WhatsApp
- **Dark mode** — full light/dark theme with system preference detection + persistence
- **Category preferences** — choose which categories appear in your daily quotes
- **Settings** — preference (theme + categories + language), widgets, notifications, feedback, about
- **SQLite storage** — on-device database with auto-sync from bundled JSON on every launch

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

Each quote supports **multiple category tags** and has a **primary category** for home display.

## Architecture

### Data Flow

```
index.tsx (持有全部 State)
  │
  ├──→ currentPage === "home"
  │      → Header, QuoteCard, ActionBar, HistorySheet, ShareSheet
  │
  ├──→ currentPage === "settings"
  │      → SettingsScreen (props: colors, isDark, onBack, onOpenTheme, ...)
  │
  ├──→ currentPage === "theme"
  │      → ThemeScreen (props: colors, isDark, onToggleTheme, onBack)
  │
  └──→ currentPage === "personalization"
         → PersonalizationScreen (props: colors, preferredCategories, ...)
```

- **index.tsx** holds all State, conditionally renders pages, passes props down
- **Screens** receive props from index.tsx, render UI
- **Components** receive props from index.tsx or screens, call callback props
- **No Context, no router.push** — navigation via `currentPage` State

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

- Props type is always named `Props` (not `ThemeScreenProps`, `HeaderProps`, etc.)
- Component function takes `props: Props` — **no destructuring** in parameters
- All prop access uses `props.xxx` explicitly inside the component body

## Project Structure

```
ECHO/
├── src/
│   ├── app/
│   │   ├── _layout.tsx              # Root Stack (headerShown: false)
│   │   └── index.tsx                # ⭐ All State + conditional rendering
│   ├── components/
│   │   └── home/                    # Home page components
│   │       ├── Header.tsx           # TODAY + date + theme toggle + menu
│   │       ├── QuoteCard.tsx        # Category + guillemet + quote + author
│   │       ├── ActionBar.tsx        # Nav + bookmark + share + history
│   │       ├── HistorySheet.tsx     # Bottom sheet: saved quotes
│   │       ├── ShareSheet.tsx       # Bottom sheet: share options
│   │       └── ShareCard.tsx        # Offscreen card for image capture
│   ├── screens/
│   │   ├── SettingsScreen.tsx       # Settings (Preference/Widgets/Notifications/Feedback/About)
│   │   ├── ThemeScreen.tsx          # Light/Dark theme selector
│   │   └── PersonalizationScreen.tsx # Category preference picker
│   ├── constants/
│   │   ├── colors.ts                # Light/dark color tokens (15 tokens each)
│   │   └── categories.ts            # 8 categories + color mapping
│   └── database/
│       ├── database.ts              # SQLite init + schema
│       ├── quotes.ts                # CRUD + random queries + saved quotes
│       ├── seed.ts                  # JSON → SQLite sync on launch
│       └── preferences.ts           # AsyncStorage: categories, theme
├── assets/
│   └── quotes.json                  # 160 quotes with roles + multi-categories
├── app.json                         # Expo config
├── package.json                     # Dependencies
└── tsconfig.json
```

## Database Architecture

### Schema

```sql
CREATE TABLE quotes (
  id               INTEGER PRIMARY KEY,
  text             TEXT NOT NULL,
  author           TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT '',
  primary_category TEXT NOT NULL,
  created_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE quote_categories (
  quote_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  PRIMARY KEY (quote_id, category),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE TABLE saved_quotes (
  quote_id INTEGER PRIMARY KEY,
  saved_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);
```

### Sync Strategy

| Aspect       | Behavior                                                        |
| ------------ | --------------------------------------------------------------- |
| Quotes table | DROP + recreate on every launch, then upsert from `quotes.json` |
| Categories   | Re-synced via `ON CONFLICT DO UPDATE`                           |
| Saved quotes | **Never dropped** — persists user bookmarks across restarts     |

## Tech Stack

| Layer       | Technology                                |
| ----------- | ----------------------------------------- |
| Framework   | Expo SDK 57                               |
| UI          | React 19 / React Native 0.86              |
| Database    | expo-sqlite (WAL mode)                    |
| Preferences | @react-native-async-storage/async-storage |
| Image Share | react-native-view-shot                    |
| Clipboard   | expo-clipboard                            |
| Linking     | expo-linking                              |
| Icons       | @expo/vector-icons (Ionicons)             |
| Animations  | react-native Animated API                 |

## Getting Started

```bash
cd ECHO
npm install
npx expo prebuild --clean
npx expo run:ios
```

## Scripts

| Command           | Description           |
| ----------------- | --------------------- |
| `npm start`       | Start Expo dev server |
| `npm run ios`     | Start on iOS          |
| `npm run android` | Start on Android      |
| `npm run web`     | Start on web          |

## License

See [LICENSE](./LICENSE) for details.
