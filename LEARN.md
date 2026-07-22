# ECHO 项目学习笔记

## 1. 项目整体用途

**ECHO** 是一款每日格言 App，核心体验是：**打开 App → 阅读一条精美排版的格言 → 左右切换 → 收藏喜欢的内容 → 分享给朋友**。

数据层遵循一个清晰边界：App 内置内容来自只读 JSON，查询逻辑由 TypeScript 模块负责，用户设置和收藏由 AsyncStorage 持久化，界面即时状态由 React State 管理。

## 2. 技术栈

| 类别 | 技术 | 作用 |
| ---- | ---- | ---- |
| 框架 | Expo SDK 57 | 跨平台构建和原生能力 |
| UI | React 19 / React Native 0.86 | 原生 UI 渲染 |
| 语言 | TypeScript | 类型安全和数据验证 |
| 内置内容 | `assets/quotes.json` | 唯一的内置格言数据源 |
| 用户持久化 | AsyncStorage | 保存主题、类别偏好和收藏快照 |
| 字体 | Cormorant Garamond | 格言衬线字体 |
| 截图 | `react-native-view-shot` | 生成分享图片 |
| 剪贴板 | `expo-clipboard` | 复制文字 |
| 链接 | `expo-linking` | 打开外部分享链接 |
| 通知 | `expo-notifications` | 本地提醒 |

## 3. 目录结构

```text
ECHO/
├── src/
│   ├── app/
│   │   ├── _layout.tsx               # 根 Stack（headerShown: false）
│   │   └── index.tsx                 # 全部运行时 State + 条件渲染
│   ├── components/home/
│   │   ├── Header.tsx                # 日期、主题切换、菜单入口
│   │   ├── QuoteCard.tsx             # 主类别、格言、作者、身份展示
│   │   ├── ActionBar.tsx             # 前后切换、收藏、分享、收藏列表
│   │   ├── HistorySheet.tsx          # 已收藏格言列表 Bottom Sheet
│   │   ├── ShareSheet.tsx            # 分享选项 Bottom Sheet
│   │   └── ShareCard.tsx             # 用于生成分享图片的离屏卡片
│   ├── screens/
│   │   ├── SettingsScreen.tsx        # 设置页
│   │   ├── ThemeScreen.tsx           # 主题选择器
│   │   └── PersonalizationScreen.tsx # 类别偏好选择器
│   ├── constants/
│   │   ├── colors.ts                 # 明暗主题颜色 token
│   │   └── categories.ts             # Category 类型、8 个类别和颜色
│   ├── data/
│   │   └── quotes.ts                 # Quote 类型、JSON 验证和同步查询
│   ├── storage/
│   │   ├── preferences.ts            # 主题与类别偏好持久化
│   │   └── savedQuotes.ts            # 完整收藏快照持久化
│   └── services/
│       └── notifications.ts          # 本地通知与通知格言选择
├── assets/
│   └── quotes.json                   # 160 条内置格言的唯一来源
├── app.json                          # Expo 配置
├── package.json                      # 依赖和脚本
└── tsconfig.json                     # TypeScript 配置
```

## 4. 整体架构

### App 启动流程

```text
expo-router/entry
  │
  ▼
_layout.tsx
  │  渲染 <Stack screenOptions={{ headerShown: false }} />
  ▼
index.tsx
  │
  ├── useFonts() 加载字体
  │
  ├── 初始化用户数据
  │   ├── getTheme()                 → 恢复主题或使用系统主题
  │   ├── getPreferredCategories()   → 恢复类别偏好
  │   └── getSavedQuotes()           → 恢复完整收藏快照
  │
  ├── getRandomQuote(categories)     → 从内置 JSON 同步选择首条格言
  │
  ├── 初始化 quoteHistory 和 historyIndex
  │
  └── 初始化完成且字体就绪后渲染当前页面
```

主题、类别偏好和收藏可以并行读取。内置格言已经随 App 打包，不需要在启动时复制、导入或建立第二份内容副本。

### 页面与 Props 数据流

```text
index.tsx
  │  State: currentPage, isDark, preferredCategories,
  │         savedQuotes, quoteHistory, historyIndex, sheet 状态等
  │
  ├── home
  │   └── Header + QuoteCard + ActionBar + HistorySheet + ShareSheet
  ├── settings
  │   └── SettingsScreen
  ├── theme
  │   └── ThemeScreen
  └── personalization
      └── PersonalizationScreen

State → props.xxx → 子组件 → callback prop → index.tsx 更新 State
```

`index.tsx` 是 UI 状态的协调者。组件通过 props 接收数据并触发回调，不直接读写持久化模块。页面切换由 `currentPage` 控制，原有导航、动画和 Bottom Sheet 行为保持独立于数据存储。

组件统一采用以下 Props 写法：

