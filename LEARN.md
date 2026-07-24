# ECHO 1.1 实现学习手册

这份文档依据当前工作区相对于 Git `HEAD` 的改动、v1.1 新增文件以及实际调用关系，
按功能模块解释 ECHO 1.1 做了什么、为什么这样设计，以及这些代码在运行时如何协作。

README 面向项目使用与维护；本文面向学习实现。阅读本文时，重点不是背 API，
而是理解下面四个边界：

- 内容数据只负责描述事实；
- 推荐算法只负责选择；
- 存储层只负责跨重启保存状态；
- React 页面只负责组织状态、交互和显示。

## 1. 从 v1.0 到 v1.1：总体变化

v1.0 的主要流程可以简化为：

```text
读取英文 quotes.json
        ↓
按用户勾选的分类随机选择
        ↓
显示格言并允许收藏
```

v1.1 的流程变成：

```text
英文 + 简体中文 + 日语目录
        ↓
运行时 schema 验证、冻结与 ID 索引
        ↓
首次启动心情问答 / 设置页阅读偏好
        ↓
指定语言 + 偏好分类 + 最近历史 + 当日轮换状态
        ↓
纯推荐算法选择候选
        ↓
记录当日作者、格言、分类和小分类计数
        ↓
自适应格言卡片显示 / 收藏 / 分享
```

这次升级不是简单“增加三种语言”，而是把数据结构、推荐规则、持久化、
首次启动流程、设置页和自动检查一起改造，使它们围绕同一套规则运行。

## 2. 版本与工程配置模块

涉及文件：

- `app.json`
- `package.json`
- `package-lock.json`
- `tsconfig.json`

### 2.1 版本号变化

`app.json` 和 `package.json` 从 `1.0.0` 升级到 `1.1.0`，Android
`versionCode` 从 1 升级到 2。

作用：

- 应用内部版本与 TestFlight / 商店版本描述保持一致；
- Android 使用递增的 `versionCode` 区分新构建；
- 依赖工具和日志可以识别当前代码属于 v1.1。

注意：EAS 当前使用远程 iOS build number。`app.json` 中的
`ios.buildNumber` 仍会进入 manifest，但真正用于上传的新构建号由 EAS 远程递增。

### 2.2 测试运行依赖

新增开发依赖：

- `tsx`：让 Node 测试运行器可以直接加载 TypeScript 测试；
- `@types/node`：为 `node:test`、`node:assert` 等 Node API 提供类型。

新增脚本：

```json
"test": "node --import tsx --test tests/**/*.test.ts",
"check": "npm run test && tsc --noEmit && npx expo-doctor"
```

作用：

- 不引入 Jest 等较重框架，也能测试纯 TypeScript 业务逻辑；
- 用一条 `npm run check` 串联行为测试、类型检查和 Expo 环境检查；
- 将“可以启动”提升为“关键约束有自动验证”。

### 2.3 TypeScript 类型环境

`tsconfig.json` 明确加入：

```json
"types": ["node", "react", "react-native"]
```

作用：

- 测试文件可以识别 Node 类型；
- 应用文件继续识别 React 和 React Native 类型；
- 在同一项目中同时维护移动端代码和 Node 数据脚本/测试时，减少全局类型缺失。

## 3. 应用协调层：`src/app/index.tsx`

`index.tsx` 是 v1.1 改动最集中的文件。它不是推荐算法，也不是存储实现，而是
把页面、数据和事件连接起来的协调层。

### 3.1 新增跨页面状态

v1.1 新增：

```text
mood                 当前心情偏好
onboardingComplete   首次启动是否完成
quoteLanguage        当前格言语言
isSelectingQuote     是否正在异步选择下一条
```

作用：

- `mood` 让设置页展示用户能理解的偏好摘要，而不是“选中了几个分类”；
- `onboardingComplete` 决定启动后进入问答还是主页；
- `quoteLanguage` 保证推荐只在当前语言目录中选择；
- `isSelectingQuote` 防止用户快速连续点击时启动多个异步推荐，造成重复追加或状态竞争。

