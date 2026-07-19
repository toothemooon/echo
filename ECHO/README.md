# Echo — Daily Quote Generator

A zen-minimalist iOS reading experience built with **Expo**, **React Native**, and **SQLite**. Typography-forward, gesture-driven, and designed with generous whitespace to create a calm, tactile paper-like experience.

## Features

- **160 curated quotes** across 8 categories, each with author identity and role
- **Multi-category system** — quotes tagged with multiple categories, one primary for display
- **Smart navigation** — left/right arrows with fade+slide animation, browse history stack
- **Bookmark & Share** — save quotes to collection (persisted in SQLite), share as text or image
- **History sheet** — spring-physics bottom sheet showing saved quotes with delete button
- **Dark mode** — full light/dark theme with system preference detection + persistence
- **Category preferences** — choose which categories appear in your daily quotes
- **Share as Image** — `react-native-view-shot` captures styled quote card as PNG
- **Unified Share Screen** — copy text, share as image, share via system panel, Twitter, WhatsApp
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
  id               INTEGER PRIMARY KEY,
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
| Framework   | Expo SDK 57                               |
| UI          | React 19 / React Native 0.86              |
| Database    | expo-sqlite (WAL mode)                    |
| Preferences | @react-native-async-storage/async-storage |
| Image Share | react-native-view-shot                    |
| Clipboard   | expo-clipboard                            |
| Linking     | expo-linking                              |
| Icons       | @expo/vector-icons (Ionicons)             |
| Animations  | react-native Animated API                 |

## Project Structure

```
ECHO/
├── src/
│   ├── components/
│   │   ├── Header.tsx                # TODAY + date + theme toggle + menu
│   │   ├── QuoteCard.tsx             # Category + guillemet + quote + author + role
│   │   ├── ActionBar.tsx             # Nav + bookmark + share + history
│   │   ├── HistorySheet.tsx          # Bottom sheet for saved quotes (scrollable)
│   │   └── ShareCard.tsx             # Offscreen card for image capture
│   ├── screens/
│   │   ├── SettingsScreen.tsx        # Settings page (Preference/Widgets/Notifications/Feedback/About)
│   │   ├── PersonalizationScreen.tsx # Category preference picker
│   │   ├── ThemeScreen.tsx           # Light/Dark theme selector
│   │   └── ShareScreen.tsx           # Unified share sheet (text/image/social)
│   ├── constants/
│   │   ├── colors.ts                 # Light/dark color tokens (15 tokens each)
│   │   └── categories.ts             # 8 categories + color mapping
│   └── database/
│       ├── database.ts               # SQLite init + schema + migration
│       ├── quotes.ts                 # CRUD + sync + random queries + saved quotes
│       ├── seed.ts                   # JSON → SQLite sync on launch
│       └── preferences.ts            # AsyncStorage: categories, theme, reminder
├── assets/
│   ├── quotes.json                   # 160 quotes with roles + multi-categories
│   └── images/                       # App icons, splash
├── App.tsx                           # Root — state management + page routing
├── LEARN.md                          # Project learning notes (Chinese)
├── app.json                          # Expo config
└── package.json
```

## Coding Convention — Props

All React components follow a unified Props pattern:

