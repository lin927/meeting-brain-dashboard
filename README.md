# 会议智能中枢 · 分发包（Meeting Brain Dashboard）

把散落在钉钉 AI 听记里的会议、决策、共识、待办，汇聚成本地可统一检索的「会议资产」。
**给公司同事在本机安装使用**，每人各装一套、各看各的听记，数据不出个人电脑。

## 隐私边界（请先阅读）

| 环节 | 位置 | 是否本地 |
|---|---|---|
| 听记数据存储 | 本机 SQLite（`~/.dsh/meetings/meeting-brain.sqlite`） | ✅ 本机 |
| 语义嵌入 | bge-small-zh 中文模型（首次联网下载 24MB，之后离线） | ✅ 本机 |
| 向量检索 / 待办 / 统计 | 本机计算 | ✅ 本机 |
| 驾驶舱界面 | 本机浏览器 + DSH Web | ✅ 本机 |
| **AI 问答 / 深度总结** | 会议相关片段发送至 **DeepSeek 云端**生成 | ⚠️ 出网 |

> 若需完全离线（会议内容不出内网），可把后端 AI 调用指向本地 Ollama ——
> 见文末「完全本地模式」。默认配置维持 DeepSeek 云端（总结质量更高）。

## 前置条件（每台电脑）

1. **macOS**（Windows 见 `scripts/install.ps1`，钉钉 DWS 官方支持跨平台）
2. **Node.js ≥ 22.5**（[nodejs.org](https://nodejs.org)）
3. **DSH（DeepSeek Harness）**：本仓库不含 DSH 本体，只含驾驶舱插件。安装脚本会自动检测并在缺失时给出指引；也可以先手动安装：
   ```bash
   npx @deepseek-ai/dsh web    # 首次运行自动安装 DSH 并启动 Web（127.0.0.1:3080）
   ```
   看到 DSH 界面后 Ctrl+C 停止，再继续下面的安装。
4. **钉钉 DWS CLI**：`curl -fsSL https://dws.dingtalk.com/install | bash`（参考 [dingtalk-workspace-cli](https://github.com/DingTalk-Real-AI/dingtalk-workspace-cli)），并 `dws login`（需账号能访问听记——自己 A1 卡录的 + 他人分享的）
5. **DeepSeek API Key**：写入 `~/.dsh/.credentials.yaml` 的 `DEEPSEEK_API_KEY: sk-xxx`（AI 问答/深度总结用）

## 安装（一键）

```bash
git clone <你的私有仓库地址> meeting-brain-dashboard
cd meeting-brain-dashboard
bash scripts/install.sh        # macOS
# 或 Windows PowerShell：
# powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

脚本自动完成：检查 Node/DWS → **检测 DSH（缺失时给出安装指引）** → 安装依赖 → 构建插件 bundle → 注册到 DSH Web profile（`dsh.profile.bundles` + `file:` 依赖）→ 启动本地后端（localhost:3400）。

数据库无需准备：首次「立即同步」时自动创建 `~/.dsh/meetings/meeting-brain.sqlite` 并建表。

> **插件注册机制**：`meeting-brain-dashboard` 是「客户端插件 + bundle patch」双角色 npm 包。
> `package.json` 声明 `dsh.bundle.patch`（`cordis.patch.yml` 把插件行注册进 loader）和 `dsh.client`
> （client-modules 扫描后自动挂载浏览器 half 到 `/plugins/meeting-brain-dashboard/client.js`）。
> 包零生产依赖（后端依赖在 `devDependencies`，仓库根 `npm install` 安装），因此 profile 的
> `pnpm install` 秒级完成，不会重复下载 transformers/onnxruntime。

## 使用

1. **重启 DSH Web GUI**（插件注册需重启生效）
2. 对话界面顶部出现「会议驾驶舱」tab
3. 首次使用点「立即同步」，拉取你的钉钉听记（增量，只拉新的）
4. 浏览本周/全部会议、待办闭环；问语义问题（如「孟底沟项目有什么待办？」）；打开会议看「会议记录 / 逐字稿 / AI 深度总结」

## 架构

```
钉钉 DWS（听记） ──dws minutes──▶ 本机后端 (server/index.js, localhost:3400)
                                      ├─ lib/db.js    本机 SQLite（会议/待办/向量块）
                                      ├─ lib/pull.js  拉取听记
                                      ├─ lib/embed.js 本地 bge-small-zh 嵌入
                                      ├─ lib/ask.js   DeepSeek RAG 语义问答
                                      └─ lib/overview.js 概览/待办/详情
                                      │
DSH Web GUI ◀──fetch /api/*── 本机后端
    └─「会议驾驶舱」tab（src/client 插件 bundle）
```

## 常见问题

- **同步不到听记**：确认 `dws login` 已登录、账号有听记权限；查看后端日志 `tail -f ~/.dsh/meetings/backend.log`
- **驾驶舱报「后端未启动」**：`node server/index.js` 手动启动，确认 3400 端口未被占用
- **DeepSeek key 未生效**：`~/.dsh/.credentials.yaml` 需含 `DEEPSEEK_API_KEY`，改后重启后端
- **首次同步较慢**：`dws +search` 全量扫描 + 逐条 `+detail`；之后增量很快
- **AI 深度总结无逐字稿**：该会议可能是语音通话类无转写，或未同步到 transcript

## 开发

```bash
npm install
npm run build        # 构建 client bundle → lib/client.js
npm run server       # 启动后端（本地测试）
```

## 完全本地模式（可选）

后端 `lib/ask.js` 使用 OpenAI 兼容接口（`DEEPSEEK_BASE_URL` 可覆盖）。把 `DEEPSEEK_BASE_URL` 指向本地 Ollama（如 `http://127.0.0.1:11434/v1`）+ `DEEPSEEK_MODEL=qwen2.5:7b`，
会议内容即不出内网（需部署机器有足够内存/显存）。