### 3.2 初始化改为并行读取

启动时使用 `Promise.all` 同时读取：

- 主题；
- 内部偏好分类；
- 收藏；
- 字体；
- 字号；
- 动画；
- 格言语言；
- 心情偏好；
- 首次启动完成状态。

作用：

- 减少多个 AsyncStorage 请求串行等待的时间；
- 所有需要恢复的用户设置在同一个初始化阶段完成；
- 只有完成首次启动的用户才立即请求第一条推荐。

### 3.3 启动分支顺序

当前渲染顺序为：

```text
字体或本地状态未完成 / 自定义启动动画未结束
        ↓
显示 SplashScreen
        ↓
尚未完成首次启动
        ↓
显示 OnboardingScreen
        ↓
已有第一条格言
        ↓
显示主页
```

v1.0 将“必须已经取得 currentQuote”也放在启动页条件中。v1.1 将首次启动问答
从这个条件中拆开，否则新用户因为还没有第一条格言，会永远无法离开启动页进入问答。

### 3.4 偏好更新

`changeMood()` 会完成四件事：

1. 把心情答案转换为内部大分类；
2. 更新 React State；
3. 保存心情与分类；
4. 在当前语言下重新取得第一条推荐。

首次启动调用时还会保存 `onboardingComplete = true`。

作用：

- 用户面对的是自然语言问题；
- 推荐层仍然使用结构化分类；
- 首次启动和设置页复用同一条业务链，不产生两套逻辑。

### 3.5 语言更新

`changeQuoteLanguage()` 会：

1. 保存新语言；
2. 在同一偏好下请求该语言的新格言；
3. 将 `quoteHistory` 重置为新格言；
4. 将 `historyIndex` 重置为 0。

作用：

- 切换到日语后，点击“上一条”不会回到英文；
- 语言边界在建立候选池时就被执行，而不是显示前临时过滤；
- 浏览历史保持单一语言，交互更容易理解。

### 3.6 下一条改为异步推荐

v1.0 使用简单的 `getRandomQuote()`；v1.1 使用
`getNextRecommendedQuote()`。

它需要读取并更新 AsyncStorage 中的当日轮换状态，因此 `goNext()` 改为异步函数。
`isSelectingQuote` 与原有 `isAnimating` 分别防止：

- 推荐尚未完成时重复发起选择；
- 动画尚未结束时重复改变索引。

这两个锁保护的是不同阶段，不能互相替代。

## 4. 分类与心情映射模块

涉及文件：`src/constants/categories.ts`

### 4.1 八个大分类、四十个小分类

每个大分类固定包含五个小分类：

| 大分类 | 小分类 |
| --- | --- |
| MINDFULNESS | PRESENCE、AWARENESS、MEDITATION、STILLNESS、INNER_PEACE |
| WISDOM | PHILOSOPHY、TRUTH、PERSPECTIVE、JUDGMENT、SELF_KNOWLEDGE |
| COURAGE | BRAVERY、RESILIENCE、RISK、ADVERSITY、LEADERSHIP |
| LOVE | ROMANTIC_LOVE、FAMILY、FRIENDSHIP、COMPASSION、SELF_LOVE |
| NATURE | WILDERNESS、SEASONS、ANIMALS、OCEAN、COSMOS |
| GROWTH | LEARNING、DISCIPLINE、CHANGE、AMBITION、CREATIVITY |
| HEALING | GRIEF、FORGIVENESS、RECOVERY、HOPE、REST |
| GRATITUDE | APPRECIATION、CONTENTMENT、JOY、HUMILITY、ABUNDANCE |

作用：

- 推荐可以先平衡大方向，再平衡相同方向中的细分内容；
- 每条格言只有一个计数归属，避免多标签导致一次展示同时增加多个类别；
- 数据审计可以明确判断分类是否合法。

### 4.2 心情选项

`MOOD_OPTIONS` 将每个用户可见答案与一组内部分类绑定。例如：

