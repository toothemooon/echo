# Echo — Daily Quote Generator

A zen-minimalist iOS reading experience built with **Expo**, **React Native**, and **SQLite**. Typography-forward, gesture-driven, and designed with generous whitespace to create a calm, tactile paper-like experience.

## Features

- **160 curated quotes** across 8 categories (20 each), each with author identity
- **Multi-category system** — quotes tagged with multiple categories, one primary for display
- **Smart navigation** — left/right arrows with fade+slide animation, browse history stack
- **Bookmark & Share** — save quotes to collection (persisted in SQLite), share as text or image
- **History sheet** — spring-physics bottom sheet showing saved quotes
- **Dark mode** — full light/dark theme with system preference detection
- **Category preferences** — choose which categories appear in your daily quotes
- **Share as Image** — `react-native-view-shot` captures styled quote card as PNG
- **Settings** — theme, personalization, notifications, languages, feedback, about
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

| Category    | Color     | Quotes |
| ----------- | --------- | ------ |
| Mindfulness | `#8FAE8B` | 20     |
| Wisdom      | `#C9A96E` | 20     |
| Courage     | `#A0B4C8` | 20     |
| Love        | `#D4A0A0` | 20     |
| Nature      | `#7BA88E` | 20     |
| Growth      | `#B8A8C8` | 20     |
| Healing     | `#A8C5B8` | 20     |
| Gratitude   | `#C8B89A` | 20     |

Each quote supports **multiple category tags** and has a **primary category** for home display.

## Database Architecture

### Schema

```sql
-- Core quotes table (synced from quotes.json every launch)
CREATE TABLE quotes (
  id               INTEGER PRIMARY KEY,  -- Stable ID from JSON
  text             TEXT NOT NULL,
  author           TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT '',
  primary_category TEXT NOT NULL,
  created_at       TEXT DEFAULT (datetime('now'))
);

-- Multi-category junction table
CREATE TABLE quote_categories (
  quote_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  PRIMARY KEY (quote_id, category),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- User bookmarks (persists across restarts)
CREATE TABLE saved_quotes (
  quote_id INTEGER PRIMARY KEY,
  saved_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);
```

### Sync Strategy

| Aspect          | Behavior                                                        |
| --------------- | --------------------------------------------------------------- |
| Quotes table    | DROP + recreate on every launch, then upsert from `quotes.json` |
| Categories      | Re-synced via `ON CONFLICT DO UPDATE`                           |
| Saved quotes    | **Never dropped** — persists user bookmarks across restarts     |
| New quotes      | Auto-inserted via stable ID                                     |
| Modified quotes | Updated (text, author, role, primary_category)                  |
| Removed quotes  | Preserved in DB (no DELETE)                                     |

### Key Design Decisions

| Decision                       | Rationale                                                                 |
| ------------------------------ | ------------------------------------------------------------------------- |
| Stable IDs (not AUTOINCREMENT) | Enables deterministic upsert — same JSON entry always maps to same DB row |
| DROP+recreate for quotes       | Simpler than complex migration; data always re-synced from JSON           |
| saved_quotes NOT dropped       | Only user-owned data; must survive app updates                            |
| AsyncStorage for preferences   | Category preferences are simple key-value; no relational needs            |
| WAL mode                       | Better concurrent read/write performance for large datasets               |

### Data Flow

```
App Launch
  → syncDatabase()
    → DROP quotes, quote_categories
    → CREATE tables
    → syncQuotes(quotes.json) → INSERT OR REPLACE each quote
    → syncCategories(quote_categories) → DELETE + re-insert per quote
  → getSavedQuotes() → Load bookmarks from saved_quotes
  → getRandomQuote(preferredCategories) → Display first quote
```

## Tech Stack

| Layer       | Technology                                |
| ----------- | ----------------------------------------- |
| Framework   | Expo SDK 57 + expo-router                 |
| UI          | React 19 / React Native 0.86              |
| Styling     | NativeWind v4 (Tailwind CSS for RN)       |
| Database    | expo-sqlite (WAL mode)                    |
| Preferences | @react-native-async-storage/async-storage |
| Image Share | react-native-view-shot                    |
| Icons       | @expo/vector-icons (Ionicons)             |
| Animations  | react-native Animated API                 |

## Project Structure

```
ECHO/
├── src/
│   ├── components/
│   │   ├── Header.tsx                # TODAY + date + theme toggle + menu
│   │   ├── QuoteCard.tsx             # Category + guillemet + quote + author + role
│   │   ├── PaginationDots.tsx        # Fixed 5-dot indicator
│   │   ├── ActionBar.tsx             # Nav + bookmark + share + history
│   │   ├── HistorySheet.tsx          # Bottom sheet for saved quotes
│   │   └── ShareCard.tsx             # Offscreen card for image capture
│   ├── screens/
│   │   ├── SettingsScreen.tsx        # Settings page
│   │   ├── PersonalizationScreen.tsx # Category preference picker
│   │   └── ThemeScreen.tsx           # Light/Dark theme selector
│   ├── constants/
│   │   ├── colors.ts                 # Light/dark color tokens (15 tokens each)
│   │   └── categories.ts             # 8 categories + color mapping
│   ├── database/
│   │   ├── database.ts               # SQLite init + schema + migration
│   │   ├── quotes.ts                 # CRUD + sync + random queries + saved quotes
│   │   ├── seed.ts                   # JSON → SQLite sync on launch
│   │   └── preferences.ts            # AsyncStorage category prefs
│   └── data/
│       └── quotes.ts                 # Legacy (unused)
├── assets/
│   ├── quotes.json                   # 160 quotes with roles + multi-categories
│   └── images/                       # App icons, splash
├── App.tsx                           # Root — state management + page routing
├── app.json                          # Expo config
└── package.json
```

## Navigation

| Page            | Entry                       |
| --------------- | --------------------------- |
| Home            | Default — quotes + gestures |
| Settings        | Header ⋯ button             |
| Theme           | Settings → Theme            |
| Personalization | Settings → Categories       |

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
