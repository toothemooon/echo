# ECHO 项目学习笔记

---

## 1. 项目整体用途

**ECHO** 是一款每日名言 App，核心体验是：**打开 App → 看到一条精美排版的名言 → 左右滑动浏览更多 → 收藏喜欢的 → 分享给朋友**。

它不是一个复杂的社交应用，而是一个**极简主义的阅读工具**，设计风格接近 Apple 的原生应用。

---

## 2. 技术栈

| 类别        | 技术                              | 作用                             |
| ----------- | --------------------------------- | -------------------------------- |
| **框架**    | Expo SDK 57                       | 跨平台构建工具                   |
| **UI 框架** | React Native 0.86 + React 19      | 原生 UI 渲染                     |
| **语言**    | TypeScript                        | 类型安全                         |
| **数据库**  | expo-sqlite (SQLite)              | 存储 160 条名言                  |
| **持久化**  | AsyncStorage                      | 存储用户偏好（主题、类别）       |
| **字体**    | Cormorant Garamond (Google Fonts) | 衬线字体，营造优雅感             |
| **截图**    | react-native-view-shot            | 生成分享图片                     |
| **剪贴板**  | expo-clipboard                    | 复制文字                         |
| **链接**    | expo-linking                      | 打开外部链接（Twitter/WhatsApp） |

**注意**：项目中**没有**使用 React Navigation、NativeWind、Zustand 或 Redux。

---

## 3. 目录结构（按职责分类）

```
ECHO/
├── index.ts                          # 入口文件，注册根组件
├── App.tsx                           # ⭐ 根组件（状态管理 + 页面路由 + 动画）
├── app.json                          # Expo 配置
├── package.json                      # 依赖清单
├── tsconfig.json                     # TypeScript 配置
│
├── assets/
│   ├── quotes.json                   # ⭐ 160 条名言数据源（JSON）
│   ├── icon.png                      # App 图标
│   ├── splash-icon.png               # 启动画面
│   └── android-icon-*.png            # Android 图标
│
├── src/
│   ├── components/                   # 🎨 UI 组件（纯展示 + 回调）
│   │   ├── Header.tsx                # 顶部：TODAY + 日期 + 主题切换 + 菜单
│   │   ├── QuoteCard.tsx             # 名言卡片：类别 + 引号 + 内容 + 作者 + 角色
│   │   ├── ActionBar.tsx             # 操作栏：前进/后退 + 收藏 + 分享 + 历史
│   │   ├── HistorySheet.tsx          # 底部弹窗：已收藏名言列表
│   │   ├── PaginationDots.tsx        # 分页指示器（⚠️ 当前未使用）
│   │   └── ShareCard.tsx             # 离屏卡片：用于截图生成分享图片
│   │
│   ├── screens/                      # 📱 页面（全屏视图）
│   │   ├── SettingsScreen.tsx        # 设置页：主题/类别/通知/反馈/关于
│   │   ├── PersonalizationScreen.tsx # 类别选择器：8 个类别勾选
│   │   ├── ThemeScreen.tsx           # 主题选择：Light / Dark
│   │   └── ShareScreen.tsx           # 分享页：复制/图片/系统分享/Twitter/WhatsApp
│   │
│   ├── constants/                    # 📐 常量定义
│   │   ├── colors.ts                 # ⭐ 明暗主题颜色 token（各 15 个）
│   │   └── categories.ts             # ⭐ 8 个类别 + 类别颜色映射
│   │
│   ├── database/                     # 💾 数据层
│   │   ├── database.ts               # ⭐ SQLite 初始化 + Schema 定义
│   │   ├── quotes.ts                 # ⭐ 名言 CRUD + 随机查询 + 收藏操作
│   │   ├── seed.ts                   # JSON → SQLite 同步
│   │   └── preferences.ts            # AsyncStorage：类别偏好 + 主题偏好
│   │
│   ├── data/                         # 📦 旧数据文件（已弃用）
│   │   └── quotes.ts                 # 5 条硬编码名言（⚠️ 未被引用）
│   │
│   └── services/                     # 🔧 服务层（空目录）
```

---

## 4. 架构图：App 启动到渲染的完整流程