```text
overwhelmed  → MINDFULNESS + HEALING
challenge    → COURAGE + GROWTH
quiet        → MINDFULNESS + NATURE
surprise     → 全部分类
```

`categoriesForMood()` 负责返回分类，`moodSummary()` 负责给设置页显示摘要。

作用：

- 文案、映射和摘要只有一个事实来源；
- Onboarding 与 Preferences 不会因各写一份映射而产生差异；
- 以后调整推荐策略时，可以只修改常量层。

## 5. 三语内容模型与运行时验证

涉及文件：

- `src/data/quotes.ts`
- `assets/quotes.json`
- `assets/quotes.zh-Hans.json`
- `assets/quotes.ja.json`

### 5.1 Quote schema 扩展

v1.1 的 Quote 新增或强化：

```ts
type Quote = {
  id: number | string;
  text: string;
  language: "en" | "zh-Hans" | "ja";
  author_id: string;
  author: string;
  role: string;
  source?: string;
  primary_category: Category;
  subcategory: Subcategory;
  categories: Category[];
};
```

关键变化：

- `language`：支持按语言建立候选池；
- `author_id`：用稳定值识别同一作者；
- `subcategory`：支持第二层均衡；
- `source` 保持可选：未知来源不虚构；
- `categories` 仅用于兼容旧结构，必须等于 `[primary_category]`。

### 5.2 为什么不能只比较作者显示名

作者显示名可能存在：

- 大小写差异；
- 空格和标点差异；
- 重音符号；
- 日文、中文、英文译名；
- 别名或历史姓名。

推荐系统使用 `author_id`，才能更稳定地执行最近作者排除和当日作者去重。
`author` 则继续保留适合用户阅读的形式。

### 5.3 运行时防线

`isQuote()` 会检查：

- ID 是否为有效数字或非空字符串；
- 语言是否合法；
- 作者、作者 ID、正文和身份是否非空；
- 大分类是否合法；
- 小分类是否属于该大分类；
- `categories` 是否只有一个值且等于大分类；
- `source` 若存在，是否为非空字符串。

导入 JSON 后，`validateQuoteCollection()` 还会：

- 丢弃不合法记录；
- 丢弃重复 ID；
- 在开发环境输出统计警告；
- 冻结每条 Quote 和整个目录。

作用：

- 即使 JSON 被手动改坏，运行时也不会无条件信任它；
- 冻结后的内置目录不会被 UI 意外修改；
- 数据错误在开发阶段更容易被定位。

### 5.4 三语合并与 ID 索引

三个 JSON 被合并为 `BUILT_IN_QUOTES`，同时建立 `QUOTES_BY_ID` Map。

作用：

- 推荐层面对统一只读数组；
- 收藏迁移可以通过 ID 快速查找新版记录；
- 不需要每次查询收藏都遍历全部 6,000 条数据。

## 6. 内容迁移、扩展与审计流水线

涉及文件：

- `scripts/prepare-v1.1-quotes.mjs`
- `scripts/import-english-quotes.mjs`
- `scripts/import-chinese-quotes.mjs`
- `scripts/import-japanese-quotes.mjs`
- `scripts/wikiquote-support.mjs`
- `scripts/audit-quote-catalogs.mjs`
- `data/quote-audit/*.json`

### 6.1 英文目录

英文导入流程保留通过质量规则的原有受控记录，再从 English Wikiquote 补充到
2,000 条。

主要处理：

- 保留符合规则的稳定 ID；
- 清理残留 Wiki 语法和异常空白；
- 排除争议、误传、无来源等不可靠章节；
- 排除明显不是英文正文的记录；
- 通过 Wikidata 描述或人工覆盖补充具体身份；
- 限制单作者数量；
- 保存页面 ID、修订 ID 和永久版本链接。

作用：

- 不因为扩容而完全丢弃已整理的本地数据；
- 对新增社区数据保留可追溯入口；
- 降低单一高产作者占据推荐池的风险。

