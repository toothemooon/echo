# Echo — Daily Quote Generator

A zen-minimalist iOS reading experience built with **Expo**, **React Native**, and **SQLite**. Typography-forward, gesture-driven, and designed with generous whitespace to create a calm, tactile paper-like experience.

## Features

- **125 curated quotes** across 8 categories, each with author identity
- **Multi-category system** — quotes tagged with multiple categories, one primary for display
- **Smart navigation** — left/right arrows with fade+slide animation, browse history stack
- **Bookmark & Share** — save quotes to collection, share via native share sheet
- **History sheet** — spring-physics bottom sheet showing saved quotes
- **Dark mode** — full light/dark theme with system preference detection
- **Category preferences** — choose which categories appear in your daily quotes
- **Settings** — appearance, personalization, notifications, languages, feedback, about
- **SQLite storage** — on-device database with auto-sync from bundled JSON on every launch

## Design System

| Element     | Value                                          |
| ----------- | ---------------------------------------------- |
| Quote Font  | Playfair Display Italic (serif)                |
| UI Font     | System sans-serif (uppercase + letter-spacing) |
| Light BG    | `#E5E0D8` warm beige                           |
| Dark BG     | `#1A1A18` matte black                          |
| Accent      | `#8FAE8B` sage green                           |
| Paper grain | SVG noise at 2.5% opacity                      |

## 8 Categories

| Category    | Color     | Description            |
| ----------- | --------- | ---------------------- |
| Mindfulness | `#8FAE8B` | 正念 · 当下 · 觉察     |
| Wisdom      | `#C9A96E` | 哲学 · 人生智慧        |
| Courage     | `#A0B4C8` | 勇气 · 行动 · 坚持     |
| Love        | `#D4A0A0` | 爱 · 关系 · 慈悲       |
| Nature      | `#7BA88E` | 自然 · 四季 · 宁静     |
| Growth      | `#B8A8C8` | 成长 · 学习 · 自我提升 |
| Healing     | `#A8C5B8` | 疗愈 · 内在修复 · 重生 |
| Gratitude   | `#C8B89A` | 感恩 · 知足 · 珍惜     |

Each quote supports **multiple category tags** and has a **primary category** for home display.

## Tech Stack

| Layer       | Technology                                               |
| ----------- | -------------------------------------------------------- |
| Framework   | Expo SDK 57 + expo-router                                |
| UI          | React 19 / React Native 0.86                             |
| Styling     | NativeWind v4 (Tailwind CSS for RN)                      |
| Database    | expo-sqlite (WAL mode)                                   |
| Preferences | @react-native-async-storage/async-storage                |
| Fonts       | @expo-google-fonts/cormorant-garamond + Playfair Display |
| Icons       | @expo/vector-icons (Ionicons)                            |
| Animations  | react-native Animated API                                |

## Project Structure

```
ECHO/
├── src/
│   ├── app/                          # (unused — using registerRootComponent)
│   ├── components/
│   │   ├── Header.tsx                # TODAY + date + theme toggle + menu
│   │   ├── QuoteCard.tsx             # Category + guillemet + quote + author + role
│   │   ├── PaginationDots.tsx        # Fixed 5-dot indicator
│   │   ├── ActionBar.tsx             # Nav + bookmark + share + history
│   │   └── HistorySheet.tsx          # Bottom sheet for saved quotes
│   ├── screens/
│   │   ├── SettingsScreen.tsx        # Settings page
│   │   └── PersonalizationScreen.tsx # Category preference picker
│   ├── constants/
│   │   ├── colors.ts                 # Light/dark color tokens
│   │   └── categories.ts             # 8 categories + color mapping
│   ├── database/
│   │   ├── database.ts               # SQLite init + schema
│   │   ├── quotes.ts                 # CRUD + sync + random queries
│   │   ├── seed.ts                   # JSON → SQLite sync on launch
│   │   └── preferences.ts            # AsyncStorage category prefs
│   └── data/
│       └── quotes.ts                 # Legacy (unused)
├── assets/
│   ├── quotes.json                   # 125 quotes with roles + multi-categories
│   └── images/                       # App icons, splash
├── App.tsx                           # Root — state management + page routing
├── app.json                          # Expo config
└── package.json
```

## Database Architecture

**Schema:**

```sql
quotes (id, text, author, role, primary_category, created_at)
quote_categories (quote_id, category)  -- junction table
```

**Sync strategy:** Every launch, `syncDatabase()` upserts all quotes from `quotes.json` using stable IDs with `ON CONFLICT DO UPDATE`. New quotes are inserted, modified quotes are updated, old data is preserved, saved quotes are untouched.

## Navigation

| Page            | Entry                       |
| --------------- | --------------------------- |
| Home            | Default — quotes + gestures |
| Settings        | Header ⋯ button             |
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