```
┌─────────────────────────────────────────────────────────────┐
│                        App 启动                              │
│  index.ts → registerRootComponent(App)                      │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  App.tsx useEffect 初始化                                    │
│                                                              │
│  ① getTheme()           → 从 AsyncStorage 读取主题           │
│  ② syncDatabase()       → quotes.json → SQLite              │
│  ③ getPreferredCategories() → 从 AsyncStorage 读取类别       │
│  ④ getSavedQuotes()     → 从 SQLite 读取收藏                 │
│  ⑤ getQuoteCount()      → 统计名言总数                       │
│  ⑥ getRandomQuote()     → 随机获取第一条名言                  │
│  ⑦ setDbReady(true)     → 允许渲染                           │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  页面路由（currentPage 状态控制）                              │
│                                                              │
│  "home"           → Header + QuoteCard + ActionBar           │
│  "settings"       → SettingsScreen                           │
│  "personalization"→ PersonalizationScreen                    │
│  "theme"          → ThemeScreen                              │
│                                                              │
│  叠加层（不替换页面）：                                       │
│  HistorySheet     → 底部弹窗（savedQuotes）                   │
│  ShareScreen      → 底部弹窗（分享选项）                       │
│  ShareCard        → 离屏（截图用）                             │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Home 页面结构                                                │
│                                                              │
│  ┌──────────────────────────────┐                            │
│  │ Header                       │                            │
│  │  TODAY · Friday, July 19     │                            │
│  │  [☀️] [⋯]                    │                            │
│  ├──────────────────────────────┤                            │
│  │ QuoteCard                    │                            │
│  │  ● MINDFULNESS               │                            │
│  │  "                           │                            │
│  │  The present moment is..."   │                            │
│  │  — Thich Nhat Hanh           │                            │
│  │    Buddhist monk             │                            │
│  ├──────────────────────────────┤                            │
│  │ ActionBar                    │                            │
│  │  [◀] [🔖] [↗] [▶]           │                            │
│  │       HISTORY ▾              │                            │
│  └──────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 数据存储架构

```
┌─────────────────────────────────────────────────────┐
│                  数据存储三层模型                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ① 静态 JSON（只读）                                  │
│     assets/quotes.json                               │
│     → 160 条名言，每次启动同步到 SQLite                │
│                                                      │
│  ② SQLite（持久化）                                   │
│     echo.db                                          │
│     ├─ quotes (160条名言)                             │
│     ├─ quote_categories (多对多关系)                  │
│     └─ saved_quotes (用户收藏)                        │
│                                                      │
│  ③ AsyncStorage（持久化，轻量）                       │
│     @echo/preferred_categories → 用户选的类别          │
│     @echo/theme → "light" | "dark"                   │
│                                                      │
│  ④ React State（内存，重启丢失）                       │
│     quoteHistory → 浏览历史栈                         │
│     historyIndex → 当前位置                           │
│     savedQuotes → 收藏列表（内存副本）                 │
│     isDark → 当前主题                                 │
│     currentPage → 当前页面                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 6. 数据库 Schema 详解

### 表 1：`quotes`（名言表）

| 字段               | 类型          | 说明                            |
| ------------------ | ------------- | ------------------------------- |
| `id`               | INTEGER PK    | 名言 ID（与 JSON 中的 id 对应） |
| `text`             | TEXT NOT NULL | 名言内容                        |
| `author`           | TEXT NOT NULL | 作者                            |
| `role`             | TEXT NOT NULL | 作者角色（如 "Buddhist monk"）  |
| `primary_category` | TEXT NOT NULL | 主类别（如 "MINDFULNESS"）      |
| `created_at`       | TEXT          | 创建时间（默认 now）            |

**索引**：`idx_quotes_category` on `primary_category`

### 表 2：`quote_categories`（名言-类别关联表）

| 字段       | 类型                   | 说明                  |
| ---------- | ---------------------- | --------------------- |
| `quote_id` | INTEGER FK → quotes.id | 名言 ID               |
| `category` | TEXT                   | 类别名（如 "WISDOM"） |
| **PK**     | `(quote_id, category)` | 联合主键              |

**关系**：一条名言可以属于多个类别（如 id=1 同时属于 MINDFULNESS 和 WISDOM）

### 表 3：`saved_quotes`（收藏表）