### 6.2 中文目录

中文流程先导入 inBox Card 中可用且不重复的数据，再从中文维基语录补足到
2,000 条。

主要处理：

- 保留数据源给出的正文、作者和可用出处；
- 清理导航文字、问句、采访上下文和 Wiki 标记；
- 通过中文或英文 Wikidata 描述补充作者身份；
- 排除仍只能得到泛化“历史人物”身份的记录；
- 保存 inBox 集合信息和 Wikiquote 修订来源。

作用：

- 在数量目标和来源可追溯之间取得平衡；
- 不把平台名写成作者；
- 不将抓取过程中的无关信息展示在作者卡片下方。

### 6.3 日语目录

日语流程递归读取日语维基语录中的日本人物与职业分类，并整理为 2,000 条日语原文。

主要处理：

- 限制分类遍历深度和请求速度；
- 排除叙述句、报道句、导航文字和残留标记；
- 优先使用日文 Wikidata 身份描述；
- 日文描述不可用时再使用英文描述或分类身份；
- 限制单人物页面数量；
- 保存修订级来源。

作用：

- 避免把 Anime-chan 的英文译文或中文“一言”内容冒充日语；
- 保持日语目录确实是日语文本；
- 为后续人工核查保留页面版本。

### 6.4 共享 Wikiquote 工具

`wikiquote-support.mjs` 封装：

- MediaWiki API 请求；
- 请求间隔、重试和退避；
- 分类递归；
- 页面正文、分类、修订与 Wikidata 描述读取；
- Wiki 文本清理；
- 标准化重复键。

作用：

- 三种导入器不重复实现网络和清理逻辑；
- 对公共 API 保持较温和的请求频率；
- 所有语言使用相近的追溯格式。

### 6.5 统一审计

`audit-quote-catalogs.mjs` 检查：

- 每种语言是否恰好 2,000 条；
- 总数是否为 6,000；
- ID 和标准化正文是否重复；
- 语言字段是否与目录一致；
- 作者、身份和分类是否完整；
- 是否残留泛化身份、Wiki 语法或 URL；
- 分类与小分类覆盖是否符合发布要求。

审计结果写入：

```text
data/quote-audit/expanded-catalog-report.json
```

作用：

- 数据扩容从一次性手工操作变成可以重复检查的流程；
- 发布前可以判断目录是否发生结构性退化；
- 报告可以用于代码审查和 TestFlight 版本留档。

## 7. 首次启动与偏好页面

涉及文件：

- `src/screens/OnboardingScreen.tsx`
- `src/screens/PersonalizationScreen.tsx`
- `src/constants/categories.ts`

### 7.1 OnboardingScreen

首次启动页显示一组心情答案，并通过 `onSelect` 将用户选择交给 `index.tsx`。
它不直接写 AsyncStorage，也不直接请求格言。

作用：

- 页面保持展示组件职责；
- 存储失败和推荐失败由协调层统一处理；
- 相同 UI 可以独立调整而不改变业务规则。

### 7.2 PersonalizationScreen

v1.0 的页面让用户手动勾选 8 个 Categories；v1.1 改为 `Preferences`，
复用相同心情选项。

作用：

- 用户不需要理解内部分类体系；
- 设置行为与首次启动体验一致；
- 避免“至少必须勾选一个分类”等技术限制直接暴露给用户。

## 8. 语言切换模块

涉及文件：

- `src/screens/LanguageSettingsScreen.tsx`
- `src/storage/preferences.ts`
- `src/app/index.tsx`
- `src/recommendation/selector.ts`

页面提供：

```text
English
简体中文
日本語
```

语言值保存在 `@echo/quote_language`。读取到未知值时回退到英文。

推荐器在建立 `preferredPool` 时执行语言过滤：

```text
符合偏好分类
+ 符合指定语言
= 语言候选池
```

作用：

- 不会先从全部数据随机抽取，再发现语言错误后丢弃；
- 每次推荐都保证语言条件；
- 重启后仍保留用户选择。

