# ECHO 项目问题审计与 iOS 1.0.0 发布门槛

> - 审计日期：2026-08-16
> - 审计方式：静态审阅、定向动态复现、数据一致性统计、平台导出、依赖与 Git 历史检查
> - 说明：本文记录审计时确认的问题。除非条目明确标注“待确认”，否则均有代码、数据统计或复现证据。

## 1. iOS 1.0.0 发布结论

### 1.1 本次发布不得不修

严格按 iOS 1.0.0 的最小发布范围，真正的 release blockers 是以下 **3 类**。任何一类未关闭，都不建议提交正式版本。

#### R1. 发布内容的真实性、来源、许可和审核元数据

- 对应问题：P4、P8、P21。
- 原因：当前 iOS UI 会直接显示未验证的 AI 历史叙述；96 条没有历史来源，1,225 条没有作品却标记为 `era_and_work`，应用内说明和 App Review 文档还互相矛盾。这既是内容可信度问题，也是潜在的许可与审核风险。
- Apple App Review Guideline 2.3 要求元数据准确反映 App 核心体验，5.2 要求 App 只包含自行创作或已获许可使用的内容。参见 [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)。
- 最低完成标准：
  - 1.0.0 先隐藏/移除 Historical Echo，或完成逐条来源和人工事实审核；
  - 人工核验并修正/删除四条日语作者冲突记录；
  - 对实际发布 quote 集合保留可审计的来源/归属证据，不能只依赖本机未发布报告；
  - 重新计算实际记录数和作者数；
  - 同步修改应用内 Content Sources、`README.md`、`THIRD_PARTY_CONTENT.md` 和 `docs/TESTFLIGHT_SUBMISSION.md`，删除与实际内容不符的 AI、数量、来源和版本声明。
- Historical Echo 的处理方式二选一：
  1. 在 1.0.0 中隐藏/移除 Historical Echo，只保留已核验的人物和作品信息；或
  2. 对发布内容逐条补充可核对来源、人工审核状态和正确的类型字段，拒绝无来源内容进入发布目录。

#### R2. 修复 Clear All Data 的竞态和错误结果提示

- 对应问题：P5。
- 原因：这是面向用户的隐私删除能力。当前已复现清除完成后收藏、主题、rotation 和 exposure 被在途写入重新创建；图标同步失败还会谎报“数据未改变”。
- 最低完成标准：清除期间建立全局写屏障，等待/取消旧写入，旧 generation 不得提交；图标同步从清除事务中拆开；成功或部分失败提示必须与实际结果一致。

#### R3. 冻结并校验 iOS 1.0.0 的四个运行数据文件

- 对应问题：P2、P3、P21。
- 原因：当前发布内容依赖某台电脑上未版本化的 JSON，且内容脚本可直接覆盖这些文件。即使暂时不完成 Git LFS/制品服务，也必须确保 1.0.0 能准确重建和回滚。
- 最低完成标准：为四个发布 JSON 生成并保存版本、记录数、文件大小和 SHA-256 manifest；建立只读备份；构建前校验 manifest；禁止在正式构建前运行会原地覆盖数据的脚本。

### 1.2 必须立即做的仓库安全处置

#### S1. 清除已提交的 App Store Connect 个人信息

- 对应问题：P1。
- 原因：个人联系方式和账户身份已经进入 `origin/main`，且 `.easignore` 不排除该目录。它没有被 App 代码 import，目前没有证据表明它进入 IPA，因此不应描述成 iOS 运行时 blocker；但在下一次 EAS 上传前必须处理，避免继续扩散。
- 最低完成标准：
  - 取消跟踪 `.playwright-mcp/**`；
  - 同时在 `.gitignore` 和 `.easignore` 排除该目录；
  - 确认远端仓库、fork、缓存和 EAS 上传范围；
  - 根据仓库可见性决定是否重写 Git 历史及更换审核联系人信息。

### 1.3 本次发布前强烈建议修复或验证

这些问题不是法律/数据不可逆意义上的硬 blocker，但在普通 iPhone 使用路径上可见，建议和 1.0.0 一起关闭。

