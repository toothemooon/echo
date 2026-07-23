# ECHO

ECHO 是一款使用 Expo 与 React Native 开发的离线优先三语格言阅读应用。
它以安静、克制的每日阅读体验为核心，提供主题切换、字体设置、收藏、
心情偏好、三语内容和带有防重复机制的推荐轮换。

当前版本：**1.1.0**

## 1. 产品定位

ECHO 不要求注册账号，也不依赖服务器才能完成核心阅读流程。应用内置格言目录，
主题、偏好、收藏和当日推荐状态均保存在设备本地。

v1.1 聚焦以下目标：

- 让首次使用者无需理解分类系统，也能获得合适的阅读内容；
- 将英文、简体中文和日语内容统一到同一套数据结构；
- 减少短时间内重复出现相同格言、作者或内容类别；
- 提升长文本、中文和日文的显示稳定性；
- 建立可重复执行的数据导入、来源记录和质量检查流程；
- 保持 MVP 简单，不加入广告、付费墙、通知、Widget、账号或云同步。

## 2. v1.1 主要功能

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
| 英文 | `assets/quotes.json` | 2,000 |
| 简体中文 | `assets/quotes.zh-Hans.json` | 2,000 |
| 日语 | `assets/quotes.ja.json` | 2,000 |
| 合计 | 三个目录 | 6,000 |

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

### 2.5 收藏与兼容迁移

收藏以完整格言快照和收藏时间保存在 AsyncStorage 中。v1.1 增加旧收藏迁移：

- 如果旧 ID 在新目录中仍然存在，自动使用新版规范记录；
- 如果旧 ID 已经从内置目录删除，尽量保留旧文本和作者；
- 补齐 `language`、`author_id`、`subcategory` 等新版必需字段；
- 自动排序并去除重复收藏。

### 2.6 内容来源披露

设置页的 `Content Sources` 可以查看数据来源入口。数据许可、来源与使用说明见：

- [第三方内容说明](THIRD_PARTY_CONTENT.md)
- [格言许可说明](assets/QUOTES_LICENSE.md)
- [6,000 条目录审计报告](data/quote-audit/expanded-catalog-report.json)

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

- 英文、简体中文、日语各 2,000 条，共 6,000 条；
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

## 6. 项目结构

```text
src/
├── app/
│   ├── _layout.tsx                  # Expo Router 根布局
│   └── index.tsx                    # 页面状态、初始化与功能协调
├── components/
│   ├── common/                      # 启动页、Archive 背景等公共视觉组件
│   └── home/                        # 首页、格言卡片、操作栏和弹层
├── constants/categories.ts         # 大小分类、心情选项和映射
├── data/quotes.ts                   # 数据验证、冻结、索引和查询
├── recommendation/selector.ts      # 不依赖 UI/存储的纯推荐算法
├── screens/                         # 设置、偏好、语言和首次启动页面
├── services/appIcon.ts             # 主题与候选应用图标同步
└── storage/
    ├── preferences.ts               # 主题、字体、动画、语言和心情偏好
    ├── quoteRotation.ts             # 当日推荐状态持久化
    └── savedQuotes.ts               # 收藏、去重和旧数据迁移

assets/
├── quotes.json                      # 英文目录
├── quotes.zh-Hans.json              # 简体中文目录
├── quotes.ja.json                   # 日语目录
└── QUOTES_LICENSE.md                # 格言数据许可说明

scripts/
├── prepare-v1.1-quotes.mjs          # v1.1 英文受控数据迁移
├── import-english-quotes.mjs        # 英文补充与来源记录
├── import-chinese-quotes.mjs        # 中文导入与来源记录
├── import-japanese-quotes.mjs       # 日语导入与来源记录
├── wikiquote-support.mjs            # Wikiquote API、清理与限速工具
└── audit-quote-catalogs.mjs         # 三语目录统一质量门

tests/
├── quotes.test.ts                   # 数据目录测试
└── selector.test.ts                 # 推荐算法测试
```

## 7. 本地开发

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

使用 Expo Go 启动 iOS 模拟器：

```bash
npx expo start --ios
```

清理 Metro 缓存后启动：

```bash
npx expo start --ios --clear
```

使用本地原生开发构建：

```bash
npx expo run:ios
```

如果启动页长时间不消失，先确认没有旧目录的 Metro 仍占用 `8081`：

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN
```

## 8. 测试与质量检查

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

单独执行三语目录审计：

```bash
node scripts/audit-quote-catalogs.mjs
```

`expo-doctor` 的在线配置检查需要访问 Expo 服务。如果只出现
`ECONNRESET`，应先排查网络，而不是立即判断为源代码错误。

## 9. 数据重建

以下命令会重新生成或修改格言目录，不应在不了解数据来源和差异的情况下随意运行：

```bash
node scripts/prepare-v1.1-quotes.mjs
node scripts/import-english-quotes.mjs
node scripts/import-chinese-quotes.mjs
node scripts/import-japanese-quotes.mjs
node scripts/audit-quote-catalogs.mjs
```

来源记录：

- [英文来源记录](data/quote-audit/english-provenance.json)
- [中文来源记录](data/quote-audit/chinese-provenance.json)
- [日语来源记录](data/quote-audit/japanese-provenance.json)
- [合并审计报告](data/quote-audit/expanded-catalog-report.json)

## 10. 隐私、法律与支持

ECHO 1.1 的核心功能离线运行，不要求账号。偏好、收藏和推荐状态保存在本机。

- [隐私政策](https://sarada.yachts/projects/echo/privacy)
- [服务条款](https://sarada.yachts/projects/echo/terms)
- 反馈邮箱：`abc510433622@gmail.com`
- [TestFlight 提交流程](docs/TESTFLIGHT_SUBMISSION.md)

## 11. 当前范围限制

v1.1 暂不包含：

- 广告和付费功能；
- 通知和 Widget；
- 用户账号和云同步；
- 跨设备收藏同步；
- 完整无障碍适配；
- 后台内容管理系统；
- Saved / History 命名重构。

这些功能应在 TestFlight 验证内容质量、推荐体验和稳定性之后再决定优先级。

## 12. v1.2 建议方向

1. 建立内容复核报告，优先人工核查最常展示的 200 条格言；
2. 建立作者规范表，统一别名、时代、国籍与身份；
3. 增加开发环境下的“本条推荐原因”诊断信息；
4. 补充日期切换、候选耗尽、收藏迁移和长会话测试；
5. 完成 VoiceOver、Dynamic Type、减少动态效果和对比度检查；
6. 根据 TestFlight 反馈决定是否恢复浏览历史；
7. 在用户主动发送反馈时附带版本、构建号、主题和系统版本。

广告、购买、Widget、通知、账号与云同步继续后置，直到核心阅读体验获得足够的
真实测试证据。
