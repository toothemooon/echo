/**
 * Playwright MCP Bridge — dynamic Cordis plugin for DeepSeek Harness (DSH).
 *
 * Spawns `@playwright/mcp` over stdio and registers its browser tools on the
 * harness tool registry under `mcp__playwright__<name>`, so the model can
 * drive a real browser (navigate, click, type, snapshot, screenshot, cookies,
 * storage, …) at any time. Also registers a `/pwmc` slash command that turns
 * a natural-language instruction into a follow-up user message; the next model
 * turn then executes it with the registered tools.
 *
 * How to use (in the DSH GUI, dynamic plugin flow):
 *   1. cordis_define with this body as code.host (idPrefix e.g. "pwmc").
 *   2. cordis_run the returned pluginId/packageId.
 *   3. In the chat box type  /pwmc 打开 https://example.com 并截图
 *      or just ask the model to use the browser directly.
 *
 * How it works:
 *   - The sandbox cannot `require()` @deepseek-ai/dsh-mcp-client, so this
 *     implements a minimal MCP stdio client (newline-delimited JSON-RPC 2.0)
 *     on top of ctx.get('subprocess').spawn().
 *   - initialize -> notifications/initialized -> tools/list (paginated) ->
 *     one harness.defineTool + harness.registerTool per tool.
 *   - tools/call is forwarded per execute; exec.signal aborts the pending
 *     JSON-RPC response. isError from the server rejects the tool call.
 *   - Process exit triggers unregister + exponential-backoff reconnect;
 *     notifications/tools/list_changed re-syncs the tool set.
 *   - ctx.effect registers the cleanup disposer ONLY (its callback runs at
 *     setup time; the returned function runs on stop).
 *
 * Environment notes:
 *   - `npm_config_cache` points at a writable cache dir because the default
 *     `~/.npm` cache can be locked by root-owned files on macOS (EPERM).
 *   - `-y` avoids npx's interactive install prompt.
 *   - cwd comes from sandboxPolicy.workspaceRoot (usually the user home).
 */
