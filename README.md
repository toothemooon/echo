# ECHO

ECHO 是一款使用 Expo 与 React Native 开发的离线优先三语格言阅读应用。
它以安静、克制的每日阅读体验为核心，提供主题切换、字体设置、收藏、
心情偏好、三语内容和带有防重复机制的推荐轮换。

当前版本：**1.0.0**

## 1. 产品定位

ECHO 不要求注册账号，也不依赖服务器才能完成核心阅读流程。应用内置格言目录，
主题、偏好、收藏和当日推荐状态均保存在设备本地。

v1.0 聚焦以下目标：

- 让首次使用者无需理解分类系统，也能获得合适的阅读内容；
- 将英文、简体中文和日语内容统一到同一套数据结构；
- 减少短时间内重复出现相同格言、作者或内容类别；
- 提升长文本、中文和日文的显示稳定性；
- 建立可重复执行的数据导入、来源记录和质量检查流程；
- 保持 MVP 简单，不加入广告、付费墙、Widget、账号、云同步或远程推送。

## 2. v1.0 主要功能

### 2.1 首次启动心情问答

首次进入应用时，用户会看到：

> How have you been feeling lately?

用户选择当前状态后，应用会把答案转换为内部阅读偏好。例如：

- `I feel overwhelmed` → 正念与疗愈；
- `I am facing a challenge` → 勇气与成长；
- `I need quiet` → 正念与自然；
- `Surprise me` → 在全部分类中均衡探索。

这只是内容偏好，不是健康诊断。相同问答也可以在设置页的
`Preferences` 中重新选择。

### 2.2 三语格言目录

应用当前内置：

| 语言 | 文件 | 数量 |
| --- | --- | ---: |
| 英文 | `assets/quotes.json` | 1,465 |
| 简体中文 | `assets/quotes.zh-Hans.json` | 891 |
| 日语 | `assets/quotes.ja.json` | 1,927 |
| 合计 | 三个目录 | 4,283 |

设置页提供 `Quote Language`，用户可以在 English、简体中文和日本語之间切换。
切换后，当前浏览栈会重建，后续推荐和左右翻页只使用所选语言的数据。

### 2.3 每日推荐轮换

推荐系统会综合处理：

- 用户当前的心情偏好；
- 当前会话已经浏览的格言；
- 最近五条格言的作者；
- 当天已经展示的格言和作者；
- 当天各大分类、小分类的出现次数；
- 当前选择的语言。

推荐会优先选择当天使用较少的大分类和小分类，再从同等候选中随机选取。
当候选池过窄时，系统会逐级放宽“同一作者当天只出现一次”的限制，但仍尽量避免
刚刚看过的作者和格言立即重复。

### 2.4 阅读与展示

- Light、Dark、Archive 三套主题；
- 主题对应的应用图标和启动图；
- Elegant 与 System 两种格言字体；
- Small、Medium、Large 三档字号；
- Fade、Horizontal、None 三种切换效果；
- 根据文本长度和屏幕高度自动缩小字号；
- 超长格言在正文区域内滚动，避免作者与来源被挤出屏幕；
- 中文和日文自动使用系统 CJK 字体，避免西文字体缺字或排版异常。

### 2.5 收藏、历史与兼容迁移

收藏以完整格言快照和收藏时间保存在 AsyncStorage 中。旧版本收藏会在读取时迁移：

- 如果旧 ID 在新目录中仍然存在，自动使用新版规范记录；
- 如果旧 ID 已经从内置目录删除，尽量保留旧文本和作者；
- 补齐 `language`、`author_id`、`subcategory` 等新版必需字段；
- 自动排序并去除重复收藏。

浏览历史与收藏分开保存，最多保留最近 100 条阅读记录。Settings 中的 Clear All
Data 会清除收藏、历史、主题、偏好和首次启动状态。

### 2.6 内容来源披露

Settings → Content Sources 会展示内容来源和许可说明。数据许可、来源与使用说明也保留在仓库文档中：

- [第三方内容说明](THIRD_PARTY_CONTENT.md)
- [格言许可说明](assets/QUOTES_LICENSE.md)
- [目录审计报告](data/quote-audit/expanded-catalog-report.json)

