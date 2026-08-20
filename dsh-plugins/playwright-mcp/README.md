# Playwright MCP Bridge — DSH 动态插件

让 DeepSeek Harness 的模型拥有真实的浏览器能力：导航、点击、输入、截图、快照、cookies、localStorage/sessionStorage 等。通过 MCP 协议桥接官方 [`@playwright/mcp`](https://github.com/microsoft/playwright-mcp)（`--caps=storage` 启用存储状态能力），并提供一个 `/pwmc` 斜杠命令作为快捷入口。

```
内核配置（本插件等效的 MCP 配置）
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--caps=storage"]
    }
  }
}
```

## 能力一览

激活后，模型会获得 41 个工具，命名空间为 `mcp__playwright__*`：

| 类别 | 工具 |
|---|---|
| 导航 | `browser_navigate` `browser_navigate_back` `browser_tabs` `browser_wait_for` |
| 交互 | `browser_click` `browser_type` `browser_hover` `browser_drag` `browser_drop` `browser_press_key` `browser_select_option` `browser_fill_form` `browser_handle_dialog` `browser_file_upload` |
| 观察 | `browser_snapshot` `browser_take_screenshot` `browser_find` `browser_console_messages` `browser_evaluate` `browser_network_requests` `browser_network_request` `browser_run_code_unsafe` |
| 存储（`--caps=storage`） | `browser_storage_state` `browser_set_storage_state` `browser_cookie_*` `browser_localstorage_*` `browser_sessionstorage_*` |
| 其他 | `browser_close` `browser_resize` `browser_network_request` |

## 使用方法

### 方式一：直接让模型用浏览器

插件激活后，模型在对话中随时可以直接调用浏览器工具。例如：

```
用浏览器打开 https://example.com 并截图
```

### 方式二：`/pwmc` 斜杠命令（推荐）

聊天框直接输入 `/pwmc <自然语言指令>`：

```
/pwmc 打开 https://example.com 并截图
/pwmc 搜索「DeepSeek 最新发布」并把第一页结果整理成列表
/pwmc 帮我测试这个登录表单：用户名 admin，密码 123456
/pwmc 把当前页面的 cookies 列出来
```

命令 handler 会把指令包装成一条用户消息注入会话（`agent.followup`），下一个模型回合自动用浏览器工具执行，结果直接出现在对话里。

无参数时输入 `/pwmc` 会返回用法提示。

## 安装（在 DSH GUI 中）

### 1. 定义插件

用动态插件流程（cordis_define），`code.host` 使用 [`plugin.js`](./plugin.js) 的内容，`idPrefix` 建议 `pwmc`（Host 会分配完整 ID，如 `pwmc-1`）。

> 该文件即当前插件 `pwmc-1/pkg-10` 的完整宿主源码（v4，含 `/pwmc` 命令）。

### 2. 激活

用返回的 `pluginId` / `packageId` 调用 cordis_run（首次 `run`，后续版本切换 `update`）。激活是纯 Host 的，不需要浏览器审批。

### 3. 验证

- 工具注册：模型可用工具列表应出现 41 个 `mcp__playwright__*` 工具。
- 命令注册：`/pwmc` 出现在斜杠命令列表中。
- 端到端：聊天框输入 `/pwmc 打开 https://example.com 并截图`。

## 实现要点（维护者必读）

- **沙箱限制**：动态插件不能 `require()`，所以无法复用宿主内置的 `@deepseek-ai/dsh-mcp-client`；本插件用 `ctx.get('subprocess').spawn()` 手写了一个最小 MCP stdio 客户端（newline-delimited JSON-RPC 2.0）。
- **协议**：`initialize`（protocolVersion `2025-03-26`）→ `notifications/initialized` → `tools/list`（分页）→ 每工具 `harness.defineTool` + `harness.registerTool`；调用时转发 `tools/call`。
- **Schema 转换**：MCP `inputSchema` 转 harness 参数 DSL。**注意 `required` 必须是根级数组**（`parameters: { type:'object', properties, required:[...] }`），把 `required:true` 写在属性上会导致 defineTool 拒绝（实测 41 个工具里 28 个因此注册失败）。
- **ctx.effect 陷阱**：`ctx.effect(cb)` 的 **cb 立即执行**（setup 语义），返回的函数才是 stop 时的 disposer。清理逻辑放错位置会立刻 `closed=true` 导致桥接永不启动（本插件踩过的坑）。
- **进程管理**：`spawn` 用 `stdin:'pipe', stdout:'pipe'`，`stderr` 用 collect（`{maxBytes}`）；pipe 模式才有 `handle.stdout`，collect 模式才有 `handle.collected`。进程退出自动重连（指数退避，最多 10 次），`notifications/tools/list_changed` 自动重新同步。
- **超时/取消**：每个工具 120s 超时；`execute` 转发 `exec.signal`，abort 时拒绝挂起的 JSON-RPC 响应。
- **npm 缓存**：`npm_config_cache` 指向可写目录（默认 `~/.npm` 在 macOS 上可能被 root 文件锁死报 EPERM）；`npx -y` 避免交互安装确认。
- **`/pwmc` 命令**：通过 `ctx.get('commands').register()` 注册；handler 用 `invocation.agent.followup(message)`（source `{kind:'plugin', plugin:'playwright-mcp'}`）注入用户消息唤醒模型回合。

## 已知限制

- 浏览器截图以 `[image: ...]` 占位符返回给模型（模型上下文不含图像字节）；如需查看截图，用 `browser_take_screenshot` 的 `filename` 参数保存后自行打开。
- 图片/音频等二进制 MCP 块不进入模型上下文（与宿主内置 mcp-client 行为一致）。
- 会话重启后动态插件不保留，需重新定义/激活（或改为宿主 cordis.yml 中挂载 `@deepseek-ai/dsh-mcp-client` 的持久方案）。

## 从动态插件迁移为持久配置（可选）

DSH 宿主自带 `@deepseek-ai/dsh-mcp-client` 桥接插件，可在宿主 cordis.yml 中挂载以获得持久能力（需重启 DSH）：

```yaml
- id: mcp-playwright
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: playwright
    transport: stdio
    command: npx
    args: ['-y', '@playwright/mcp@latest', '--caps=storage']
    env:
      npm_config_cache: /tmp/dsh-pw-mcp-cache
```

工具名将为 `mcp__playwright__browser_navigate` 等（同名），但 `/pwmc` 命令需要另行注册。