1. **字体失败白屏**（P6）：bundled font 和本地 production export 已成功，尚未在标准 iPhone 复现；应在生产 EAS 包上反复执行冷启动、杀进程和离线启动，出现一次即升级为 blocker。修复成本较低，仍建议本次直接补 fallback。
2. **全局 StatusBar**（P15）：应用主题与系统主题不同时，设置页状态栏图标可能不可见。
3. **Settings 的 Share App / Send Feedback 回归**（P14）：菜单名称、无障碍提示和真实行为不一致。
4. **Safe Area、Dynamic Type 和 VoiceOver**（P15、P16、P31）：在 iPhone SE 和带 Dynamic Island/Home Indicator 的设备验证；出现遮挡、不可操作或焦点逃逸即升级为 blocker。
5. **系统分享和 alternate icon**：验证图片/文字分享、取消分享、三种图标切换和重启后的持久化；任何核心路径失败即升级为 blocker。
6. **支持与法律链接**：验证隐私、条款、反馈和支持链接；链接不可达或内容与提交元数据不符即升级为 blocker。
7. **Expo SDK patch mismatch**（P18）：当前 iOS production export 已成功，因此 doctor warning 本身不应单独卡版本；最终 EAS archive/真机 smoke 正常时可延期升级，避免临发布引入回归。

### 1.4 可延期到后续版本

- Android 专属问题：系统返回键、Android Share as Image。
- Web 构建和宽屏 ShareCard。
- 长会话/超大收藏性能优化。
- 未接入 UI 的 Defining Moment/OpenAI/Wikipedia 服务；前提是继续保持不可达，不能在 1.0.0 启用。
- Batch 流水线重构；前提是 1.0.0 发布数据已经冻结，发布前不再运行该流水线。
- 开发脚本跨平台、Metro LAN、脚本执行位等开发体验问题。

## 2. 高严重度问题

### P1. 已跟踪的浏览器截图泄露个人信息

- **位置**：`.playwright-mcp/page-2026-08-13T12-53-25-546Z.png`、同目录 YAML/日志、[`.gitignore`](../.gitignore)、[`.easignore`](../.easignore)。
- **证据**：`.playwright-mcp/` 中 15 个文件约 456 KB 已被 Git 跟踪；其中一张已登录 App Store Connect 截图包含审核联系人和账户身份信息；相关提交已经位于 `origin/main`。
- **影响**：仓库协作者、远端缓存及构建服务可能获取个人信息。当前未发现高置信认证 token，不能据此声称凭证已泄露。
- **修复**：取消跟踪并同时更新两个 ignore 文件；检查仓库/fork/缓存/EAS 范围；按暴露范围决定历史重写和联系人信息更换。

### P2. 四个运行时必需数据文件未版本化

- **位置**：[`.gitignore`](../.gitignore)、[`.easignore`](../.easignore)、[`src/data/quotes.ts`](../src/data/quotes.ts)、[`src/data/quoteContexts.ts`](../src/data/quoteContexts.ts)。
- **证据**：`QUOTE_CONTEXTS.json` 和三语 quote JSON 均被 Git 忽略。`git archive HEAD` 的干净检出执行 `tsc --noEmit` 时因四个 JSON 模块缺失而退出 2。
- **影响**：CI、灾难恢复、第三方审计和发布内容不可复现；发布依赖某台电脑上的任意本地副本。
- **修复**：使用 Git LFS 或版本化制品；提交带 hash 的 manifest；构建前固定版本下载并验证。

### P3. Batch 回写协议失效且会危险地重写主数据

- **位置**：[`scripts/generate_batch_input.ts`](../scripts/generate_batch_input.ts)、[`scripts/apply_batch_output.ts`](../scripts/apply_batch_output.ts)。
- **证据**：生成端把 `author_ref` 中的 `:` 替换为 `_`；回写端未恢复。对当前 92 行输出实测直接匹配为 0。回写脚本还硬编码读取不存在的 `batch_output.jsonl`，即使零更新仍会重写 `QUOTE_CONTEXTS.json` 并打印完成。
- **影响**：内容流水线不可用，操作者可能误以为应用成功；主数据还存在截断、错误关联和不可恢复覆盖风险。
- **修复**：使用显式、可逆的 `custom_id → author_ref` manifest；输入输出改为 CLI 参数；校验未知/重复 ID、响应状态和预期命中数；0 命中必须失败；默认 dry-run，最后原子替换。