`languageCounts` 仍保留在轮换状态中，用于未明确限制语言或未来混合语言模式下的
均衡。当前设置为单一语言时，主要约束来自 `language` 参数。

## 9. 推荐算法模块

涉及文件：`src/recommendation/selector.ts`

这是一个纯函数模块：

- 不访问 AsyncStorage；
- 不访问 React State；
- 不处理动画；
- 输入相同且传入固定 `random` 时，输出可预测。

### 9.1 输入

`selectNextQuote()` 接收：

- 全部格言；
- 偏好分类；
- 当前会话最近格言；
- 当日轮换状态；
- 可选语言；
- 可替换的随机函数。

测试注入 `random: () => 0`，可以避免随机性导致测试不稳定。

### 9.2 严格候选池

第一层会排除：

```text
当前会话出现过的 quote ID
当天出现过的 quote ID
最近五条的 author_id
当天出现过的 author_id
```

之后：

1. 将偏好分类按当天使用次数从少到多排序；
2. 找到第一个仍有候选的分类；
3. 选择该分类中使用次数最少的小分类；
4. 在同等候选中选择使用次数较少的语言；
5. 最后随机选一条。

“随机”发生在所有业务约束执行之后，因此不会破坏分类均衡。

### 9.3 降级策略

如果严格候选池为空：

1. 先允许当天出现过的作者再次出现；
2. 仍排除当天和会话中已经出现的格言；
3. 仍排除最近五位作者；
4. 极长会话下再放宽当天格言限制，但仍防止会话重复和最近作者立即重复。

约束优先级可理解为：

```text
防止立即重复
    >
防止同一格言重复
    >
当日作者唯一
    >
大分类均衡
    >
小分类均衡
    >
最终随机
```

作用：

- 窄偏好不会因为作者耗尽而完全无法继续；
- 放宽约束时有明确顺序；
- 推荐不会在小型候选池中突然停止。

### 9.4 记录选择

`recordSelection()` 返回新的 RotationState，不直接修改旧对象。

它更新：

- `shownQuoteIds`
- `shownAuthorIds`
- `categoryCounts`
- `subcategoryCounts`
- `languageCounts`

作用：

- 保持纯函数和不可变数据思路；
- 更容易测试每次选择对状态的影响；
- 存储层可以决定何时将结果写入设备。

## 10. 每日轮换持久化

涉及文件：`src/storage/quoteRotation.ts`

状态保存在：

```text
@echo/quote_rotation_v1
```

### 10.1 本地日期

日期以设备本地年月日生成，而不是直接截取 UTC 日期。

作用：

- 用户所在时区的午夜才开始新一天；
- 东京时间的 7 月 24 日不会因为 UTC 仍是 7 月 23 日而继续旧状态。

### 10.2 自动重置

读取状态时，如果保存日期与今天不同，直接返回空状态。

作用：

- 不需要后台定时器；
- 应用在跨日后第一次请求推荐时自动开始新一轮；
- 避免长期积累 ID 造成存储无限增长。

### 10.3 容错

读取损坏或旧结构时，各字段都有空值回退；写入失败时，当前推荐仍然返回，只是
本次当日状态不能持久保存。

作用：

- AsyncStorage 异常不会让主页完全不可用；
- 推荐功能优先保持可用，持久化属于增强能力。

## 11. 偏好存储模块

涉及文件：`src/storage/preferences.ts`

v1.1 新增键：

```text
@echo/quote_language
@echo/mood_preference
@echo/onboarding_complete
```

每个读取函数都会验证允许值，并在无效时回退：

- 语言 → `en`
- 心情 → `surprise`
- 首次启动 → `false`

作用：

- 手动修改、旧版本残留或损坏数据不会直接进入 UI；
- 类型系统与运行时验证共同保护状态；
- 新安装和升级安装都有明确默认值。

内部仍保留 `preferred_categories`，因为推荐器最终需要分类数组。用户选择心情后，
协调层同时保存心情和由它推导出的分类。