计划在 App Store Connect 的 **App Review Information / Notes** 中向审核团队说明
内容来源。可使用以下审核备注：

> ECHO is an offline-first trilingual quotation reading app. Its English
> catalog combines ECHO's curated records with English Wikiquote; its Simplified
> Chinese catalog uses Chinese Wikiquote; and its Japanese catalog
> uses Japanese Wikiquote. Wikiquote-derived material is used under CC BY-SA.
> Detailed attribution, licensing, provenance, and catalog audit records are
> maintained in the project documentation. The app does not require an account,
> and its core reading experience works without a server connection.

### 2.7 作者与名言语境详情

用户可以点击主页上的作者名，进入当前名言对应的人物详情页。详情页只展示当前
名言、作者姓名与身份、生平、历史回声，以及存在时的作品来源。生平取自维基百科
条目导言段；历史回声描述说话者所处的时代、出生地、职业与思想流派，以及这句话
所在的作品是什么。任一节缺少可靠素材时整节省略，不填充占位文字。它不会展示该
作者的全部名言。

**历史回声只写「说话的人身处什么世界」，不写「这句话在哪个瞬间被说出」。**
后者对全部 4,283 条记录都尚未核实，编造它即是伪造史实；该边界由
`tests/quoteContexts.test.ts` 中的反虚构正则守卫。

历史背景模板和核实状态属于内部编辑数据，不在当前用户界面展示。资料不足时直接
省略对应信息，不向用户显示“尚待核实”等维护提示。

## 3. 格言数据结构

每条格言只有一个稳定 ID、一个标准作者 ID、一个大分类和一个小分类：

```json
{
  "id": 247,
  "text": "The quote text.",
  "language": "en",
  "author_id": "william_blake",
  "author": "William Blake",
  "role": "English poet, painter, and printmaker",
  "source": "The Marriage of Heaven and Hell",
  "primary_category": "WISDOM",
  "subcategory": "PERSPECTIVE",
  "categories": ["WISDOM"]
}
```

字段说明：

| 字段 | 作用 |
| --- | --- |
| `id` | 格言稳定标识；用于收藏、历史和推荐去重 |
| `text` | 格言正文 |
| `language` | `en`、`zh-Hans` 或 `ja` |
| `author_id` | 规范化作者标识；用于可靠判断同一作者 |
| `author` | 展示给用户的作者名 |
| `role` | 作者的具体身份、职业或历史定位 |
| `source` | 已核实的作品名或数据源提供的出处；未知时省略 |
| `primary_category` | 唯一大分类 |
| `subcategory` | 该大分类下的唯一小分类 |
| `categories` | 为兼容旧结构保留，内容必须等于 `[primary_category]` |

当 `source` 存在时，卡片优先显示作品来源；没有可靠作品名时显示具体
`role`。项目不会为了填满字段而虚构作品来源。

作者与语境资料保存在本地 `QUOTE_CONTEXTS.json`。当前它覆盖发布目录的 4,283 条
格言。`quote_id` 定位当前名言的语境，`author_ref` 再定位作者生平；人物介绍还可
由 `语言:author_id` 直接定位作者档案，因此语境缺失时人物页仍能正常显示。

| `context_content_status` | 含义 |
| --- | --- |
| `attribution_only` | 仅有作者归属，原始出处与具体语境未核实 |
| `source_only` | 已知作品或出处，但具体章节、时间、场景或契机未核实 |
| `verified` | 语境由 `context_sources` 中的来源支持 |

`verification_status` 记录研究结论；`verified_composite` 表示已核实为多个时期
或场合的复合表达，不应伪装成某一次逐字发言。自动测试能验证结构和来源是否存在，
但不能替代人工事实核查。

语境研究采用以下证据分级：

| 研究结论 | 判定要求 |
| --- | --- |
| `verified` | 找到原始书籍章节、演讲日期、官方记录或同等级一手文献 |
| `needs_context` | 原始出处已确认，但尚无证据说明表达该句的直接契机 |
| `unverified` | 只能找到 Wikiquote、媒体整理或名言网站等二手传播 |
| `disputed` | 可靠考证指出误托、文字改写或作者归属存在冲突 |