### P4. Historical Echo 状态、来源和产品声明失真

- **位置**：`QUOTE_CONTEXTS.json`、[`scripts/apply_batch_output.ts`](../scripts/apply_batch_output.ts)、[`tests/quoteContexts.test.ts`](../tests/quoteContexts.test.ts)、[`src/screens/ContentSourcesScreen.tsx`](../src/screens/ContentSourcesScreen.tsx)。
- **证据**：
  - 3,927 条全部标为 `era_and_work`；
  - 1,225 条 `source_work=null`；
  - 96 条非空历史叙述没有 `historical_echo_sources`；
  - 2,717 条没有逐条 `context_sources`；
  - 测试明确跳过 AI 内容来源检查；
  - UI 不显示审核状态或逐条来源；
  - TestFlight 文档称其为 AI 生成事件，README/应用内文案却称其为可验证事实组装。
- **影响**：未经验证的历史叙述可能被当成史实；来源可能继承自不相关的旧内容；应用的可追溯声明不真实。
- **修复**：新增明确的 AI/未验证状态、生成元数据和人工审核字段；无逐项证据不得发布；界面显示来源和状态；增加跨字段不变量测试。

### P5. Clear All Data 存在已复现的写回竞态

- **位置**：[`src/storage/clearLocalData.ts`](../src/storage/clearLocalData.ts)、[`src/app/index.tsx`](../src/app/index.tsx)、[`src/storage/quoteRotation.ts`](../src/storage/quoteRotation.ts)、[`src/storage/savedQuotes.ts`](../src/storage/savedQuotes.ts)。
- **证据**：分别复现在清除完成后重建 rotation/exposure、收藏和主题。`clearLocalData()` 只删除调用瞬间看到的 key，各模块队列互不协调。图标同步失败发生在删除后，却提示数据没有改变。
- **影响**：用户认为已删除的数据和偏好会重新出现；隐私操作结果不可信。
- **修复**：统一存储协调器和 reset generation；清除时阻止新写入并等待/取消旧任务；图标同步独立处理；验证删除后的 key 集合。

### P6. 字体加载失败会永久停在透明启动页

- **位置**：[`src/app/index.tsx`](../src/app/index.tsx)、[`src/components/common/SplashScreen.tsx`](../src/components/common/SplashScreen.tsx)。
- **证据**：`useFonts` 只读取 `fontsLoaded`，丢弃 error；字体失败后 `fontsLoaded` 永远为 false，Splash 自己仍淡出为透明。
- **影响**：字体资源异常时应用永久白屏且无法重试。
- **修复**：处理 `fontError` 并降级系统字体；readiness 完成后才淡出；加入超时、错误页和失败回归测试。

### P7. Android 返回键绕过视觉导航并退出应用

- **位置**：[`src/app/_layout.tsx`](../src/app/_layout.tsx)、[`src/app/index.tsx`](../src/app/index.tsx)。
- **证据**：Router 只有根页面，其他页面由 `currentPage` 模拟；代码没有 `BackHandler` 或真实导航栈。
- **影响**：Android 在设置页、子页或 Sheet 中按返回键会退出/后台化，而不是返回或关闭 Sheet。
- **修复**：使用真实 Expo Router routes 和 Modal；或集中实现返回优先级。此问题不阻塞 iOS 1.0.0，但阻塞 Android 正式发布。

## 3. 中严重度问题

### P8. 日语目录存在标准化重复且作者冲突

- **位置**：`assets/quotes.ja.json` 中 ID `ja-wikiquote-3624-05`、`ja-wikiquote-1818-09`、`ja-wikiquote-1888-07`、`ja-wikiquote-1430-11`。
- **证据**：两组正文仅标点不同，却分别归属于不同作者；至少一条归属错误。现有测试没有执行 NFKC、标点和空白归一化。
- **影响**：核心引用内容存在错误归属。
- **修复**：三语联合做 NFKC + 标点/符号/空白归一化去重；人工核验原始页面和修订版本。

### P9. Android Share as Image 实际只分享文字

- **位置**：[`src/app/index.tsx`](../src/app/index.tsx) 的 `shareAsImage`。
- **证据**：RN Android core Share 忽略 `url`，只发送 `text/plain + message`，但 Promise 仍可按成功返回。
- **影响**：Android 用户选择图片却没有图片附件。
- **修复**：使用 `expo-sharing` 或支持 FileProvider 的库，以 `content://`、`image/png` 和读取权限分享；分别处理截图和分享错误。