## 12. 收藏兼容迁移模块

涉及文件：`src/storage/savedQuotes.ts`

v1.1 的 Quote schema 增加 `language`、`author_id` 和 `subcategory`。
如果收藏读取仍只接受新 schema，旧用户升级后会看见收藏全部消失。

### 12.1 迁移顺序

读取每条旧记录时：

1. 如果已经符合新 schema，直接使用；
2. 如果 ID 能在新版内置目录找到，使用新版 Quote 替换旧快照；
3. 如果内置目录找不到，但旧文本、作者、身份和分类仍有效，则保留快照；
4. 为保留的旧快照生成兼容 `author_id`；
5. 默认语言设为英文；
6. 使用该大分类的第一个小分类作为迁移默认；
7. 按收藏时间排序并按 ID 去重。

作用：

- 数据目录重构不等于删除用户收藏；
- 新目录能提供更准确记录时优先采用新版本；
- 已删除内容仍尽量保留用户当时收藏的文本。

### 12.2 已知限制

无法在没有额外信息时准确判断旧收藏的真实语言和小分类，因此迁移只能采用兼容
默认值。这是“保留数据优先”的策略，不代表内容层已经重新核实。

## 13. 格言卡片与长文本适配

涉及文件：

- `src/components/home/QuoteCard.tsx`
- `src/components/home/ShareCard.tsx`

### 13.1 CJK 字体策略

英文可以使用 Cormorant Garamond；中文与日语使用系统字体。

作用：

- 避免西文字体缺少中文或日文字形；
- 避免系统回退造成不可预测的字重与斜体；
- 中文和日文正文保持正常体，提升可读性。

### 13.2 自适应字号

实际字号综合：

- 用户选择的 Small / Medium / Large；
- 正文字符长度；
- 屏幕高度。

文本越长或屏幕越矮，缩放比例越低，但最低不会小于 18。

作用：

- 保留用户字号偏好的方向；
- 防止长文本直接挤出作者和来源；
- 在不同 iPhone 高度上保持更稳定布局。

### 13.3 正文滚动区域

QuoteCard 将正文放入有最大高度的 ScrollView。正文很长时显示滚动条，作者和来源
仍留在卡片底部可见。

作用：

- 解决超长中文、日文或文学段落无法完整显示的问题；
- 不让整个主页布局因一条异常长文本发生跳动。

### 13.4 来源显示

显示优先级：

```text
source 存在 → 显示作品或出处
source 不存在 → 显示具体 role
role 只有 Writer / Author → 不显示泛化身份
```

相同规则也应用到 ShareCard，避免主页与分享图片的归属信息不一致。

## 14. 设置页与内容披露

涉及文件：`src/screens/SettingsScreen.tsx`

主要变化：

- `Categories` 改为 `Preferences`；
- 数量摘要改为当前心情对应的阅读方向；
- 新增 `Quote Language`；
- 隐私政策和服务条款继续打开正式网站；
- 内容来源不在应用设置页展示，改由仓库文档与 App Review Notes 披露。

作用：

- 设置页语言从“内部配置”转向“用户目的”；
- 三语切换有明确入口和当前值；
- 第三方内容来源与许可集中维护在仓库文档，审核说明文案记录在 README。

## 15. 自动测试模块

涉及文件：

- `tests/quotes.test.ts`
- `tests/selector.test.ts`

### 15.1 目录测试

当前覆盖：

- 三种语言各 2,000 条；
- 合计 6,000 条；
- 每条通过 Quote schema；
- ID 在合并目录中唯一；
- 英文正文不重复；
- 每条只有一个大分类；
- 小分类属于对应大分类；
- 英文作者数量不超过上限；
- 英文没有 `Writer`、`Author` 这类泛化身份；
- 8 个大分类和 40 个小分类都有英文数据。

### 15.2 推荐测试

当前覆盖：