搜索引擎摘要和 AI 摘要只用于发现候选资料，不能作为独立证据。每条升级记录必须
保存来源 URL、证据说明，并区分作者生平来源与名言原文来源。
浏览器核实进度和续查顺序记录在
[Quote Context Research Ledger](docs/QUOTE_CONTEXT_RESEARCH.md)。

生平与历史回声都由外部素材生成，不由模板凭空撰写：生平取自维基百科条目导言段，
历史回声取自 Wikidata 结构化声明（生卒年、出生地、职业、流派）与作品条目首句。
历史回声是 (作者, 作品) 的属性而非单条名言的属性，因此同一部作品的多条引文
共享同一段背景——这是语义正确的，不做人为区分。

先抓取素材（联网，约一分钟；缓存写入 `data/author-biographies.json`，未纳入
版本控制，可随时重建），再生成：

```bash
node scripts/fetch-author-biographies.mjs
node scripts/generate-editorial-notes.mjs
```

## 4. 分类体系

| 大分类 | 五个小分类 |
| --- | --- |
| MINDFULNESS | PRESENCE、AWARENESS、MEDITATION、STILLNESS、INNER_PEACE |
| WISDOM | PHILOSOPHY、TRUTH、PERSPECTIVE、JUDGMENT、SELF_KNOWLEDGE |
| COURAGE | BRAVERY、RESILIENCE、RISK、ADVERSITY、LEADERSHIP |
| LOVE | ROMANTIC_LOVE、FAMILY、FRIENDSHIP、COMPASSION、SELF_LOVE |
| NATURE | WILDERNESS、SEASONS、ANIMALS、OCEAN、COSMOS |
| GROWTH | LEARNING、DISCIPLINE、CHANGE、AMBITION、CREATIVITY |
| HEALING | GRIEF、FORGIVENESS、RECOVERY、HOPE、REST |
| GRATITUDE | APPRECIATION、CONTENTMENT、JOY、HUMILITY、ABUNDANCE |

## 5. 内容质量规则

当前发布目录必须满足：

- 英文 1,465 条、简体中文 891 条、日语 1,927 条，共 4,283 条；
- 全部 ID 在三个目录之间保持唯一；
- 标准化后的正文不存在重复；
- 每条记录都通过运行时 Quote schema 验证；
- 每条记录只有一个大分类和一个合法小分类；
- 8 个大分类和 40 个小分类都有内容；
- 作者和身份不能为空；
- 不使用 `Writer`、`Author`、`Unknown` 等泛化身份；
- 不把数据平台名当作作者名；
- 清理残留 Wiki 标记、URL、异常空白和标点粘连；
- 未核实的作品来源保持缺省；
- Wikiquote 补充记录保留页面与修订版本级来源记录。

不同语言的作者数量上限来自各自数据源结构，因此并不相同：

- 英文目录：单一作者最多 16 条；
- 中文目录：单一来源集合或作者 ID 最多 100 条；
- 日语目录：单一作者或人物页面最多 21 条。

测试和程序化审计不能代替人工事实核查。社区协作来源中的作者归属、译文和作品名
仍需要持续抽样复核。

## 6. 架构概览

ECHO 采用分层架构，数据从内层向外层单向流动：

```text
┌─────────────────────────────────────────────────────────┐
│                 app/index.tsx                           │
│              (状态机 + 业务编排)                         │
├─────────────────────────────────────────────────────────┤
│   screens/          │        components/                │
│   (10个页面组件)     │     (UI组件: 卡片/弹层/背景)      │
├─────────────────────────────────────────────────────────┤
│   services/         │      recommendation/             │
│   (分享/图标)        │     (纯函数推荐算法)              │
├─────────────────────────────────────────────────────────┤
│   storage/          │          data/                    │
│   (AsyncStorage)    │    (JSON校验/索引/查询)            │
├─────────────────────────────────────────────────────────┤
│                    constants/                           │
│            (调色板、类目、心情映射)                        │
└─────────────────────────────────────────────────────────┘
```

### 核心数据流

```text
用户操作
    ↓
setState (乐观更新，UI立即响应)
    ↓
AsyncStorage.setItem (异步持久化，失败不回滚)
    ↓
下次启动: Promise.all 读回全部状态
```