### P10. 未展示的推荐已被记录为“已显示”

- **位置**：[`src/storage/quoteRotation.ts`](../src/storage/quoteRotation.ts)、[`src/app/index.tsx`](../src/app/index.tsx)。
- **证据**：语言、心情或 clear 使 generation 失效时，UI 丢弃 quote，但 rotation/exposure 已提前写入。
- **影响**：用户从未看到的名言可能被延后数月再次出现。
- **修复**：选择只返回 reservation，UI 采用后再 commit；或写入前校验 AbortSignal/generation。

### P11. rotation 与 exposure 双写不原子

- **位置**：[`src/storage/quoteRotation.ts`](../src/storage/quoteRotation.ts) 的 `Promise.all`。
- **证据**：一个写立即失败时队列会释放，另一个写仍可能晚到并覆盖后续结果；错误被吞掉。
- **影响**：状态分裂、计数回退、重复推荐或覆盖率失真。
- **修复**：合并为一个带版本快照；最低限度使用 `allSettled` 等待底层写结束，并恢复部分提交。

### P12. 偏好保存失败后 UI 与磁盘不一致

- **位置**：[`src/app/index.tsx`](../src/app/index.tsx) 的主题、字体、语言和 Mood 更新路径。
- **证据**：所有路径先更新 UI；失败只在开发环境日志，无回滚。Mood 多 key `Promise.all` 还可能部分提交。
- **影响**：界面显示已保存，重启后恢复旧值；onboarding、mood 和 categories 可能互相矛盾。
- **修复**：保存成功后再提交 UI，或基于 generation 回滚；相关偏好存为一个版本化 JSON。

### P13. 下一条和空状态重试缺少 catch

- **位置**：[`src/app/index.tsx`](../src/app/index.tsx) 的 Try Again 和 `goNext`。
- **证据**：两处只有 `finally` 没有 `catch`。
- **影响**：意外的存储/native rejection 会成为未处理 Promise，且用户没有反馈。
- **修复**：捕获异常、恢复 busy 状态、记录诊断并显示可重试提示。

### P14. Settings 的 Share App / Send Feedback 功能回归

- **位置**：[`src/screens/SettingsScreen.tsx`](../src/screens/SettingsScreen.tsx)、[`docs/QUOTE_APP_1.0.0_CHANGES.md`](QUOTE_APP_1.0.0_CHANGES.md)。
- **证据**：Share App 只复制链接；Feedback 只复制邮箱；无障碍提示仍承诺可打开 Mail，文档和旧代码均要求系统分享和 `mailto:`。
- **影响**：菜单名称、可访问性描述和实际行为不一致。
- **修复**：恢复系统分享和 `mailto:`，复制作为兜底；等待并处理 Clipboard Promise。

### P15. StatusBar、安全区和模态无障碍处理不完整

- **位置**：[`src/app/index.tsx`](../src/app/index.tsx)、[`src/components/home/HistorySheet.tsx`](../src/components/home/HistorySheet.tsx)、[`src/components/home/ShareSheet.tsx`](../src/components/home/ShareSheet.tsx)。
- **问题**：
  - StatusBar 只挂在 Home 和 Quote Context；应用主题与系统主题不同时，其他页图标可能与背景同色；
  - 全应用使用固定顶部/底部 padding，没有 `useSafeAreaInsets()`；
  - History Sheet 没有模态语义，Share Sheet 在 Android 也未隐藏背景 sibling。
- **影响**：状态栏内容不可见；控件可能进入切口/手势区；屏幕阅读器可聚焦被遮挡的控件。
- **修复**：全局挂载主题化 StatusBar；使用 safe-area insets；Sheet 改为 Modal并处理焦点转移、恢复和 escape。

### P16. 未选中 radio 的视觉边界对比不足

- **位置**：[`src/constants/colors.ts`](../src/constants/colors.ts)、各设置页面、[`tests/accessibility.test.ts`](../tests/accessibility.test.ts)。
- **证据**：`inactiveDot` 对实际卡片背景对比约为 1.12:1、1.26:1、1.68:1；高对比主题也没有改善。测试比较的是错误的页面背景。
- **影响**：低视力用户难以识别 radio 控件边界。
- **修复**：真实 card surface 上至少达到 3:1，并测试 alpha 合成后的组合。

