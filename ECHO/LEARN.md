# ECHO 项目学习笔记

---

## 1. 项目整体用途

**ECHO** 是一款每日名言 App，核心体验是：**打开 App → 看到一条精美排版的名言 → 左右滑动浏览更多 → 收藏喜欢的 → 分享给朋友**。

---

## 2. 技术栈

| 类别        | 技术                              | 作用                       |
| ----------- | --------------------------------- | -------------------------- |
| **框架**    | Expo SDK 57                       | 跨平台构建工具             |
| **UI 框架** | React 19 / React Native 0.86      | 原生 UI 渲染               |
| **语言**    | TypeScript                        | 类型安全                   |
| **数据库**  | expo-sqlite (SQLite)              | 存储 160 条名言            |
| **持久化**  | AsyncStorage                      | 存储用户偏好（主题、类别） |
| **字体**    | Cormorant Garamond (Google Fonts) | 衬线字体，营造优雅感       |
| **截图**    | react-native-view-shot            | 生成分享图片               |
| **剪贴板**  | expo-clipboard                    | 复制文字                   |
| **链接**    | expo-linking                      | 打开外部链接               |

---

## 3. 目录结构（当前）

```
ECHO/
├── src/
│   ├── app/
│   │   ├── _layout.tsx              # 根 Stack（headerShown: false）
│   │   └── index.tsx                # ⭐ 唯一路由：全部 State + 条件渲染
│   ├── components/
│   │   └── home/                    # Home 页面专用组件
│   │       ├── Header.tsx           # 顶部：TODAY + 日期 + 主题切换 + 菜单
│   │       ├── QuoteCard.tsx        # 名言卡片展示
│   │       ├── ActionBar.tsx        # 操作栏：导航 + 收藏 + 分享 + 历史
│   │       ├── HistorySheet.tsx     # 底部弹窗：已收藏名言列表
│   │       ├── ShareSheet.tsx       # 底部弹窗：分享选项
│   │       └── ShareCard.tsx        # 离屏卡片：截图生成分享图片
│   ├── screens/
│   │   ├── SettingsScreen.tsx       # 设置页
│   │   ├── ThemeScreen.tsx          # 主题选择器
│   │   └── PersonalizationScreen.tsx # 类别选择器
│   ├── constants/
│   │   ├── colors.ts                # 明暗主题颜色 token（各 15 个）
│   │   └── categories.ts            # 8 个类别 + 类别颜色映射
│   └── database/
│       ├── database.ts              # SQLite 初始化 + Schema
│       ├── quotes.ts                # 名言 CRUD + 随机查询 + 收藏
│       ├── seed.ts                  # JSON → SQLite 同步
│       └── preferences.ts           # AsyncStorage：类别偏好 + 主题
├── assets/
│   └── quotes.json                  # 160 条名言数据源
├── App.tsx                          # ← 已删除
└── package.json
```

---

## 4. 架构图

### App 启动流程

```
index.ts 加载 → 注册 App 组件
  │
  ▼
_index.tsx (Expo Router 根布局)
  │  只有 <Stack headerShown={false} />
  │
  ▼
index.tsx (唯一路由页面)
  │
  ├── useFonts() 加载字体（Hook，顶层调用）
  │
  ├── useEffect init() 初始化：
  │   ① getTheme() → 恢复主题
  │   ② syncDatabase() → JSON → SQLite 同步
  │   ③ getPreferredCategories() → 恢复类别偏好
  │   ④ getSavedQuotes() → 恢复收藏
  │   ⑤ getQuoteCount() → 统计总数
  │   ⑥ getRandomQuote() → 加载第一条名言
  │   ⑦ setDbReady(true) → 允许渲染
  │
  ├── currentPage 条件渲染：
  │   "home"           → Header + QuoteCard + ActionBar + 弹窗
  │   "settings"       → SettingsScreen
  │   "theme"          → ThemeScreen
  │   "personalization" → PersonalizationScreen
  │
  └── Props 向下传递给所有子组件
```

### 数据流

```
index.tsx (State: isDark, currentPage, preferredCategories, savedQuotes, ...)
  │
  ├──→ <Header props={...} />
  │      → onMenu={() => setCurrentPage("settings")}
  │
  ├──→ <SettingsScreen props={...} />
  │      → onBack={() => setCurrentPage("home")}
  │      → onOpenTheme={() => setCurrentPage("theme")}
  │
  └──→ <ThemeScreen props={...} />
         → onToggleTheme() → 修改 isDark → 全局颜色更新
```

---

## 5. 数据存储架构

