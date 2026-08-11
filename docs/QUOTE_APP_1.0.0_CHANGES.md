# Quote App 1.0.0 本次运行修改说明

日期：2026-08-03  
项目：ECHO  
Bundle Identifier：`yachts.sarada.echo`  
版本：`1.0.0`

本文记录本次运行中实际完成的代码、配置、内容目录、启动流程和验证工作。文中将“已完成”“已验证”和“仍需外部操作”分开说明，不把尚未完成的 App Store Connect 或 TestFlight 工作描述为已完成。

## 1. 运行问题与 iOS 启动修复

### 原因

截图中的页面是 Expo Development Build 的开发服务器选择页面，不是 ECHO 的业务首页。模拟器曾同时看到：

- 旧项目地址：`http://192.0.0.2:8081`
- 当前 ECHO Metro 地址：`http://192.0.0.2:8082`

旧的 `8081` 进程属于其他项目，本次没有终止或修改它。问题的根本原因是原生 Development Build 中保存了旧的开发服务器地址，而当前 ECHO Metro 在另一个端口运行。

### 已完成的修改

新增 [`scripts/run-ios-simulator.mjs`](../scripts/run-ios-simulator.mjs)，并将 `npm run ios` 指向该脚本。脚本执行以下流程：

1. 只检查 ECHO 项目自己的 `8082` Metro 进程。
2. 如果 `8082` 被其他项目占用，则停止并提示，不会误杀其他项目进程。
3. 对当前 ECHO Metro 进程发送优雅停止信号，并等待端口释放。
4. 执行 iOS 无缓存原生构建：

   ```bash
   npx expo run:ios --no-build-cache --no-bundler --device "iPhone 17"
   ```

5. 启动 ECHO Metro，并固定使用 `127.0.0.1:8082`。
6. 等待以下 iOS Bundle 健康检查返回 HTTP 200：

   ```text
   http://127.0.0.1:8082/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true
   ```

7. 健康检查通过后，自动打开：

   ```text
   echo://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8082
   ```

同时，`package.json` 中的 `start`、`dev` 和 `ios:metro` 命令均统一到端口 `8082`，并设置 `REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1`。

### 原生配置处理

本次重新生成了 iOS 原生配置，并执行了无缓存构建，确保原生包中的版本号不再保留旧的 `1.1.0` 配置。当前本地 iOS Development Build 的版本信息为 `1.0.0`。

### 验证结果

- Metro Bundle 健康检查返回 HTTP 200。
- 模拟器已加载 ECHO 实际首页，不再停留在 Development Servers 列表。
- ECHO 首页能够显示名言、分类、主题和操作栏。
- Development Build 首次可能显示 Expo Dev Tools 说明页。点击一次 `Continue` 后即可使用 ECHO；这是开发包的一次性开发工具提示，不是 App 加载错误。

## 2. 版本与生产配置

### 版本统一

- `app.json` 的 Expo 版本改为 `1.0.0`。
- `package.json` 的 npm 版本改为 `1.0.0`。
- Bundle Identifier 保持为 `yachts.sarada.echo`。
- Settings 页面显示真实 App 版本和 Build Number。
- EAS 使用远程版本号管理；本次 Production Build 为 `1.0.0 (Build 5)`。

### 通知功能移除

为了降低首版审核和权限风险，1.0.0 不再包含每日通知或提醒功能：

- 移除 `expo-notifications` 依赖和 Expo 插件配置。
- 移除通知设置页面、通知首次引导、通知生命周期管理和通知偏好存储。
- 移除通知权限申请、通知渠道配置、定时提醒和测试通知逻辑。
- 移除通知自动化测试。
- 更新 README、Architecture 和 TestFlight 说明，明确当前版本没有通知、远程推送、广告、订阅或登录。

### 权限与 Production 包检查

Production IPA 检查确认：

- 未发现通知权限。
- 未发现照片库、相机、麦克风、位置或联系人权限。
- 未发现 `192.0.0.2`、`8081`、`8082` 等测试地址。
- 未发现 `expo-development-client` 开发服务器地址。
- 没有为图片分享申请照片库权限；分享使用临时截图和系统分享。

## 3. 核心功能修改

### 浏览历史