### P17. Web 配置存在但构建失败

- **位置**：[`package.json`](../package.json)、[`app.json`](../app.json)。
- **证据**：`expo export --platform web` 因缺少 `react-native-web` 退出 1。
- **影响**：仓库声明 Web 能力，但无法构建。
- **修复**：若支持 Web，安装兼容依赖并补平台分支；否则删除 web script/config。

### P18. Expo SDK 健康检查和依赖审计失败

- **位置**：[`package.json`](../package.json)、[`package-lock.json`](../package-lock.json)。
- **证据**：Expo Doctor 20/21，7 个 SDK patch mismatch；`npm audit` 报 18 high、8 moderate、0 critical，根源主要为 `brace-expansion`、`image-size`、`js-yaml`、`nanoid`、`uuid`。
- **影响**：主要风险在 Metro/EAS/本地构建处理不可信图片、路径或 YAML；当前未发现直接可利用的生产 App 路径。
- **修复**：先用 Expo 兼容方式更新 7 个包，再重跑 audit；不要使用导致 Expo/RN 大版本降级的强制修复。

### P19. 聚合入口引入约 8 MiB 不需要的字体

- **位置**：[`src/app/index.tsx`](../src/app/index.tsx) 的 Cormorant 导入，以及 14 个 `@expo/vector-icons` 根导入。
- **证据**：生产导出包含全部 10 个 Cormorant TTF 和全部图标字体，实际只使用一个字体文件和 Ionicons。
- **影响**：增加包体、下载/安装时间、Metro 图和资源处理成本。
- **修复**：字体与 Ionicons 使用子路径导入；用 IPA/APK analyzer 比较实包。

### P20. 启动和长会话存在性能边界

- **位置**：[`src/data/quoteContexts.ts`](../src/data/quoteContexts.ts)、[`src/app/index.tsx`](../src/app/index.tsx)、[`src/components/home/HistorySheet.tsx`](../src/components/home/HistorySheet.tsx)。
- **问题**：启动同步解析约 5.7 MB JSON；`quoteHistory` 无上限；收藏无上限且使用 `ScrollView + map` 一次渲染。
- **影响**：低端设备启动、长会话和大收藏列表可能卡顿或出现高内存峰值。
- **修复**：延迟/分片加载 context；限制算法历史窗口；改用虚拟列表和分页/上限。需在低端 Android profiling 后定量确认。

### P21. 当前数据、重建脚本、审计门禁和发布文档版本不一致

- **位置**：[`README.md`](../README.md)、[`THIRD_PARTY_CONTENT.md`](../THIRD_PARTY_CONTENT.md)、[`docs/TESTFLIGHT_SUBMISSION.md`](TESTFLIGHT_SUBMISSION.md)、[`scripts/audit-quote-catalogs.mjs`](../scripts/audit-quote-catalogs.mjs)、[`scripts/generate-editorial-notes.mjs`](../scripts/generate-editorial-notes.mjs)。
- **证据**：
  - 实际：1,282/823/1,822，共 3,927 条、952 位语言域作者；
  - README/TestFlight：1,305/831/1,853，共 3,989 条；
  - 导入和审计脚本：2,000/894/2,000，共 4,894 条；
  - 43 条 `context.source_work` 与当前 quote source 不同；
  - `THIRD_PARTY_CONTENT.md` 的英文子项数量超过其声明总数。
- **影响**：重建可能覆盖正式数据；App Review、许可说明和统计互相矛盾。
- **修复**：建立唯一 catalog manifest；测试、脚本和文档从它生成；重建写 staging，审计和人工 diff 后原子替换。

### P22. 内容脚本的异常、网络和模型输入处理不健壮