```
┌─────────────────────────────────────────────────────┐
│                  数据存储模型                         │
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
│     currentPage → 当前页面                            │
│     quoteHistory → 浏览历史栈                         │
│     historyIndex → 当前位置                           │
│     savedQuotes → 收藏列表（内存副本）                 │
│     isDark → 当前主题                                 │
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
| `role`             | TEXT NOT NULL | 作者角色                        |
| `primary_category` | TEXT NOT NULL | 主类别                          |
| `created_at`       | TEXT          | 创建时间                        |

### 表 2：`quote_categories`（名言-类别关联表）

| 字段       | 类型                   | 说明     |
| ---------- | ---------------------- | -------- |
| `quote_id` | INTEGER FK → quotes.id | 名言 ID  |
| `category` | TEXT                   | 类别名   |
| **PK**     | `(quote_id, category)` | 联合主键 |

### 表 3：`saved_quotes`（收藏表）

| 字段       | 类型                      | 说明     |
| ---------- | ------------------------- | -------- |
| `quote_id` | INTEGER PK FK → quotes.id | 名言 ID  |
| `saved_at` | TEXT                      | 收藏时间 |

---

## 7. 最重要的 10 个文件

| #   | 文件                              | 职责                               | 为什么重要             |
| --- | --------------------------------- | ---------------------------------- | ---------------------- |
| 1   | **index.tsx**                     | 全部 State + 条件渲染 + Props 传递 | 理解它就理解了整个 App |
| 2   | **database/quotes.ts**            | 名言 CRUD + 随机查询               | 核心数据操作层         |
| 3   | **database/database.ts**          | SQLite 初始化 + Schema             | 数据库的入口           |
| 4   | **database/seed.ts**              | JSON → SQLite 同步                 | 每次启动的数据源       |
| 5   | **database/preferences.ts**       | AsyncStorage 读写                  | 用户偏好持久化         |
| 6   | **constants/colors.ts**           | 颜色 token 定义                    | 全局样式基础           |
| 7   | **constants/categories.ts**       | 8 个类别 + 颜色映射                | 类别系统定义           |
| 8   | **components/home/Header.tsx**    | 顶部导航栏                         | 用户交互的入口         |
| 9   | **components/home/QuoteCard.tsx** | 名言卡片展示                       | 用户看到的核心 UI      |
| 10  | **components/home/ActionBar.tsx** | 操作按钮栏                         | 用户操作的入口         |

---

## 8. 主要业务流程

### 流程 1：App 第一次启动

```
1. index.ts → registerRootComponent(App)
2. _layout.tsx → <Stack headerShown={false} />
3. index.tsx 执行:
   ① useFonts() → 加载字体
   ② useEffect init():
      - getTheme() → 无数据 → 使用系统主题
      - syncDatabase() → CREATE 表 + INSERT 160 条名言
      - getPreferredCategories() → 无数据 → 返回全部 8 个类别
      - getSavedQuotes() → 无数据 → 返回 []
      - getRandomQuote() → 随机选一条
   ③ setDbReady(true) → 渲染页面
```

### 流程 2：用户点击"下一条"

```
1. 用户点击 [▶] → ActionBar.props.onNext
2. index.tsx goNext():
   - 如果有历史记录 → animateToQuote(index+1, "right")
   - 如果没有 → getRandomQuote(preferredCategories)
     → SQLite: SELECT ... ORDER BY RANDOM() LIMIT 1
     → 新名言加入 quoteHistory 数组
3. 动画：当前卡片淡出+左移 → 新卡片淡入+右移
4. QuoteCard 重新渲染
```

### 流程 3：用户收藏名言

```
1. 用户点击 [🔖] → ActionBar.props.onBookmark
2. index.tsx toggleBookmark():
   - 如果已收藏 → removeSavedQuote(id) → SQLite DELETE
   - 如果未收藏 → addSavedQuote(id) → SQLite INSERT
   → 更新 savedQuotes State
3. ActionBar 重新渲染，图标变化
```

### 流程 4：切换主题

```
1. 用户点击 [☀️/🌙] → Header.props.onToggleTheme
2. index.tsx persistTheme():
   - setIsDark(!isDark) → React State 更新
   - setTheme("dark") → AsyncStorage 持久化
3. const colors = isDark ? COLORS.dark : COLORS.light
4. 所有使用 colors 的组件重新渲染
```

---

## 9. 推荐的学习顺序

```
第 1 步：constants/colors.ts        ← 最基础，无依赖
第 2 步：constants/categories.ts    ← 无依赖
第 3 步：database/database.ts       ← 依赖 expo-sqlite
第 4 步：database/quotes.ts         ← 依赖 database.ts
第 5 步：database/seed.ts           ← 依赖 quotes.ts + quotes.json
第 6 步：database/preferences.ts    ← 依赖 async-storage
第 7 步：components/home/QuoteCard.tsx ← 依赖 colors.ts, quotes.ts
第 8 步：components/home/Header.tsx  ← 依赖 colors.ts
第 9 步：components/home/ActionBar.tsx ← 依赖 colors.ts
第 10 步：screens/*.tsx              ← 通过 props 接收数据
第 11 步：app/index.tsx              ← 整合所有模块
```

---

## 已知问题

### 数据库每次启动都 DROP 重建

**文件**：`src/database/database.ts`

每次启动都会 `DROP TABLE IF EXISTS quotes` 和 `quote_categories`，然后重新从 JSON 同步。因为名言数据是只读的，这样做可以确保数据始终最新。

**当前状态**：暂不修复，仅记录。

---

## 废弃代码

- `src/services/` — 空目录（或仅含未使用的文件）
