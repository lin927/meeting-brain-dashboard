# 会议助手 · 本机服务

把散落在钉钉 AI 听记里的会议、决策、共识、待办，汇聚成本地可统一检索的「会议资产」。
**给公司同事在本机安装使用**，每人各装一套、各看各的听记；需要时再把单场会按公司元数据标准上传到云端 RAGFlow。

界面在 **http://127.0.0.1:3400**，不再挂在 DSH tab 上。DSH / WorkBuddy 等仍可通过本机 API（以及后续 MCP）查询。

## 隐私边界（请先阅读）

| 环节 | 位置 | 是否本地 |
|---|---|---|
| 听记数据存储 | 本机 SQLite（`~/.dsh/meetings/meeting-brain.sqlite`） | ✅ 本机 |
| 语义嵌入 | bge-small-zh 中文模型（首次联网下载 24MB，之后离线） | ✅ 本机 |

> ⚠️ **模型下载源**：默认从 HuggingFace 主站下载，国内网络可能超时（表现为语义问答报「fetch failed」）。
> 若首次同步后语义检索失败，设置环境变量走国内镜像：`MEETING_BRAIN_MIRROR=1`（hf-mirror.com），
> 然后重启后端重试；也可手动把模型缓存放到
> `node_modules/@huggingface/transformers/.cache/Xenova/bge-small-zh-v1.5/`。
| 向量检索 / 待办 / 统计 | 本机计算 | ✅ 本机 |
| 会议助手界面 | 本机浏览器打开 `localhost:3400` | ✅ 本机 |
| **AI 问答 / 深度总结** | 会议相关片段发送至 **DeepSeek 云端**生成 | ⚠️ 出网 |
| **上传公司会议知识库** | 按公司要求写入云端 RAGFlow（需先在界面勾选） | ⚠️ 出网 |

> 若需完全离线（会议内容不出内网），可把后端 AI 调用指向本地 Ollama ——
> 见文末「完全本地模式」。默认配置维持 DeepSeek 云端（总结质量更高）。
> 未勾选「允许上传公司知识库」的会议不会离开本机库。

## 前置条件（每台电脑）

1. **macOS**（Windows 见 `scripts/install.ps1`，钉钉 DWS 官方支持跨平台）
2. **Node.js ≥ 22.5**（[nodejs.org](https://nodejs.org)）
3. **DSH（可选）**：本仓库界面已独立。DSH 仍可注册会议查询工具，供对话里问会议；不是打开界面的前提。
4. **钉钉 DWS CLI**：脚本会自动安装（`npm install -g dingtalk-workspace-cli`），并自动弹出 `dws auth login` 扫码登录（需账号能访问听记——自己 A1 卡录的 + 他人分享的）。也可手动执行 `dws auth login`
5. **DeepSeek API Key**：写入 `~/.dsh/.credentials.yaml` 的 `DEEPSEEK_API_KEY: sk-xxx`（AI 问答/深度总结用）

## 安装（一键）

```bash
git clone <你的私有仓库地址> meeting-brain-dashboard
cd meeting-brain-dashboard
bash scripts/install.sh        # macOS
# 或 Windows PowerShell：
# powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

脚本自动完成：检查 Node/DWS → 安装依赖 → 构建独立界面 → 可选注册 DSH 会议工具 → 启动本机服务（localhost:3400）。

数据库无需准备：首次「立即同步」时自动创建 `~/.dsh/meetings/meeting-brain.sqlite` 并建表。

> DSH 仍可通过 `dsh.bundle.patch` 注册 `meeting_brain_ask` 等工具。界面不再作为 DSH client 插件挂载。

## 使用

1. 浏览器打开 **http://127.0.0.1:3400**
2. 「同步」页确认 DWS 已登录，点「立即同步」拉取钉钉听记
3. 「会议」里浏览、检索、修改关键信息；需要进公司库的场次勾选「允许上传到公司会议知识库」
4. 「导入」可粘贴非钉钉纪要/转写

公司 RAGFlow 的 API、KEY 与会议文档元数据标准开发时再接入；勾选后会先在本机标记为公司可见。

### 词表与深度总结

AI 深度总结按仓库里的提炼提示词生成，并用本地词表把「勇哥 / 宋总」等称呼落成正式姓名。

| 文件 | 位置 | 作用 |
|---|---|---|
| 提炼提示词（默认） | `server/会议记录提炼提示词.md` | 随仓库更新，所有人共用 |
| 提炼提示词（本机覆盖） | `~/.dsh/meetings/summarize-prompt.md` | 可选；有则优先于仓库文件 |
| 词表默认 | `server/glossary.default.json` | 公司共用称呼/人名 |
| 词表本机 | `~/.dsh/meetings/glossary.json` | 首次自动复制默认表；`people` / `projects` / `terms` 均按 `name` 覆盖或增补 |

`people`、`projects`、`terms` 格式相同：可以是字符串，也可以是 `{ "name": "正式写法", "aliases": ["口述或误识别"] }`。本机文件覆盖仓库默认里同名条目。

原始逐字稿不改，只在深度总结里用正式姓名和标准用词。一对多称呼（如「海哥」）仅在本场参会人能唯一确定时落名，否则保留原称呼并列候选。

## 架构

```
钉钉 DWS（听记） ──dws minutes──▶ 本机服务 (server/index.js, localhost:3400)
                                      ├─ 独立 Web（public/ + src/client）
                                      ├─ lib/db.js    本机 SQLite
                                      ├─ lib/pull.js  拉取听记
                                      ├─ lib/embed.js 本地 bge-small-zh 嵌入
                                      ├─ lib/ask.js   DeepSeek RAG 语义问答
                                      └─ /api/publish 标记公司可见 → 云端 RAGFlow（API 待接入）
                                              │
DSH / WorkBuddy / …  ◀── HTTP / 后续 MCP ── 本机服务
```

## 常见问题

- **同步不到听记**：确认 `dws auth login` 已登录、账号有听记权限；查看后端日志 `tail -f ~/.dsh/meetings/backend.log`
- **打不开界面**：浏览器访问 http://127.0.0.1:3400 ；若失败查看日志并执行 `bash scripts/restart.sh`
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