| 字段       | 类型                      | 说明                 |
| ---------- | ------------------------- | -------------------- |
| `quote_id` | INTEGER PK FK → quotes.id | 名言 ID              |
| `saved_at` | TEXT                      | 收藏时间（默认 now） |

**重要**：此表在 `database.ts` 中用 `CREATE TABLE IF NOT EXISTS` 创建，不会在每次启动时被 DROP。

### 表关系图

```
quotes (1) ←──── (N) quote_categories (N) ←─── (8 个固定类别)
   │
   └── (1) ←──── (N) saved_quotes (用户收藏)
```

### 数据操作流程

| 操作       | SQL                                            | 触发时机                |
| ---------- | ---------------------------------------------- | ----------------------- |
| 插入名言   | `INSERT INTO quotes ... ON CONFLICT DO UPDATE` | 每次启动 syncDatabase() |
| 插入关联   | `INSERT OR IGNORE INTO quote_categories`       | 每次启动 syncDatabase() |
| 随机查询   | `SELECT ... ORDER BY RANDOM() LIMIT 1`         | 用户点击下一条          |
| 按类别查询 | `WHERE primary_category IN (...)`              | 用户设置了类别偏好      |
| 收藏       | `INSERT OR IGNORE INTO saved_quotes`           | 用户点击收藏按钮        |
| 取消收藏   | `DELETE FROM saved_quotes WHERE quote_id = ?`  | 用户取消收藏            |
| 查询收藏   | `SELECT ... INNER JOIN saved_quotes`           | 打开 History 弹窗       |

---

## 7. 最重要的 10 个文件

| #   | 文件                         | 职责                                   | 被谁调用                       | 调用了谁               | 为什么重要             |
| --- | ---------------------------- | -------------------------------------- | ------------------------------ | ---------------------- | ---------------------- |
| 1   | **App.tsx**                  | 根组件：所有状态、动画、路由、业务逻辑 | index.ts                       | 所有组件和 Screen      | 理解它就理解了整个 App |
| 2   | **database/quotes.ts**       | 名言 CRUD + 随机查询                   | App.tsx                        | database.ts            | 核心数据操作层         |
| 3   | **database/database.ts**     | SQLite 初始化 + Schema                 | quotes.ts, seed.ts             | expo-sqlite            | 数据库的入口           |
| 4   | **database/seed.ts**         | JSON → SQLite 同步                     | App.tsx                        | quotes.ts, quotes.json | 每次启动的数据源       |
| 5   | **database/preferences.ts**  | AsyncStorage 读写                      | App.tsx                        | async-storage          | 用户偏好持久化         |
| 6   | **constants/colors.ts**      | 颜色 token 定义                        | 所有组件和 Screen              | 无                     | 全局样式基础           |
| 7   | **constants/categories.ts**  | 8 个类别 + 颜色映射                    | App.tsx, PersonalizationScreen | 无                     | 类别系统定义           |
| 8   | **assets/quotes.json**       | 160 条名言数据                         | seed.ts                        | 无                     | 唯一的数据源           |
| 9   | **components/QuoteCard.tsx** | 名言卡片渲染                           | App.tsx                        | colors.ts, quotes.ts   | 用户看到的核心 UI      |
| 10  | **components/ActionBar.tsx** | 操作按钮栏                             | App.tsx                        | colors.ts              | 用户交互的入口         |

---

## 8. 主要业务流程

### 流程 1：App 第一次启动

```
1. index.ts → registerRootComponent(App)
2. App.tsx useEffect 执行:
   ① getTheme() → AsyncStorage 无数据 → 返回 null → 使用系统主题
   ② syncDatabase():
      - getDatabase() → 创建 echo.db
      - DROP quotes, quote_categories（但不 DROP saved_quotes）
      - CREATE 三张表
      - 读取 quotes.json (160条)
      - INSERT INTO quotes (批量，每50条一批)
      - INSERT INTO quote_categories (每条名言的类别)
   ③ getPreferredCategories() → AsyncStorage 无数据 → 返回全部 8 个类别
   ④ getSavedQuotes() → saved_quotes 为空 → 返回 []
   ⑤ getQuoteCount() → 返回 160
   ⑥ getRandomQuote(全部8个类别) → 随机选一条 → 设为 quoteHistory[0]
   ⑦ setDbReady(true) → 渲染 Home 页面
```