- 最近作者会被排除；
- 优先使用当天次数较少的大分类；
- 轮换状态正确记录 ID、作者与计数；
- 同等候选中语言计数较少者优先；
- 指定语言后只返回该语言。

### 15.3 为什么测试纯算法而不是直接点模拟器

模拟器 UI 测试适合验证“按钮能否点击”和“页面能否跳转”；推荐算法需要构造精确
候选和计数。把算法保持为纯函数后，可以：

- 注入固定随机数；
- 构造候选耗尽场景；
- 毫秒级运行；
- 在没有 iOS 模拟器的 CI 中运行；
- 精确指出哪条业务规则退化。

## 16. 数据流与事件流

### 16.1 首次启动

```text
index.tsx 读取 onboardingComplete
        ↓ false
OnboardingScreen 显示心情选项
        ↓ onSelect(mood)
changeMood(mood, true)
        ↓
保存 mood + categories + onboardingComplete
        ↓
getNextRecommendedQuote()
        ↓
主页显示第一条格言
```

### 16.2 点击下一条

```text
ActionBar
  ↓ goNext()
检查动画锁和选择锁
  ↓
quoteRotation 读取今日状态
  ↓
selector 选择候选
  ↓
recordSelection 更新计数
  ↓
AsyncStorage 保存
  ↓
index.tsx 追加 quoteHistory
  ↓
QuoteCard 执行当前动画
```

### 16.3 切换语言

```text
LanguageSettingsScreen
  ↓ onChangeLanguage
保存语言
  ↓
用当前偏好在新语言中推荐
  ↓
清空旧浏览栈
  ↓
新语言格言成为索引 0
```

### 16.4 读取收藏

```text
AsyncStorage 原始 JSON
  ↓
解析数组
  ↓
新 schema 直接通过 / 旧 schema 迁移
  ↓
按 ID 去重并按时间排序
  ↓
返回 SavedQuoteRecord[]
```

## 17. 当前测试体系没有覆盖的风险

现有测试能保护数据结构和推荐核心规则，但还不能证明：

- 启动页一定会在所有原生构建中按时消失；
- AsyncStorage 损坏、写满或权限异常时所有页面都正常；
- 日期跨午夜时实际设备行为正确；
- 六千条 JSON 在低端设备上的启动内存和解析速度足够好；
- 长中文、长日文和极小屏幕都不会发生视觉溢出；
- 收藏迁移覆盖所有历史版本形态；
- Wikiquote 的作者和作品归属全部经过人工事实核查；
- VoiceOver、Dynamic Type 和减少动态效果已经可用。

这些风险决定了后续测试应分层，而不是只增加更多同类型单元测试。

## 18. 推荐的阅读顺序

1. `src/constants/categories.ts`：理解分类和心情映射；
2. `src/data/quotes.ts`：理解数据如何进入运行时；
3. `src/recommendation/selector.ts`：理解纯推荐算法；
4. `tests/selector.test.ts`：从预期行为反看算法；
5. `src/storage/quoteRotation.ts`：理解算法状态如何跨重启；
6. `src/storage/preferences.ts`：理解用户选择如何保存；
7. `src/storage/savedQuotes.ts`：理解兼容迁移；
8. `src/app/index.tsx`：观察所有模块如何被协调；
9. `QuoteCard.tsx`：理解多语言和长文本显示；
10. `scripts/` 与 `data/quote-audit/`：理解内容如何生成和审计。

## 19. v1.1 刻意没有做的内容

本版本没有加入：

- 广告；
- 订阅或一次性购买；
- 远程推送；
- Widget；
- 账号；
- 云同步；
- 完整无障碍改造；
- 后台内容管理工具。

这是范围控制，而不是遗漏。当前最需要 TestFlight 验证的是：

1. 用户是否理解首次启动问题；
2. 三语切换是否符合预期；
3. 推荐是否显得重复或失衡；
4. 内容归属是否可信；
5. 长文本在真实设备上是否稳定；
6. 升级后收藏是否保留。

只有这些核心问题获得真实用户反馈后，才适合继续扩大商业化和平台功能。