- **位置**：[`scripts/generate_batch_input.ts`](../scripts/generate_batch_input.ts)、[`scripts/enrichInsufficientWithWiki.ts`](../scripts/enrichInsufficientWithWiki.ts)、[`scripts/generateDefiningMoments.ts`](../scripts/generateDefiningMoments.ts) 等。
- **问题**：
  - 多个 `main().catch(console.error)` 失败后仍退出 0；
  - 单条坏 JSONL 可中止任务，apply 对坏行静默；
  - 429 使用无上限递归，部分 fetch 没有超时；
  - 瞬态 Wikipedia 失败会被永久当成已处理；
  - 多个脚本直接截断正式 JSON；
  - Wikipedia 摘要和作者名原样进入模型提示，存在条件性提示注入；
  - 每请求允许 10,000 completion tokens，与 40–60 词目标不匹配。
- **影响**：CI 假成功、任务永久挂起、数据损坏、异常费用及外部文本影响模型行为。
- **修复**：统一有限重试/超时/checkpoint；失败返回非零；逐行错误报告；结构化隔离外部文本；降低 token；使用 staging + 原子 rename。

### P23. 工作文件会进入 EAS 构建上下文

- **位置**：根目录四个 `batch*.jsonl`、`.workbuddy/memory/**`、`.playwright-mcp/**`、[`.easignore`](../.easignore)。
- **证据**：四个 Batch 文件约 1.13 MB，含过期 ID、提示和模型请求元数据，均未被 `.easignore` 排除。
- **影响**：不必要地扩大上传体积和远端缓存中的内部数据范围。确认会进入 EAS 源码上下文，尚未证明会进入最终 IPA/APK。
- **修复**：取消跟踪瞬态产物并在两个 ignore 文件中排除；需要审计记录时存入受控制品库并附 hash manifest。

## 4. 低严重度和条件性问题

### P24. 最终推荐回退可能立即重复当前卡片

- **位置**：[`src/recommendation/selector.ts`](../src/recommendation/selector.ts)。
- **条件**：窄池中多条名言属于同一作者。
- **修复**：始终先排除 previous ID，再根据池大小决定是否排除 previous author。

### P25. 旧收藏迁移可能产生非法 Quote

- **位置**：[`src/storage/savedQuotes.ts`](../src/storage/savedQuotes.ts)。
- **影响**：旧非英文作者可能得到空 `author_id` 并阻断以后保存；有效旧快照也可能跳过当前 canonical record。
- **修复**：迁移后再次完整执行 `isQuote`；保留合法语言，非法记录隔离而不是污染有效集合。

### P26. exposure 损坏时不会从历史重建

- **位置**：[`src/storage/quoteExposure.ts`](../src/storage/quoteExposure.ts)。
- **影响**：JSON 损坏后直接返回 `{}`，近期名言可能重新出现。
- **修复**：解析失败后继续执行 viewed-history seed，并记录修复事件。

### P27. rotation 对损坏存储验证不足

- **位置**：[`src/storage/quoteRotation.ts`](../src/storage/quoteRotation.ts)。
- **影响**：未验证 `shownQuoteIds` 元素、计数类型、非负性和有限值，可能污染推荐排序。
- **修复**：对整个存储结构做 schema validation，损坏时迁移或重置。

### P28. 分享截图临时文件未释放

- **位置**：[`src/app/index.tsx`](../src/app/index.tsx) 的 `shareAsImage`。
- **影响**：反复分享会在应用存活期间累积临时图片。
- **修复**：在分享结束后的 `finally` 调用 `releaseCapture(uri)`。

### P29. 宽屏 Web 上离屏 ShareCard 可能进入视口

- **位置**：[`src/app/index.tsx`](../src/app/index.tsx)、[`src/components/home/ShareCard.tsx`](../src/components/home/ShareCard.tsx)。
- **条件**：viewport 大于约 1,064px，且先修复 Web 构建。
- **修复**：使用固定输出尺寸、完整移出视口并设置 `pointerEvents="none"`。

### P30. 日语 Historical Echo 标签语义错误

- **位置**：[`src/screens/QuoteContextScreen.tsx`](../src/screens/QuoteContextScreen.tsx)。
- **问题**：标签使用“人生の転機”，把时代背景误导成作者人生转折。
- **修复**：根据最终内容模型改成“歴史の残響”等准确标签。

### P31. Reduce Motion 和最大 Dynamic Type 适配待确认

- **位置**：[`src/components/common/SplashScreen.tsx`](../src/components/common/SplashScreen.tsx) 及固定高度设置页面。
- **风险**：启动动画不响应系统 Reduce Motion；最大辅助字号可能裁剪内容。
- **修复**：读取系统 reduced-motion；在 iOS 最大辅助字号和 Android 最大字体比例做真机/截图测试。

