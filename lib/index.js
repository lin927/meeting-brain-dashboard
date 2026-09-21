// src/host/index.js
import { defineTool } from "@deepseek-ai/dsh-tools";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
var BACKEND_PORTS = [3400, 3401, 3402, 3403, 3404];
var __dirname = dirname(fileURLToPath(import.meta.url));
function findRepoDir() {
  if (process.env.MEETING_BRAIN_REPO && existsSync(join(process.env.MEETING_BRAIN_REPO, "server", "index.js"))) {
    return process.env.MEETING_BRAIN_REPO;
  }
  const candidates = [
    join(__dirname, ".."),
    // profile 副本或仓库内：node_modules/xxx/lib -> 包根
    join(__dirname, "..", ".."),
    // 更上层兜底
    join(homedir(), "meeting-brain-dashboard"),
    join(homedir(), "code", "meeting-brain-dashboard"),
    join(homedir(), "code", "meeting-brain-dashboard", "meeting-brain-dashboard")
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "server", "index.js"))) return c;
  }
  return null;
}
async function probeBackend(port, timeoutMs = 2e3) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return false;
    const j = await res.json();
    return !!(j && j.ok && j.name === "meeting-brain");
  } catch {
    return false;
  }
}
async function findHealthyBackend() {
  for (const p of BACKEND_PORTS) {
    if (await probeBackend(p)) return p;
  }
  return null;
}
async function findFreePort() {
  for (const p of BACKEND_PORTS) {
    if (await probeBackend(p, 800)) continue;
    try {
      const res = await fetch(`http://127.0.0.1:${p}/`, { signal: AbortSignal.timeout(600) });
      if (res.ok) continue;
    } catch {
      return p;
    }
  }
  return BACKEND_PORTS[0];
}
function startBackend(port) {
  const repoDir = findRepoDir();
  if (!repoDir) throw new Error("\u65E0\u6CD5\u5B9A\u4F4D meeting-brain \u4ED3\u5E93\u76EE\u5F55\uFF08server/index.js\uFF09\uFF0C\u8BF7\u8BBE\u7F6E MEETING_BRAIN_REPO \u73AF\u5883\u53D8\u91CF");
  const serverPath = join(repoDir, "server", "index.js");
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: "ignore"
  });
  child.on("error", (e) => {
    console.error("[meeting-brain] \u540E\u7AEF\u542F\u52A8\u5931\u8D25:", e.message);
  });
  return child;
}
var managedChild = null;
async function ensureBackend() {
  const existing = await findHealthyBackend();
  if (existing !== null) return existing;
  const port = await findFreePort();
  try {
    managedChild = startBackend(port);
    return port;
  } catch (e) {
    console.error("[meeting-brain] \u540E\u7AEF\u542F\u52A8\u5F02\u5E38:", e.message);
    return null;
  }
}
var watchdogBusy = false;
async function watchdogTick() {
  if (watchdogBusy) return;
  watchdogBusy = true;
  try {
    await ensureBackend();
  } finally {
    watchdogBusy = false;
  }
}
var cachedPort = null;
async function resolvePort() {
  if (cachedPort !== null) {
    if (await probeBackend(cachedPort, 800)) return cachedPort;
    cachedPort = null;
  }
  const port = await ensureBackend();
  if (port !== null) cachedPort = port;
  return port;
}
async function callBackend(path, body) {
  const port = await resolvePort();
  if (port === null) throw new Error("meeting-brain \u540E\u7AEF\u4E0D\u53EF\u7528\uFF08\u65E0\u6CD5\u542F\u52A8\uFF09");
  const url = `http://127.0.0.1:${port}${path}`;
  const res = await fetch(url, body === void 0 ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
  }
  if (!res.ok) {
    throw new Error(`meeting-brain \u540E\u7AEF\u9519\u8BEF ${res.status}: ${data && data.error || text.slice(0, 200)}`);
  }
  return data;
}
var name = "meeting-brain-tools";
var inject = ["tools", "timer"];
function apply(ctx) {
  const tools = ctx.tools;
  const def = (o) => tools.register(defineTool(o));
  def({
    name: "meeting_brain_ask",
    description: "\u8DE8\u4F1A\u8BAE\u8BED\u4E49\u95EE\u7B54\uFF1A\u5728\u672C\u5730\u4F1A\u8BAE\u5E93\u91CC\u68C0\u7D22\u4E0E\u95EE\u9898\u76F8\u5173\u7684\u542C\u8BB0/\u6458\u8981/\u5F85\u529E\uFF0C\u5E76\u7ED3\u5408 DeepSeek \u751F\u6210\u5E26\u6765\u6E90\u7684\u7B54\u6848\u3002\u9002\u5408\u95EE\u300C\u5B5F\u5E95\u6C9F\u9879\u76EE\u6709\u4EC0\u4E48\u5F85\u529E\uFF1F\u300D\u300C\u4E0A\u5468\u4F1A\u8BAE\u8BA8\u8BBA\u4E86\u4EC0\u4E48\uFF1F\u300D\u300CXX\u51B3\u7B56\u662F\u600E\u4E48\u5B9A\u7684\uFF1F\u300D\u8FD9\u7C7B\u8DE8\u4F1A\u8BAE\u7684\u81EA\u7136\u8BED\u8A00\u95EE\u9898\u3002",
    parameters: {
      query: {
        type: "string",
        required: true,
        description: "\u8981\u95EE\u7684\u95EE\u9898\uFF0C\u81EA\u7136\u8BED\u8A00\uFF0C\u5982\uFF1A\u5B5F\u5E95\u6C9F\u9879\u76EE\u6709\u4EC0\u4E48\u5F85\u529E\uFF1F"
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          answer: { type: "string", description: "\u751F\u6210\u7684\u7B54\u6848\uFF08\u542B [\u4F1A\u8BAE\u6807\u9898] \u6765\u6E90\u5F15\u7528\uFF09" },
          hits: { type: "array", items: { type: "object", additionalProperties: true } }
        }
      },
      render: (_args, value) => [{ type: "text", text: value.answer || "(\u65E0\u7ED3\u679C)" }]
    },
    async execute(args) {
      const query = String(args.query || "").trim();
      if (!query) throw new Error("\u7F3A\u5C11 query");
      const r = await callBackend("/api/ask", { query });
      return { answer: r.answer || "", hits: r.hits || [] };
    }
  });
  def({
    name: "meeting_brain_todos",
    description: "\u6309\u65F6\u95F4\u8303\u56F4\u67E5\u8BE2\u4F1A\u8BAE\u5F85\u529E\uFF08\u4ECA\u5929/\u6628\u5929/\u672C\u5468/\u8FD1N\u5929\uFF09\u3002\u9002\u5408\u95EE\u300C\u4ECA\u5929\u6709\u4EC0\u4E48\u5F85\u529E\uFF1F\u300D\u300C\u672C\u5468\u7684\u5F85\u529E\u6709\u54EA\u4E9B\uFF1F\u300D\u300C\u8FD17\u5929\u6709\u54EA\u4E9B\u5F85\u529E\uFF1F\u300D\u3002\u8FD4\u56DE\u6309\u4F1A\u8BAE\u5206\u7EC4\u7684\u5F85\u529E\u5217\u8868\u3002",
    parameters: {
      range: {
        type: "string",
        required: true,
        enum: ["today", "yesterday", "thisWeek", "last7days", "last30days"],
        description: "\u65F6\u95F4\u8303\u56F4\uFF1Atoday=\u4ECA\u5929, yesterday=\u6628\u5929, thisWeek=\u672C\u5468, last7days=\u8FD17\u5929, last30days=\u8FD130\u5929"
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string", description: "\u53EF\u8BFB\u7684\u5F85\u529E\u6C47\u603B" },
          meetings: { type: "array", items: { type: "object", additionalProperties: true } }
        }
      },
      render: (_args, value) => [{ type: "text", text: value.summary || "(\u65E0\u7ED3\u679C)" }]
    },
    async execute(args) {
      const range = String(args.range || "");
      if (!range) throw new Error("\u7F3A\u5C11 range");
      let r = await callBackend("/api/todos-range", { range });
      if (r && r.error) throw new Error(r.error);
      const label = r.label || range;
      const lines = [`${label}\uFF1A${r.count || 0} \u9879\u5F85\u529E`];
      for (const m of r.meetings || []) {
        const acts = m.actions || [];
        if (acts.length === 0) continue;
        lines.push(`\xB7 ${m.title}\uFF08${acts.length}\u9879\uFF09\uFF1A`);
        acts.forEach((a) => lines.push(`    - ${a.title}${a.status === "open" ? "\uFF08\u672A\u5B8C\u6210\uFF09" : ""}`));
      }
      return { summary: lines.join("\n"), meetings: r.meetings || [] };
    }
  });
  def({
    name: "meeting_brain_keywords",
    description: "\u5173\u952E\u8BCD\u5168\u6587\u68C0\u7D22\uFF1A\u627E\u51FA\u660E\u786E\u5305\u542B\u6307\u5B9A\u8BCD\u7684\u4F1A\u8BAE\uFF08\u6807\u9898/\u6458\u8981/\u9010\u5B57\u7A3F\u4E2D\u76F4\u63A5\u51FA\u73B0\u8BE5\u8BCD\uFF09\u3002\u9002\u5408\u300C\u54EA\u4E9B\u4F1A\u8BAE\u63D0\u5230\u4E86XX\u300D\u300C\u54EA\u4E9B\u4F1A\u8BAE\u8BA8\u8BBA\u8FC7XX\u300D\u8FD9\u7C7B\u95EE\u9898\u2014\u2014\u7ED3\u679C\u4E00\u5B57\u4E0D\u6F0F\uFF08\u6309\u5B57\u9762\u5339\u914D\uFF09\uFF0C\u533A\u522B\u4E8E\u8BED\u4E49\u68C0\u7D22\uFF08\u8BED\u4E49\u76F8\u8FD1\u4F46\u4E0D\u542B\u539F\u8BCD\uFF09\u3002",
    parameters: {
      keyword: {
        type: "string",
        required: true,
        description: "\u8981\u68C0\u7D22\u7684\u5173\u952E\u8BCD\uFF0C\u5982\uFF1A\u7B2C\u4E00\u6027\u539F\u7406"
      }
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string", description: "\u6309\u4F1A\u8BAE\u5217\u51FA\u7684\u68C0\u7D22\u7ED3\u679C" },
          meetings: { type: "array", items: { type: "object", additionalProperties: true } }
        }
      },
      render: (_args, value) => [{ type: "text", text: value.summary || "(\u65E0\u7ED3\u679C)" }]
    },
    async execute(args) {
      const keyword = String(args.keyword || "").trim();
      if (!keyword) throw new Error("\u7F3A\u5C11 keyword");
      const r = await callBackend("/api/search-keywords?keyword=" + encodeURIComponent(keyword));
      if (r && r.error) throw new Error(r.error);
      const lines = [`\u5173\u952E\u8BCD\u300C${r.keyword}\u300D\u547D\u4E2D ${r.count} \u573A\u4F1A\u8BAE\uFF1A`];
      for (const m of r.meetings || []) {
        const where = m.matchedIn === "title" ? "\u6807\u9898" : m.matchedIn === "summary" ? "\u6458\u8981" : "\u9010\u5B57\u7A3F";
        const d = m.time ? new Date(m.time).toLocaleDateString("zh-CN") : "";
        lines.push(`\xB7 ${m.title}\uFF08${d}\uFF0C\u547D\u4E2D${where}\uFF09`);
      }
      return { summary: lines.join("\n"), meetings: r.meetings || [] };
    }
  });
  ensureBackend().catch((e) => console.error("[meeting-brain] \u521D\u59CB\u540E\u7AEF\u542F\u52A8\u5931\u8D25:", e.message));
  const watchdog = ctx.interval(() => {
    watchdogTick().catch((e) => console.error("[meeting-brain] \u770B\u95E8\u72D7\u5F02\u5E38:", e.message));
  }, 30 * 1e3);
  ctx.on("dispose", () => {
    managedChild = null;
  });
}
export {
  apply,
  inject,
  name
};