新增 [`src/storage/viewedQuotes.ts`](../src/storage/viewedQuotes.ts)，使用 AsyncStorage 保存最近浏览过的名言：

- 浏览历史与 Saved Quotes 分开显示。
- 最多保留最近 100 条记录。
- App 重启后可以重新读取。
- 同一条名言再次浏览时更新到历史顶部，而不是产生重复记录。
- 损坏、格式不正确或无法验证的本地数据会被安全忽略。

`HistorySheet` 现在包含 Saved 和 History 两个标签，并提供清除浏览历史入口。

### 清除本地数据

新增 [`src/storage/clearLocalData.ts`](../src/storage/clearLocalData.ts)，只清除 `@echo/` 命名空间下的数据，不影响其他应用数据。

Settings 的 Clear All Data 操作现在需要二次确认，并清除：

- 收藏名言
- 浏览历史
- 主题和字体偏好
- 分类和语言偏好
- 动画、高对比度等设置
- Onboarding/首次启动状态

### Settings 与外部链接

更新 [`src/screens/SettingsScreen.tsx`](../src/screens/SettingsScreen.tsx)：

- 新增 Share App，始终打开系统分享。
- 在没有正式 App Store ID 时隐藏 Rate App。
- 新增 Content Sources 入口。
- Feedback 支持打开邮件客户端；没有可用 Mail App 时提供复制邮箱的兜底。
- 保留 Privacy Policy 和 Terms 链接。
- 显示真实版本号和 Build Number。

新增 [`src/screens/ContentSourcesScreen.tsx`](../src/screens/ContentSourcesScreen.tsx)，展示名言来源、许可说明、Wikiquote 页面和 CC BY-SA 4.0 链接。

### 空状态、快速操作和长文本

- 名言读取失败、推荐池为空或当前没有名言时，显示可操作的 Try Again 空状态，不再出现空白页面。
- 收藏按钮增加忙碌状态和快速点击保护。
- 分享文字、分享图片和系统分享增加忙碌状态、错误处理和取消处理。
- QuoteCard 支持较长名言和较长作者名的自适应字体与多行显示。
- ShareCard 根据文本长度调整高度和字号。
- ShareSheet 的预览区域支持滚动，降低长文本截断风险。
- 中、英、日文本使用现有语言布局和自适应处理，避免超出屏幕。

## 4. 内容版权与数据目录

### 发布目录收敛

原始三语目录共约 6,000 条名言。本次按照“没有可验证授权证据的内容不进入 1.0.0”处理：

| 语言 | 发布前 | 1.0.0 发布目录 |
| --- | ---: | ---: |
| 英文 | 2,000 | 2,000 |
| 简体中文 | 2,000 | 894 |
| 日文 | 2,000 | 2,000 |
| 合计 | 6,000 | 4,894 |

中文目录中的 inBox Card 内容没有在仓库中找到可验证的再分发授权，因此从正式发布目录移出。相关内容保留在未发布审计归档中，不会被 App 正式目录使用。

### 来源和审计

- 正式中文目录只保留 Chinese Wikiquote 内容。
- Wikiquote 内容保留页面 ID、修订 ID、永久链接和 CC BY-SA 归属信息。
- 英文和日文目录继续执行作者、来源和结构校验。
- 更新 `scripts/import-chinese-quotes.mjs`，将 inBox Card 内容写入未发布审计文件，将 Wikiquote 内容写入正式目录。
- 更新 `scripts/audit-quote-catalogs.mjs`，将质量门槛改为英文 2,000、中文 894、日文 2,000，总数 4,894。
- 更新 `scripts/wikiquote-support.mjs` 的导入客户端版本标识为 1.0。
- `QUOTE_CONTEXTS.json` 从覆盖 6,000 条记录收敛到正式发布的 4,894 条记录。
- 更新 [`THIRD_PARTY_CONTENT.md`](../THIRD_PARTY_CONTENT.md) 和 [`assets/QUOTES_LICENSE.md`](../assets/QUOTES_LICENSE.md)，说明正式来源、许可方式和未发布 inBox Card 审计归档。

### 生成的审计文件

未发布内容及来源证据保存在本地审计目录中：

- `data/quote-audit/chinese-inbox-unpublished.json`
- `data/quote-audit/chinese-inbox-provenance-unpublished.json`
- `data/quote-audit/chinese-provenance.json`