### 状态管理

- **工具**: React `useState` + AsyncStorage 手动持久化
- **无 Redux/Zustand/Jotai**，无 Context
- **全部状态集中在 `app/index.tsx`**，约 20 个 `useState`
- **持久化策略**: 乐观更新（先 setState，后写盘）

### 关键模块职责

| 模块 | 职责 | 特点 |
|------|------|------|
| `constants/` | 配色、类目、心情定义 | 纯静态，无依赖 |
| `data/quotes.ts` | JSON → 校验 → 冻结 → Map索引 | 只读，启动时加载 |
| `storage/` | AsyncStorage 读写 | 每个领域一个文件 |
| `recommendation/` | 纯函数推荐算法 | 三档回退 + 均衡 |
| `app/index.tsx` | 状态机 + 页面导航 | 手写状态机，非路由 |


## 7. 项目结构

```text
src/
├── app/
│   ├── _layout.tsx                  # Expo Router 根布局
│   └── index.tsx                    # 页面状态、初始化与功能协调
├── components/
│   ├── common/                      # 启动页、Archive 背景等公共视觉组件
│   └── home/                        # 首页、格言卡片、操作栏和弹层
├── constants/categories.ts         # 大小分类、心情选项和映射
├── data/quoteContexts.ts            # 作者与当前名言语境的 ID 索引
├── data/quotes.ts                   # 数据验证、冻结、索引和查询
├── recommendation/selector.ts      # 不依赖 UI/存储的纯推荐算法
├── screens/                         # 设置、偏好、语言和首次启动页面
├── services/appIcon.ts             # 主题与候选应用图标同步
└── storage/
    ├── preferences.ts               # 主题、字体、动画、语言和心情偏好
    ├── quoteRotation.ts             # 当日推荐状态持久化
    ├── savedQuotes.ts               # 收藏、去重和旧数据迁移
    ├── viewedQuotes.ts              # 浏览历史持久化
    └── clearLocalData.ts            # 清理 ECHO 本地数据

assets/
├── quotes.json                      # 英文目录
├── quotes.zh-Hans.json              # 简体中文目录
├── quotes.ja.json                   # 日语目录
└── QUOTES_LICENSE.md                # 格言数据许可说明

scripts/
├── prepare-v1.1-quotes.mjs          # 历史英文受控数据迁移脚本
├── import-english-quotes.mjs        # 英文补充与来源记录
├── import-chinese-quotes.mjs        # 中文导入与来源记录
├── import-japanese-quotes.mjs       # 日语导入与来源记录
├── wikiquote-support.mjs            # Wikiquote API、清理与限速工具
└── audit-quote-catalogs.mjs         # 三语目录统一质量门

tests/
├── accessibility.test.ts            # 三套主题 WCAG AA 对比度
├── contextLookup.test.ts            # 数字/字符串 ID 与典型语境查询
├── quoteData.test.ts                 # Quote schema 与只读目录行为
├── quoteContexts.test.ts            # 已发布目录的语境完整性测试
├── quotes.test.ts                   # 数据目录测试
├── selector.test.ts                 # 推荐算法测试
└── shareQuote.test.ts               # 分享文字与三语界面文案
```

## 8. 本地开发

项目正确根目录是：

```text
/Users/allen/Documents/GitHub/echo
```

不要从旧的 `/Users/allen/Documents/GitHub/echo/ECHO` 目录启动。

首次安装：

```bash
cd /Users/allen/Documents/GitHub/echo
npm ci
```

ECHO 只使用 development build，不再使用 Expo Go。首次生成并安装本地
iOS development build：

```bash
npm run ios
```

以后只启动本地 Metro：

```bash
npm start
```

在 iPhone 17 模拟器中重新构建并启动 development build：

```bash
npm run ios
```

该命令会从当前项目重新构建原生包，等待 `127.0.0.1:8082` 的 iOS bundle 健康检查
通过后再打开 App，不会连接旧项目的 8081 端口。

清理 Metro 缓存后启动：

```bash
npm start -- --clear
```

使用 EAS 生成真机 development build：

```bash
npx eas build --profile development --platform ios
```