## 20. 作者与名言语境数据模型

涉及文件：`QUOTE_CONTEXTS.json`、`src/data/quoteContexts.ts`

JSON 将资料拆成 `authors` 与 `quote_contexts`，避免同一作者的生平在多条名言中
重复保存。运行时建立两个 Map：

```text
String(quote_id) → QuoteContext
author_ref       → AuthorContext
```

查询由每次遍历 6,000 条记录变为按 ID 直接读取。`quote_id` 必须先经过
`String()`：英文目录主要使用数字 ID，中文和日文目录包含字符串 ID；统一键类型
可避免同一个数字以 `1` 和 `"1"` 传入时得到不同结果。

`attribution_only` 只有作者归属，`source_only` 已知作品但具体契机未核实，
`verified` 才表示语境有来源支持。`verified_composite` 表示内容已确认是多个时点
表达的组合，而非一次逐字发言。这些状态继续服务内部编辑与数据维护，但当前详情页
不显示历史背景模板和核实状态；没有适合用户阅读的信息时直接省略。

研究时先提取名言核心词组与作者线索，再交叉检索公开文献、Wikiquote、Google
Books 索引和权威语录资料。原始书籍章节、演讲日期或官方记录属于一级证据；
只有维基页面或名言网站属于二级证据；找不到原文或出现可靠误托考证时分别标记
`unverified` 或 `disputed`。搜索引擎与 AI 生成摘要不能单独改变核实状态。

`editorial_note` 属于另一层内容：它根据名言文字、分类、作者身份和已知作品提供
简短阅读方向，并用 `editorial_note_kind: "interpretive_commentary"` 标记为编辑
评论。生成脚本还会根据同一作者在 ECHO 中的主题分布和已知作品重写人物介绍。
用户界面的编辑解读只保留阅读内容，不附加核实流程说明。全部内容由
`scripts/generate-editorial-notes.mjs` 以可重复执行的三语规则生成。

人物文案使用由 `author_ref` 稳定选择的多组句式，避免每位作者都出现相同开头。
生成时还会区分作品、公共讲话和职业阶段，例如运动员的“阪神时代、MLB时代”
会被描述为生涯跨度，而不是误称为作品。应用名称不会反复写入人物段落。

## 21. 作者点击到详情页的事件流

涉及文件：`QuoteCard.tsx`、`index.tsx`、`QuoteContextScreen.tsx`

```text
QuoteCard 点击作者名
        ↓ onPressAuthor(currentQuote)
index.tsx 将 currentQuote 保存到 contextQuote
        ↓ Page 切换为 quote-context
使用 quote_id 查询 context
        ↓ 使用 author_ref 查询 author
渲染当前名言、人物介绍、编辑解读和可用的作品来源
```

详情页保存的是用户点击当刻的 Quote，而不是继续读取可能因左右翻页变化的
`currentQuote`。因此进入详情后内容稳定，返回时仍回到原有主页浏览位置。

页面沿用主题背景、颜色 token、圆形返回按钮、细分隔线和字距风格。它只回答
“这个人是谁、这句话为何出现”，不扩展成作者全部名言列表。

## 22. Git 与 EAS 数据文件分流

`.gitignore` 忽略 `QUOTE_CONTEXTS.json`、三语格言目录和生成的审计 JSON，避免
持续生成的大文件进入 Git 历史。但 Metro 构建仍需要前四个运行时 JSON，因此
`.easignore` 在复制忽略规则后，再用 `!` 将它们包含回 EAS 上传包；研究审计资料
继续排除，因为应用运行时不读取它们。

该方案有一个明确限制：EAS Build 必须从保存完整本地数据集的电脑发起。单纯从
远端克隆仓库无法恢复这些文件。验证分流时应同时检查：

1. `git status` 不显示数据大文件；
2. 四个运行时 JSON 在本地存在；
3. `.easignore` 保留四条否定规则；
4. `npm run test` 和 `tsc --noEmit` 能正常导入数据。