```tsx
type Props = {
  isDark: boolean;
  onBack: () => void;
};

export default function ThemeScreen(props: Props) {
  // 在函数体内通过 props.isDark、props.onBack 访问
}
```

参数位置不解构 `props`，所有组件的 Props 类型都命名为 `Props`。

## 5. 数据存储架构

```text
┌────────────────────────────────────────────────────────────┐
│                    ECHO 数据分层                            │
├────────────────────────────────────────────────────────────┤
│  ① 内置内容（只读，随版本发布）                              │
│     assets/quotes.json                                     │
│     └── 每条格言只出现一次，通过 categories 支持多类别       │
│                                                            │
│  ② TypeScript 数据模块（同步读取）                           │
│     src/data/quotes.ts                                     │
│     ├── 验证 Quote 字段、类别、主类别和唯一 ID               │
│     ├── 按 ID 查询、按多个类别筛选                           │
│     └── 安全随机选择和空结果回退                             │
│                                                            │
│  ③ AsyncStorage（跨重启）                                   │
│     @echo/theme                 → "light" | "dark"         │
│     @echo/preferred_categories → Category[]                │
│     @echo/saved_quotes          → SavedQuoteRecord[]        │
│                                                            │
│  ④ React State（仅当前运行）                                 │
│     currentPage、当前格言、Sheet 状态、主题和偏好内存副本     │
│     quoteHistory、historyIndex → 左右切换使用的浏览栈         │
│     savedQuotes                → 收藏列表的 UI 内存副本       │
└────────────────────────────────────────────────────────────┘
```

### 5.1 内置格言与 TypeScript 查询层

`assets/quotes.json` 是唯一的内置格言内容源。每条格言具有以下字段：

```ts
type Quote = {
  id: number | string;
  text: string;
  author: string;
  role: string;
  primary_category: Category;
  categories: Category[];
};
```

`src/data/quotes.ts` 导入并验证 JSON，然后提供只读同步接口：

```ts
getAllQuotes(): Quote[];
getQuoteById(id: number | string): Quote | undefined;
getQuotesByCategories(categories: Category[]): Quote[];
getRandomQuote(
  categories?: Category[],
  excludedIds?: Array<number | string>,
): Quote | null;
```

分类筛选采用“任一标签命中”：只要格言的 `categories` 包含一个用户所选类别，就可以进入候选集合。空分类或筛选无结果时回退到全部格言；排除 ID 后候选为空时忽略排除列表重试；只有整个内置集合为空时才返回 `null`。

### 5.2 用户偏好

`src/storage/preferences.ts` 负责两个现有 key：

| Key | 内容 | 读取规则 |
| --- | ---- | -------- |
| `@echo/theme` | `light` 或 `dark` | 非法值回退为 `null`，由 App 使用系统主题 |
| `@echo/preferred_categories` | 类别数组 | 过滤未知值、去重；无有效类别时回退全部类别 |

每次读取都处理 `null`、解析失败和不合法结构。每次写入先规范化数据，写失败时 Promise 会拒绝，并在开发环境输出不含用户内容的警告。

### 5.3 收藏快照

收藏不能只记录 ID，因为未来版本可能替换部分内置格言。保存格式为：

```ts
type SavedQuoteRecord = {
  quote: Quote;
  savedAt: string;
};
```

这意味着用户收藏某条格言时，会保存当时完整的文字、作者、身份、主类别和全部类别。即使后续版本从 `quotes.json` 删除该条内容，收藏列表仍可以展示原快照。

`src/storage/savedQuotes.ts` 的职责包括：

- 按 quote ID 防止重复收藏。
- 按 `savedAt` 从新到旧返回。
- 删除时只移除目标 ID。
- 写操作串行执行，避免快速连续点击互相覆盖。
- 读取时验证顶层数组和每条记录；单条损坏不影响其他合法收藏。
- 整体无法解析时安全返回空数组，不让本地损坏导致 App 崩溃。
- 写入前再次验证完整记录数组。

### 5.4 “History”的两个含义

- `quoteHistory` 和 `historyIndex` 是左右切换使用的运行时浏览栈，只放在 React State，重启后清空。
- `HistorySheet` 的名字沿用现有 UI，但它实际展示的是跨重启保存的收藏列表。

二者产品行为不同，不能因为名称相似而把运行时浏览栈也持久化。

## 6. 主要业务流程

### 流程 1：首次启动

```text
1. Expo Router 加载根布局和 index.tsx
2. useFonts() 加载 Cormorant Garamond
3. 初始化函数读取主题、类别偏好和收藏
4. 缺少已保存主题时使用系统明暗模式
5. 缺少有效类别偏好时使用全部 8 个类别
6. getRandomQuote(preferredCategories) 同步选择首条内置格言
7. 把首条格言写入 quoteHistory，并将 historyIndex 设为 0
8. 初始化就绪后渲染页面
```

### 流程 2：用户点击“下一条”