return {
  inject: ['timer'],
  async apply(ctx) {
    const subprocess = ctx.get('subprocess')
    if (subprocess === undefined) {
      console.error('[playwright-mcp] subprocess service unavailable; bridge disabled')
      return
    }
    const policy = ctx.get('sandboxPolicy')
    const cwd = policy && typeof policy.workspaceRoot === 'string' ? policy.workspaceRoot : '/'
    const NPM_CACHE = '/tmp/dsh-pw-mcp-cache'
    const TOOL_TIMEOUT = 120000
    const CMD = ['npx', '-y', '@playwright/mcp@latest', '--caps=storage']

    let child = null
    let closed = false
    let nextId = 0
    let lineBuf = ''
    let retryCount = 0
    let initTimer = null
    let msgSeq = 0
    const pending = new Map()
    const disposers = new Map()

    const log = (...a) => console.log('[playwright-mcp]', ...a)

    function clearPending(err) {
      for (const [id, p] of pending) {
        if (p.timer) p.timer()
        p.reject(err)
      }
      pending.clear()
    }

    function unregisterAll() {
      for (const [name, dispose] of disposers) {
        try { dispose() } catch (e) { console.error('[playwright-mcp] unregister failed', name, e) }
      }
      disposers.clear()
    }

    function send(method, params, timeoutMs) {
      return new Promise((resolve, reject) => {
        if (!child || child.pid === -1) {
          reject(new Error('Playwright MCP process is not running'))
          return
        }
        const id = ++nextId
        const msg = { jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) }
        const timer = ctx.timeout(() => {
          pending.delete(id)
          reject(new Error('Playwright MCP timeout: ' + method))
        }, timeoutMs ?? 30000)
        pending.set(id, { resolve, reject, timer })
        child.stdin.write(JSON.stringify(msg) + '\n')
      })
    }

    // Convert one MCP JSON-Schema node into the harness unified value schema.
    function convertNode(node) {
      if (typeof node !== 'object' || node === null) return { type: 'json' }
      const out = {}
      if (node.description !== undefined) out.description = node.description
      if (node.title !== undefined) out.title = node.title
      if (node.default !== undefined) out.default = node.default
      if (node.examples !== undefined) out.examples = node.examples
      const t = node.type
      if (Array.isArray(t)) {
        const nonNull = t.filter((x) => x !== 'null')
        if (nonNull.length === 1) return { ...out, type: nonNull[0] }
        return { ...out, type: 'json' }
      }
      if (t === 'string' || t === 'number' || t === 'integer' || t === 'boolean' || t === 'null') {
        if (Array.isArray(node.enum)) out.enum = node.enum
        if (node.const !== undefined) out.const = node.const
        return { ...out, type: t }
      }
      if (t === 'array') {
        const res = { ...out, type: 'array' }
        if (node.items) res.items = convertNode(node.items)
        return res
      }
      if (t === 'object') {
        const res = { ...out, type: 'object', additionalProperties: true }
        if (node.properties && typeof node.properties === 'object') {
          res.properties = {}
          for (const [n, p] of Object.entries(node.properties)) res.properties[n] = convertNode(p)
        }
        return res
      }
      return { ...out, type: 'json' }
    }

    // MCP inputSchema -> harness parameters. NOTE: `required` must be the
    // ROOT-level array on the raw JSON-Schema wrapper; putting required:true
    // on each property makes defineTool reject the whole tool.
    function toDslSchema(input) {
      if (!input || typeof input !== 'object') return {}
      const props = input.properties && typeof input.properties === 'object' ? input.properties : {}
      const required = Array.isArray(input.required) ? input.required.filter((n) => Object.prototype.hasOwnProperty.call(props, n)) : []
      const outProps = {}
      for (const [name, ps] of Object.entries(props)) {
        outProps[name] = convertNode(ps)
      }
      const root = { type: 'object', properties: outProps }
      if (required.length > 0) root.required = required
      if (input.description) root.description = input.description
      return root
    }

    // Forward one tools/call and project the MCP result into a JSON value.
    async function callTool(rawName, args, signal) {
      if (!child || child.pid === -1) throw new Error('Playwright MCP process is not running')
      const result = await new Promise((resolve, reject) => {
        const id = ++nextId
        const msg = {
          jsonrpc: '2.0',
          id,
          method: 'tools/call',
          params: { name: rawName, arguments: args ?? {} },
        }
        const timer = ctx.timeout(() => {
          pending.delete(id)
          reject(new Error('Playwright MCP call timed out: ' + rawName))
        }, TOOL_TIMEOUT)
        const onAbort = () => {
          if (pending.has(id)) {
            pending.delete(id)
            timer()
            reject(new Error('Playwright MCP call aborted: ' + rawName))
          }
        }
        pending.set(id, { resolve, reject, timer })
        if (signal && typeof signal.addEventListener === 'function') {
          signal.addEventListener('abort', onAbort, { once: true })
        }
        child.stdin.write(JSON.stringify(msg) + '\n')
      })
      const raw = result && typeof result === 'object' ? result : { content: [] }
      const parts = []
      for (const block of Array.isArray(raw.content) ? raw.content : []) {
        if (!block || typeof block !== 'object') continue
        if (block.type === 'text') parts.push(String(block.text ?? ''))
        else if (block.type === 'image') parts.push('[image: ' + (block.mimeType ?? 'image/png') + ']')
        else if (block.type === 'resource') parts.push('[resource: ' + ((block.resource && block.resource.uri) ?? 'unknown') + ']')
        else if (block.type === 'audio') parts.push('[audio]')
        else parts.push('[' + String(block.type ?? 'unknown') + ']')
      }
      const text = parts.join('\n')
      if (raw.isError === true) throw new Error(text || 'Playwright MCP tool failed: ' + rawName)
      return { text, isError: false }
    }

    async function initializeAndSync() {
      const init = await send('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'dsh-playwright-mcp', version: '1.0.0' },
      })
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
      log('connected:', JSON.stringify(init.serverInfo ?? {}), 'protocol:', init.protocolVersion)
      const tools = []
      let cursor = undefined
      do {
        const res = await send('tools/list', cursor !== undefined ? { cursor } : undefined)
        if (Array.isArray(res.tools)) tools.push(...res.tools)
        cursor = res.nextCursor
      } while (cursor)
      unregisterAll()
      let registered = 0
      let failed = 0
      for (const t of tools) {
        if (!t || typeof t.name !== 'string') continue
        const publicName = 'mcp__playwright__' + t.name
        try {
          const tool = harness.defineTool({
            name: publicName,
            description: (t.description || 'Playwright browser tool: ' + t.name) + ' [via @playwright/mcp]',
            parameters: toDslSchema(t.inputSchema),
            output: {
              schema: { type: 'json' },
              render(args, value) {
                const text = value && typeof value === 'object' && typeof value.text === 'string' ? value.text : JSON.stringify(value)
                return [{ type: 'text', text }]
              },
            },
            timeoutMs: TOOL_TIMEOUT,
            execute: async (args, exec) => {
              return callTool(t.name, args, exec.signal)
            },
          })
          const dispose = harness.registerTool(ctx, tool)
          disposers.set(publicName, dispose)
          registered++
        } catch (e) {
          failed++
          console.error('[playwright-mcp] defineTool failed for', t.name, e)
        }
      }
      retryCount = 0
      log('registered', registered, 'tools,', failed, 'failed')
    }

    async function start() {
      if (closed) return
      try {
        child = subprocess.spawn({
          argv: CMD,
          cwd,
          stdio: { stdin: 'pipe', stdout: 'pipe', stderr: { maxBytes: 65536 } },
          graceMs: 3000,
          env: { npm_config_cache: NPM_CACHE },
        })
      } catch (e) {
        console.error('[playwright-mcp] spawn failed:', e)
        scheduleRetry()
        return
      }
      const handle = child
      const decoder = new TextDecoder()
      handle.stdout.on('data', (chunk) => {
        lineBuf += decoder.decode(chunk, { stream: true })
        let idx
        while ((idx = lineBuf.indexOf('\n')) >= 0) {
          const line = lineBuf.slice(0, idx).trim()
          lineBuf = lineBuf.slice(idx + 1)
          if (!line) continue
          let msg
          try { msg = JSON.parse(line) } catch { continue }
          if (msg.id !== undefined && pending.has(msg.id)) {
            const p = pending.get(msg.id)
            pending.delete(msg.id)
            if (p.timer) p.timer()
            if (msg.error) p.reject(new Error('MCP error: ' + JSON.stringify(msg.error)))
            else p.resolve(msg.result)
          } else if (msg.method === 'notifications/tools/list_changed') {
            log('tools changed, re-syncing')
            initializeAndSync().catch((e) => console.error('[playwright-mcp] re-sync failed:', e))
          } else if (msg.method === 'notifications/message') {
            log('server message:', JSON.stringify(msg.params ?? {}))
          }
        }
      })
      handle.stdout.on('error', (e) => console.error('[playwright-mcp] stdout error:', e))
      handle.done.then((outcome) => {
        if (closed) return
        log('process exited:', JSON.stringify(outcome))
        unregisterAll()
        clearPending(new Error('Playwright MCP process exited'))
        scheduleRetry()
      }).catch((e) => {
        if (closed) return
        console.error('[playwright-mcp] process error:', e)
        scheduleRetry()
      })
      try {
        await initializeAndSync()
      } catch (e) {
        console.error('[playwright-mcp] initialize failed:', e)
        unregisterAll()
        scheduleRetry()
      }
    }

    function scheduleRetry() {
      if (closed) return
      retryCount += 1
      if (retryCount > 10) {
        console.error('[playwright-mcp] giving up after 10 failed attempts')
        return
      }
      const delay = Math.min(500 * Math.pow(2, retryCount - 1), 30000)
      log('retrying in', delay, 'ms (attempt', retryCount + ')')
      initTimer = ctx.timeout(() => { initTimer = null; start() }, delay)
    }

    // IMPORTANT: ctx.effect's callback RUNS IMMEDIATELY (setup); the function
    // it returns is the disposer invoked on stop. Putting cleanup logic in the
    // callback body would run it at startup and kill the bridge instantly.
    ctx.effect(() => {
      return () => {
        closed = true
        if (initTimer) { initTimer(); initTimer = null }
        unregisterAll()
        clearPending(new Error('Playwright MCP plugin stopped'))
        if (child && child.pid !== -1) child.terminate()
      }
    })

    const commands = ctx.get('commands')
    if (commands !== undefined) {
      ctx.effect(() => {
        return commands.register({
          name: 'pwmc',
          description: '用 Playwright 浏览器执行指令：/pwmc <指令>，例如 /pwmc 打开 example.com 并截图',
          input: { hint: '浏览器操作指令，如：打开 https://example.com 并截图' },
          handler: (invocation) => {
            const instruction = String(invocation.rawInput || '').trim()
            if (!instruction) {
              return {
                kind: 'error',
                text: '用法：/pwmc <指令>，例如 /pwmc 打开 example.com 并截图。模型会在下一回合用 Playwright 浏览器工具执行。',
              }
            }
            try {
              const id = 'pwmc-' + Date.now().toString(36) + '-' + (++msgSeq).toString(36)
              const message = {
                id,
                role: 'user',
                content: [{ type: 'text', text: '（/pwmc 指令）请使用 Playwright 浏览器工具（mcp__playwright__*）执行：' + instruction }],
                source: { kind: 'plugin', plugin: 'playwright-mcp' },
              }
              invocation.agent.followup(message)
              return { kind: 'success', text: '已提交给模型，将用 Playwright 浏览器执行：' + instruction }
            } catch (e) {
              console.error('[playwright-mcp] /pwmc handler failed:', e)
              return { kind: 'error', text: '/pwmc 提交失败：' + String(e && e.message ? e.message : e) }
            }
          },
        })
      })
    } else {
      log('commands service unavailable; /pwmc not registered')
    }

    start()
  },
}