### P32. iOS 模拟器等待逻辑可能重复调度 retry

- **位置**：[`scripts/run-ios-simulator.mjs`](../scripts/run-ios-simulator.mjs)。
- **原因**：timeout 中同时调用 `destroy()` 和 `retry()`，destroy 又可能触发 error handler 中的 retry。
- **修复**：只保留一个重试入口并增加 settled/once 保护。

### P33. Metro host 配置相互矛盾

- **位置**：[`package.json`](../package.json)。
- **问题**：同时使用 `--host lan` 和 `REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1`；物理设备可能拿到不可访问的回环地址，LAN 监听也不是显式 opt-in。
- **修复**：模拟器默认 localhost；物理设备调试时显式选择 LAN 地址。

### P34. 未接入 UI 的 OpenAI 服务会明文保存客户端 API Key

- **位置**：[`src/services/definingMoment.ts`](../src/services/definingMoment.ts)。
- **现状**：当前生产 UI 没有调用点，因此暂不可达。
- **风险**：一旦启用，长期 OpenAI Key 会保存在 AsyncStorage 并由移动客户端直接发送，可能被提取和滥用。
- **修复**：删除客户端 Key 设计，改由受认证后端持有受限 project key。仅用 SecureStore 不能解决客户端持有长期密钥的根本问题。

### P35. 未接入的 Wikipedia 服务存在语言和并发问题

- **位置**：[`src/services/wikipedia.ts`](../src/services/wikipedia.ts)、[`src/services/definingMoment.ts`](../src/services/definingMoment.ts)。
- **问题**：`zh-Hans` 会形成无效 hostname；任意 string language 可改变目标主机；缓存 read-modify-write 并发会丢条目；请求无统一超时。
- **修复**：闭合语言映射和 host allowlist；请求超时；缓存串行或按作者分 key；合并同作者 in-flight 请求。

### P36. 本地阅读数据是否需要加密取决于威胁模型

- **位置**：AsyncStorage 中的收藏、阅读时间、mood 和偏好。
- **不确定性**：当前是离线阅读应用，是否把这些数据视为敏感信息取决于隐私承诺、设备备份策略和产品威胁模型。
- **建议**：明确数据分类；若承诺设备备份中也不可见，再引入加密或备份排除策略。

### P37. 环境文件 ignore 规则不完整

- **位置**：[`.gitignore`](../.gitignore)、[`.easignore`](../.easignore)。
- **现状**：只忽略 `.env*.local`；当前没有发现 `.env` 文件或密钥。
- **修复**：忽略 `.env`、`.env.*`，只放行 `.env.example`；敏感值使用 EAS secrets。

## 5. 验证记录

- `npm test`：37/37 通过。
- `npx tsc --noEmit`：当前工作区通过。
- 所有 MJS 和 Python 脚本语法检查通过。
- iOS production export：通过，Hermes bundle 约 4.9 MB。
- Android production export：通过，Hermes bundle 约 5.2 MB。
- Web export：失败，缺少 `react-native-web`。
- 干净 Git 检出 TypeScript：失败，缺四个运行 JSON。
- Expo Doctor：20/21，7 个 SDK package patch mismatch。
- npm audit：26 个聚合告警，0 critical。
- 当前及 73 个 Git 提交的文本密钥扫描未发现常见 OpenAI、GitHub、AWS token 或私钥模式。
- 当前测试未覆盖导航、设备级 UI、六个存储模块、系统分享、清除竞态和 Wikipedia/LLM 服务。

## 6. 建议实施顺序

1. 处理 P1，停止个人信息继续扩散。
2. 冻结发布数据并关闭 P2/P3 带来的不可恢复覆盖风险。
3. 决定 1.0.0 是否隐藏 Historical Echo；若保留，先关闭 P4/P8/P21。
4. 修复 P5/P6，补相应故障注入测试。
5. 修复 iOS 可见的 P14/P15/P16，并完成真机 smoke test。
6. 更新 Expo patch 版本，重新执行测试、doctor 和 iOS release export。
7. 后续处理 Android/Web、性能、脚本和未接入服务问题。