如果启动页长时间不消失，先确认没有旧目录的 Metro 仍占用 `8081`：

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN
```

## 9. 测试与质量检查

只运行自动测试：

```bash
npm run test
```

运行完整本地检查：

```bash
npm run check
```

`npm run check` 会依次执行：

1. Node 测试；
2. TypeScript 严格类型检查；
3. Expo Doctor 依赖与配置检查。

目前测试覆盖三语目录、推荐算法、已发布目录的语境对应关系、作者引用、核实状态、
分享文案、Quote 边界数据和主题颜色对比度，
来源约束，以及数字和字符串 ID 的查询行为。React Native 的作者点击交互现阶段
仍在模拟器中人工检查；若要自动模拟点击，需要引入 React Native Testing Library。

单独执行三语目录审计：

```bash
node scripts/audit-quote-catalogs.mjs
```

`expo-doctor` 的在线配置检查需要访问 Expo 服务。如果只出现
`ECONNRESET`，应先排查网络，而不是立即判断为源代码错误。

## 10. 数据重建

以下命令会重新生成或修改格言目录，不应在不了解数据来源和差异的情况下随意运行：

```bash
node scripts/prepare-v1.1-quotes.mjs
node scripts/import-english-quotes.mjs
node scripts/import-chinese-quotes.mjs
node scripts/import-japanese-quotes.mjs
node scripts/audit-quote-catalogs.mjs
```

来源记录（未发布的 inBox Card 审计文件不会被 EAS 打包）：

- [英文来源记录](data/quote-audit/english-provenance.json)
- [中文来源记录](data/quote-audit/chinese-provenance.json)
- [日语来源记录](data/quote-audit/japanese-provenance.json)
- [合并审计报告](data/quote-audit/expanded-catalog-report.json)

### 10.1 Git 与 EAS 的大文件分流

三语格言目录、`QUOTE_CONTEXTS.json` 和生成的审计资料属于本地大数据文件。
`.gitignore` 阻止它们进入 Git 历史；`.easignore` 先使用相同规则，再用否定规则将
应用运行时必需的四个 JSON 重新加入 EAS 上传包：

```text
!/QUOTE_CONTEXTS.json
!/assets/quotes.json
!/assets/quotes.zh-Hans.json
!/assets/quotes.ja.json
```

因此 EAS Build 必须从实际保存这四个本地数据集的电脑执行。只克隆 Git 仓库的
环境不包含这些文件，不能生成完整应用包。不要删除 `.easignore` 中的四条例外，
否则 TypeScript/Metro 构建会因缺少 JSON 导入而失败。

## 11. 隐私、法律与支持

ECHO 1.0 的核心功能离线运行，不要求账号。偏好、收藏、历史和主题保存在本机。

- [隐私政策](https://sarada.yachts/projects/echo/privacy)
- [服务条款](https://sarada.yachts/projects/echo/terms)
- 反馈邮箱：`abc510433622@gmail.com`
- [TestFlight 提交流程](docs/TESTFLIGHT_SUBMISSION.md)

## 12. 当前范围限制

v1.0 暂不包含：

- 广告和付费功能；
- Widget、通知和远程推送；
- 用户账号和云同步；
- 跨设备收藏同步；
- 更深入的 VoiceOver 手势与真实设备 Dynamic Type UI 自动化；
- 后台内容管理系统；
- 云端内容管理和数据导入导出。

这些功能应在 TestFlight 验证内容质量、推荐体验和稳定性之后再决定优先级。

## 13. v1.2 建议方向

1. 建立内容复核报告，优先人工核查最常展示的 200 条格言；
2. 建立作者规范表，统一别名、时代、国籍与身份；
3. 增加开发环境下的“本条推荐原因”诊断信息；
4. 补充日期切换、候选耗尽、收藏迁移和长会话测试；
5. 完成 VoiceOver、Dynamic Type、减少动态效果和对比度检查；
6. 根据 TestFlight 反馈决定是否恢复浏览历史；
7. 在用户主动发送反馈时附带版本、构建号、主题和系统版本。

广告、购买、Widget、远程推送、账号与云同步继续后置，直到核心阅读体验获得足够的
真实测试证据。