```text
1. ActionBar 调用 onNext
2. 如果浏览栈中已有后一条：historyIndex + 1
3. 否则：getRandomQuote(preferredCategories) 选择新格言
4. 将新格言追加到 quoteHistory，并更新 historyIndex
5. 当前卡片淡出并滑动，新卡片淡入并滑回
```

类别偏好只影响之后选择的新格言，不重写已经浏览过的栈。

### 流程 3：用户收藏或取消收藏

```text
收藏：
1. ActionBar 调用 onBookmark
2. saveQuote(currentQuote) 保存完整快照和当前 ISO 时间
3. 成功后把当前 Quote 放到 savedQuotes State 顶部

取消收藏：
1. removeSavedQuote(currentQuote.id) 只删除目标记录
2. savedQuotes State 同步过滤目标 ID
3. ActionBar 与 HistorySheet 立即重新渲染
```

### 流程 4：切换主题

```text
1. Header 或 ThemeScreen 触发主题回调
2. setIsDark() 立即更新 React State
3. setTheme("light" | "dark") 持久化选择
4. colors 派生值变化，所有使用 colors 的组件重新渲染
```

### 流程 5：修改偏好类别

```text
1. PersonalizationScreen 触发类别回调
2. index.tsx 更新 preferredCategories State
3. setPreferredCategories() 持久化规范化后的类别数组
4. 下一次产生新格言时使用新的类别集合筛选
```

## 7. 最重要的 10 个文件

| # | 文件 | 职责 | 学习重点 |
| - | ---- | ---- | -------- |
| 1 | `src/app/index.tsx` | 全部运行时 State、页面协调和回调 | 理解完整 UI 数据流 |
| 2 | `assets/quotes.json` | 唯一内置内容源 | Quote 字段和多类别模型 |
| 3 | `src/data/quotes.ts` | 验证、筛选、查询和随机选择 | 只读数据层与安全回退 |
| 4 | `src/storage/savedQuotes.ts` | 收藏快照持久化 | 数据校验、去重、排序和串行写入 |
| 5 | `src/storage/preferences.ts` | 主题和类别偏好持久化 | 小型设置数据的容错读取 |
| 6 | `src/constants/categories.ts` | 类别类型、值和颜色 | JSON 与 UI 共用的合法类别集合 |
| 7 | `src/constants/colors.ts` | 颜色 token | 明暗主题的视觉基础 |
| 8 | `src/components/home/QuoteCard.tsx` | 格言卡片 | 主类别和文本展示 |
| 9 | `src/components/home/ActionBar.tsx` | 主要操作入口 | props 回调如何回到 index.tsx |
| 10 | `src/services/notifications.ts` | 本地提醒 | 如何复用同步格言查询层 |

## 8. 推荐学习顺序

```text
第 1 步：constants/categories.ts       ← 先理解合法类别集合
第 2 步：assets/quotes.json            ← 理解 Quote 内容结构
第 3 步：data/quotes.ts                ← 学习验证、筛选和安全回退
第 4 步：storage/preferences.ts        ← 学习简单设置持久化
第 5 步：storage/savedQuotes.ts        ← 学习完整快照和容错读取
第 6 步：constants/colors.ts           ← 理解主题 token
第 7 步：components/home/QuoteCard.tsx ← 查看数据如何显示
第 8 步：components/home/ActionBar.tsx ← 查看用户事件如何上报
第 9 步：screens/*.tsx                 ← 查看页面如何通过 props 工作
第 10 步：services/notifications.ts    ← 查看其他功能如何复用数据层
第 11 步：app/index.tsx                ← 最后串联初始化、State 和交互
```

## 9. 内容维护约定

- 每个格言 ID 永久稳定；旧 ID 即使被删除，也不能分配给新内容。
- 新格言必须使用从未出现过的新 ID。
- 同一条格言不按类别复制到多个文件；它只存在于单一 `quotes.json` 中。
- `categories` 可以包含多个合法类别，`primary_category` 必须是其中之一。
- `quotes.json` 只保存内置内容，不保存主题、偏好或收藏。
- AsyncStorage 不保存整份内置格言集合，只保存用户数据和收藏快照。
- 当前单文件结构足以支持数千条内容；出现明确的性能需求前不提前拆分。

单个当前版本只能检查 ID 是否唯一，无法自动证明某个已删除 ID 从未在历史版本中使用。因此，发布新内容时必须通过内容维护流程记录已用 ID，并把“永不复用”作为发布检查项。

## 10. 错误处理原则

- 所有 AsyncStorage 读取都使用 `try/catch`，处理空值和 JSON 解析失败。
- 不信任本地读取结果；先验证数组、对象和字段，再交给 UI。
- 损坏数据使用合理默认值，不能阻止 App 启动。
- 开发环境可使用 `console.warn` 说明操作名称和错误类型，但不输出用户保存的内容。
- 所有写入接口返回 `Promise<void>`，调用处可以等待成功后再更新对应 State。