### 流程 2：用户点击"下一条"

```
1. 用户点击 ActionBar 的 [▶] 按钮
2. ActionBar 调用 onNext → App.tsx 的 goNext()
3. goNext() 检查:
   - 如果 canGoNext（历史中还有后面的）→ animateToQuote(historyIndex+1, "right")
   - 如果没有 → getRandomQuote(preferredCategories)
     → SQLite: SELECT ... ORDER BY RANDOM() LIMIT 1 WHERE primary_category IN (...)
     → 新名言加入 quoteHistory 数组
     → historyIndex +1
4. 动画：当前卡片淡出+左移 → 新卡片淡入+右移
5. QuoteCard 重新渲染，显示新名言
```

### 流程 3：用户收藏名言

```
1. 用户点击 ActionBar 的 [🔖] 按钮
2. ActionBar 调用 onBookmark → App.tsx 的 toggleBookmark()
3. toggleBookmark() 检查 isSaved:
   - 如果已收藏 → removeSavedQuote(id)
     → SQLite: DELETE FROM saved_quotes WHERE quote_id = ?
     → 从 savedQuotes state 中移除
   - 如果未收藏 → addSavedQuote(id)
     → SQLite: INSERT OR IGNORE INTO saved_quotes (quote_id) VALUES (?)
     → 加入 savedQuotes state
4. ActionBar 重新渲染，图标变为实心/空心
```

### 流程 4：用户打开收藏历史

```
1. 用户点击 HISTORY ▾
2. ActionBar 调用 onHistory → App.tsx 的 openHistory()
3. openHistory():
   - setHistoryVisible(true)
   - Animated.spring: sheetAnim → 0（弹窗滑入）
   - Animated.timing: backdropAnim → 1（背景变暗）
4. HistorySheet 渲染 savedQuotes 列表
5. 用户可以点击 ✕ 删除收藏 → handleRemoveSaved()
```

### 流程 5：切换主题

```
1. 用户在 Header 点击 [☀️/🌙] 按钮
2. Header 调用 onToggleTheme → App.tsx 的 persistTheme(!isDark)
3. persistTheme():
   - setIsDark(dark) → React State 更新
   - setTheme(dark ? "dark" : "light") → AsyncStorage 持久化
4. const c = isDark ? COLORS.dark : COLORS.light → 所有组件使用新颜色
5. 下次启动 → getTheme() → 读取 "dark" → 恢复主题
```

---

## 9. 推荐的学习顺序

按照依赖关系，从底层到上层：

```
第 1 步：constants/colors.ts        ← 最基础，无依赖
第 2 步：constants/categories.ts    ← 无依赖
第 3 步：database/database.ts       ← 依赖 expo-sqlite
第 4 步：database/quotes.ts         ← 依赖 database.ts
第 5 步：database/seed.ts           ← 依赖 quotes.ts + quotes.json
第 6 步：database/preferences.ts    ← 依赖 async-storage
第 7 步：components/QuoteCard.tsx   ← 依赖 colors.ts, quotes.ts
第 8 步：components/Header.tsx      ← 依赖 colors.ts
第 9 步：components/ActionBar.tsx   ← 依赖 colors.ts
第 10 步：App.tsx                    ← 整合所有模块
第 11 步：各个 Screen               ← 完整理解后看页面
```

---

## 已知问题

### 数据库每次启动都 DROP 重建

**文件**：`src/database/database.ts`

`database.ts` 中每次启动都会执行 `DROP TABLE IF EXISTS quotes` 和 `DROP TABLE IF EXISTS quote_categories`，然后重新从 `quotes.json` 同步。这意味着 `quotes` 和 `quote_categories` 表的数据在每次 App 启动时都会被清空重建。

**影响**：对名言数据无影响（因为数据源是只读的 JSON 文件，同步后结果相同）。但如果未来添加了写入 `quotes` 表的功能（如用户自定义名言），这些数据会在下次启动时丢失。

**当前状态**：暂不修复，仅记录。

---

## 废弃代码

- `src/data/quotes.ts` — 5 条硬编码名言，项目中无引用
- `src/services/` — 空目录
- `src/components/PaginationDots.tsx` — 已实现但未使用
- `src/database/quotes.ts` 中的 `getDailyFive()` — 已实现但未调用