```tsx
// ✅ Correct — type definition + props parameter + props.xxx access
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
- No `const { xxx } = props` re-destructuring inside the function

## Navigation

| Page            | Entry                       |
| --------------- | --------------------------- |
| Home            | Default — quotes + gestures |
| Settings        | Header ⋯ button             |
| Theme           | Settings → Preference       |
| Personalization | Settings → Preference       |

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

---

## Production Readiness Assessment

### ✅ Completed (Launch-Ready Features)

| Feature                                                            | Status |
| ------------------------------------------------------------------ | ------ |
| Daily quote display (160 quotes, 8 categories)                     | ✅     |
| Left/right navigation with fade+slide animation                    | ✅     |
| Quote bookmarking (SQLite persisted)                               | ✅     |
| Share (text / image / system panel / Twitter / WhatsApp)           | ✅     |
| History management (view / delete with × button)                   | ✅     |
| Dark mode (system detect + manual toggle + persistence)            | ✅     |
| Category preferences (personalization)                             | ✅     |
| Settings (Preference / Widgets / Notifications / Feedback / About) | ✅     |
| SQLite auto-sync (upsert from JSON on every launch)                | ✅     |
| Theme persistence (AsyncStorage)                                   | ✅     |

### ❌ Must-Fix Before App Store Submission

| Issue                                                             | Priority  | Fix                                                            |
| ----------------------------------------------------------------- | --------- | -------------------------------------------------------------- |
| **Only 160 quotes** — users exhaust content within weeks          | 🔴 High   | Expand to 300+ quotes                                          |
| **Daily Reminder is a dead switch** — has UI but no functionality | 🟡 Medium | Implement with `expo-notifications` or change to "Coming Soon" |
| **No crash monitoring**                                           | 🟡 Medium | Integrate Sentry or EAS Updates                                |
| **No onboarding flow**                                            | 🟡 Medium | Add 2-3 page first-launch tutorial                             |
| **Default Expo app icon**                                         | 🟠 Low    | Design custom icon                                             |
| **No quote source attribution**                                   | 🟠 Low    | Add citation/source field to avoid copyright issues            |

### Verdict

> **The feature set is sufficient for App Store submission**, but content volume (160 quotes) is too low for user retention. Expand to 300+ quotes and resolve the Daily Reminder switch before submitting.

---

## Production Recommendations

### Tier 1 — Launch Essentials (Before Submit)

| Recommendation                | Why                                                     |
| ----------------------------- | ------------------------------------------------------- |
| **Expand quotes to 300+**     | Content is king — 160 quotes ≈ 1 month of daily viewing |
| **Crash monitoring (Sentry)** | Track production crashes and ANRs                       |
| **Custom app icon**           | Professional icon is required for App Store             |
| **Privacy policy & terms**    | App Store mandatory — currently placeholder URLs        |
| **Quote source attribution**  | Legal compliance — each quote needs citation            |

### Tier 2 — Enhanced UX

| Recommendation                     | Why                                                        |
| ---------------------------------- | ---------------------------------------------------------- |
| **Onboarding (2-3 pages)**         | First-time user experience — explain gestures and features |
| **Category color sync**            | QuoteCard dot color should match current category          |
| **Haptic feedback**                | Light vibration on page flip for tactile feel              |
| **Quote image share optimization** | Auto-generate beautiful cards for Instagram Stories        |
| **Export saved quotes**            | Users can export collection as PDF/TXT                     |

### Tier 3 — Growth & Retention

| Recommendation               | Why                                                   |
| ---------------------------- | ----------------------------------------------------- |
| **Daily push notifications** | Morning quote delivery boosts daily retention         |
| **iOS Widget**               | Desktop quote display increases daily active usage    |
| **Search & filter**          | Users can find quotes by author, keyword, or category |
| **Multi-language quotes**    | Support Chinese / Japanese / English quotes           |
| **Custom user quotes**       | Users add their own quotes to the collection          |
| **Analytics**                | Track daily actives, flip count, save rate            |

### Tier 4 — Data-Driven

| Recommendation             | Why                                        |
| -------------------------- | ------------------------------------------ |
| **Firebase Remote Config** | Feature flags without app updates          |
| **A/B testing**            | Test UI layouts for retention impact       |
| **Quote recommendation**   | Suggest quotes based on user save patterns |

### Top 3 Actions for Launch

> 1. **Expand quotes to 300+** (content is the product)
> 2. **Integrate Sentry** (production stability)
> 3. **Design custom app icon** (App Store first impression)

## License

See [LICENSE](./LICENSE) for details.