这些审计文件用于版权复核，不应重新加入 1.0.0 正式发布目录，除非补充可验证的书面授权。

## 5. 测试和验证结果

本次运行完成的检查如下：

```text
自动测试：22 项通过，0 项失败
TypeScript：通过
Expo Doctor：20/20 checks passed
内容审计：4,894 条记录，重复 ID 0，重复文本 0，缺少作者 0，残留标记 0
Metro iOS Bundle：HTTP 200
```

内容审计还确认：

- 三种语言目录的 ID 唯一。
- 正式中文目录不包含 `zh-inbox-` 记录。
- 每条发布名言具有结构有效的作者和角色信息。
- 每条正式名言都能找到对应的语境记录。
- 分类和子分类仍然具备可用数据。

外部网页检查结果：

- Privacy Policy：HTTP 200
- Terms：HTTP 200
- ECHO 支持页面：HTTP 200

Production EAS 构建已完成：

- 版本：`1.0.0`
- Build：`5`
- Bundle ID：`yachts.sarada.echo`
- [EAS Production Build](https://expo.dev/accounts/hsc110110/projects/ECHO/builds/fce32de3-7d45-4dea-872c-9ceae8b0b1ab)

## 6. 本次修改的文件清单

### 配置和命令

- `app.json`
- `package.json`
- `package-lock.json`
- `scripts/run-ios-simulator.mjs`

### 内容导入、审计和许可

- `scripts/audit-quote-catalogs.mjs`
- `scripts/import-chinese-quotes.mjs`
- `scripts/wikiquote-support.mjs`
- `assets/QUOTES_LICENSE.md`
- `THIRD_PARTY_CONTENT.md`
- `QUOTE_CONTEXTS.json`
- `assets/quotes.zh-Hans.json`
- `data/quote-audit/chinese-provenance.json`
- `data/quote-audit/chinese-inbox-unpublished.json`
- `data/quote-audit/chinese-inbox-provenance-unpublished.json`

### App 逻辑、页面和组件

- `src/app/index.tsx`
- `src/storage/viewedQuotes.ts`
- `src/storage/clearLocalData.ts`
- `src/screens/SettingsScreen.tsx`
- `src/screens/ContentSourcesScreen.tsx`
- `src/components/home/ActionBar.tsx`
- `src/components/home/HistorySheet.tsx`
- `src/components/home/QuoteCard.tsx`
- `src/components/home/ShareCard.tsx`
- `src/components/home/ShareSheet.tsx`

### 删除的通知代码

- `src/components/home/NotificationPrimerSheet.tsx`
- `src/notifications/lifecycle.ts`
- `src/notifications/model.ts`
- `src/screens/NotificationSettingsScreen.tsx`
- `src/services/notifications.ts`
- `src/storage/notificationPreferences.ts`
- `tests/notifications.test.ts`

### 测试和项目文档

- `tests/quoteContexts.test.ts`
- `tests/quotes.test.ts`
- `README.md`
- `Architecture.md`
- `docs/TESTFLIGHT_SUBMISSION.md`

## 7. 尚未完成的上架事项

以下事项本次没有宣称完成：

1. EAS 上传 App Store Connect。
2. App Store Connect App 记录、元数据、截图、App Privacy、年龄分级、版权、出口合规和审核联系人。
3. TestFlight 真机安装和完整流程验收。
4. 小屏幕 iPhone、最新 iOS、中文/英文/日文系统、动态字体、VoiceOver、无 Mail App、系统分享取消等手动矩阵。
5. 选择正确 Build 并点击 `Submit for Review`。
6. 等待 App Store Connect 状态变为 `Waiting for Review`。

本次 `eas submit` 未完成，原因是提交配置缺少 `ascAppId`；交互模式继续执行时需要 Apple Developer 登录。没有在终端或聊天中输入 Apple 密码、双因素验证码或恢复码。

后续完成 App Store Connect App 记录并取得数字 App ID 后，应在 `eas.json` 中配置对应的 `ascAppId`，再执行：

```bash
npx eas submit --platform ios --profile production --latest
```

在 TestFlight 真机和 App Store Connect 资料全部完成前，Quote App 1.0.0 不能被描述为已上架或已提交审核。
