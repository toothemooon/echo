# ECHO 1.1 学习笔记

这份文档解释 ECHO 1.1 为什么这样设计，以及各层代码如何协作。重点不是记住
API，而是理解：内容、推荐、持久化和 UI 应该各自负责什么。

## 1. 先看整体数据流

```text
assets/quotes.json + assets/quotes.zh-Hans.json + assets/quotes.ja.json
        │
        ▼
src/data/quotes.ts ──验证──► 只读 Quote[]
        │
        ▼
recommendation/selector.ts ◄── 用户偏好 + 当日轮换状态 + 最近浏览
        │
        ▼
index.tsx 的 quoteHistory / historyIndex
        │
        ▼
QuoteCard + ActionBar + Saved sheet
```

核心原则是：

- JSON 只存内容，不处理 UI。
- `quotes.ts` 只验证和查询，不操作 AsyncStorage。
- `selector.ts` 是纯函数，不知道 React Native 或设备存储。
- `quoteRotation.ts` 负责读写当日状态。
- `index.tsx` 协调页面、动画和用户操作。
- 子组件通过 props 接收数据，通过 callback 把事件交还给上层。

这样拆分后，推荐算法可以独立测试，UI 也不需要知道推荐细节。

## 2. Quote 数据为什么变严格

1.0 的一条名言可能同时带多个类别，作者身份也可能过于笼统。1.1 的目标是让
推荐系统可以清楚计数，因此每条记录必须只有一个大分类和一个小分类。

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

这里保留 `categories: [primary_category]` 是兼容旧代码和收藏快照；真正用于
推荐的是 `primary_category` 与 `subcategory`。

### author 与 author_id 的区别

- `author` 是给用户看的名字，例如 `William Blake`。
- `author_id` 是程序用于去重的稳定值，例如 `william_blake`。

只比较显示名容易被大小写、空格、重音符号或别名干扰。推荐系统用
`author_id`，才能可靠执行“同一作者每天优先只出现一次”。`language` 则让推荐
器能够在条件相同的候选中平衡英文、简体中文与日语。

### source 与 role 的显示规则

QuoteCard 先显示 `source`；没有经核实的作品名时才显示具体 `role`。不知道
作品来源时保持缺省，不猜书名。这比“每条都有 source”更可信。

## 3. 内容迁移脚本做了什么

`scripts/prepare-v1.1-quotes.mjs` 是可重复执行的确定性迁移：

1. 过滤空字段、泛化身份和平台型作者。
2. 保留原有 ID，不重新从 1 编号。
3. 规范空格与标点粘连。
4. 从原有受控标签中选取内容，不从网络盲目补量。
5. 限制单作者最多 16 条。
6. 指定一个大分类，并在固定的五个小分类中分配。
7. 输出经过整理的稳定 JSON。

`scripts/import-english-quotes.mjs` 保留原有受控英文记录，并从 English
Wikiquote 补充到 2,000 条。`scripts/import-chinese-quotes.mjs` 先读取 inBox
Card 全部可用集合，再从中文 Wikiquote 补充到 2,000 条。新增 Wikiquote 记录
都保存页面 ID、修订 ID 和永久版本链接。

`scripts/import-japanese-quotes.mjs` 从日语 Wikiquote 的日本人分类及职业
子分类生成 2,000 条日语原文，并把页面 ID、修订版本 ID、永久版本链接和 CC BY-SA 许可信息写入
`japanese-provenance.json`。Anime-chan 当前接口返回的是英文译文，
Hitokoto/UApi 的实测结果是中文，因此都不能冒充日语数据写入目录。

一言没有被复制进离线目录：其官方文档不欢迎刷新随机接口抓取数据库，并要求
批量使用者采用 AGPL 语句包。当前项目没有在未确认兼容方案前把该语句包并入
应用。

为什么不是强行每类一样多？因为可靠的 `NATURE` 候选明显少于 `WISDOM`。
为了数量相同而改变真实含义，会让推荐看似平衡、实际失真。

## 4. 首次启动偏好如何工作

用户看到的是一句自然问题，而不是 8 个技术分类：

> How have you been feeling lately?

例如：

```text
I feel overwhelmed
  └── MINDFULNESS + HEALING

I am facing a challenge
  └── COURAGE + GROWTH

Surprise me
  └── 全部 8 类
```

映射定义在 `constants/categories.ts`，UI 文案与内部分类因此只有一个事实
来源。设置页的 Preferences 复用同一组答案。

这只是阅读偏好，不是健康诊断。文案不能声称治疗焦虑、抑郁或悲伤。

## 5. 推荐算法逐步理解

`selectNextQuote()` 接收：

- 全部候选名言；
- 当前偏好的大分类；
- 当前运行中的浏览历史；
- 当日本地持久化状态。

严格候选池会排除：

```text
当前 session 已出现的 quote ID
+ 今天已出现的 quote ID
+ 最近 5 条的 author_id
+ 今天已出现的 author_id
```

之后先比较大分类使用次数，再比较小分类使用次数，然后在同等候选中优先选择
当天使用较少的语言，最后才随机。
所以“随机”不会破坏均衡规则。

设置页的 Quote Language 会把 `en`、`zh-Hans` 或 `ja` 写入
AsyncStorage。推荐器在建立候选池时直接按该字段过滤，而不是选完后再丢弃不匹配
的结果。切换语言时主页浏览栈会重置，因此“上一条”和“下一条”不会混入旧语言。

### 为什么需要降级策略

如果用户只偏好两个类别，某一天可能把可用作者用完。此时算法先放宽“当天
作者不能再出现”，但仍不允许最近五位作者立即重复，也不重复最近名言。

这是约束优先级：

```text
防止立即重复 > 当日作者唯一 > 大分类均衡 > 小分类均衡
```

### 为什么当日状态要存储

只放在 React State 中，App 重启后就会忘记今天看过谁。`quoteRotation.ts`
将日期、quote ID、author ID 和计数写入 AsyncStorage；本地日期变化时自动
创建空状态。

## 6. React State 与 AsyncStorage 的边界

| 数据 | 放置位置 | 原因 |
| --- | --- | --- |
| 当前页面、Sheet 开关、动画值 | React State / Ref | 只在当前运行有意义 |
| 当前浏览栈 | React State | v1.1 暂不跨重启恢复 |
| 主题、字体、动画、心情偏好 | AsyncStorage | 用户下次启动仍应保留 |
| 当日推荐计数 | AsyncStorage | 重启不能绕过每日轮换 |
| 收藏快照 | AsyncStorage | 即使以后删掉内置内容也要尽量保留 |
| 内置名言 | JSON | 只读、离线、随版本发布 |

收藏层增加了旧结构迁移：如果旧收藏 ID 仍存在于新版目录，使用新版规范记录；
如果已从目录删除，则保留旧文字并补上兼容所需的稳定字段。

## 7. 长文本适配

固定字号在短句上很好看，但 200 字以上会挤压作者信息。QuoteCard 现在结合：

- 用户选择的 Small / Medium / Large；
- 名言字符长度；
- 当前屏幕高度；

计算实际字号，并给正文设置最大高度。非常长的正文可以在卡片内部滚动，作者
和来源仍留在可见区域。这里的重点是“用户偏好是上限方向”，不是要求任何长度
都强制使用完全相同的字号。

## 8. 自动测试在保护什么

运行：

```bash
npm run test
```

当前测试覆盖：

- 英文、简体中文、日语各 2,000 条、合计 6,000 条，全部符合 Quote schema；
- ID 与文本不重复；
- 每条只有一个大分类和一个合法小分类；
- 8 个大分类、40 个小分类都有数据；
- 作者数量上限；
- 最近作者排除；
- 大分类与小分类的低频优先；
- 同等条件下的三种语言均衡；
- 推荐状态计数更新。

完整本地检查：

```bash
npm run check
```

它还会执行严格 TypeScript 编译与 Expo Doctor。测试通过不代表名言出处已经
全部由人工核验；内容真实性仍需要持续的编辑审核。

## 9. 推荐阅读顺序

建议按以下顺序阅读项目：

1. `src/constants/categories.ts`：先理解分类和心情映射。
2. `src/data/quotes.ts`：理解运行时 schema 防线。
3. `src/recommendation/selector.ts`：理解纯算法。
4. `src/storage/quoteRotation.ts`：理解算法状态如何跨重启。
5. `src/storage/preferences.ts`：理解用户设置。
6. `src/app/index.tsx`：观察各层如何被协调。
7. `src/components/home/QuoteCard.tsx`：理解自适应显示。
8. `tests/`：从预期行为反向理解实现。

## 10. 仍然刻意没有做的事

v1.1 没有加入广告、付费墙、通知、Widget、账号、云同步；也没有做 Saved /
History 改名和完整无障碍改造。这些不是“忘记写”，而是为了让 TestFlight
先验证最核心的内容信任、推荐质量和阅读体验。
