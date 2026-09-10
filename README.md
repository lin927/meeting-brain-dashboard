# 会议助手 · 本机服务

把散落在钉钉 AI 听记里的会议、决策、共识、待办，汇聚成本地可统一检索的「会议资产」。
每人在自己电脑上各装一套、各看各的听记；需要时再把单场会按类型上传到公司 RAGFlow 对应知识库。

界面：**http://127.0.0.1:3400**（本机浏览器打开，不依赖 DSH）。顶栏是 **会议 · 待办 · 设置**。

## 隐私边界（请先阅读）

| 环节 | 位置 | 是否本地 |
|---|---|---|
| 听记数据存储 | 本机 SQLite（`~/.dsh/meetings/meeting-brain.sqlite`） | ✅ 本机 |
| 语义嵌入 | bge-small-zh 中文模型（首次联网下载约 24MB，之后离线） | ✅ 本机 |
| 向量检索 / 待办 / 统计 | 本机计算 | ✅ 本机 |
| 会议助手界面 | 本机浏览器打开 `localhost:3400` | ✅ 本机 |
| **AI 问答 / 深度总结** | 会议相关片段发送至配置的大模型（默认 DeepSeek） | ⚠️ 出网 |
| **上传公司知识库** | 写入云端 RAGFlow 四个库之一（需在详情里点上传） | ⚠️ 出网 |

> 未上传的会议不会离开本机。个人会议不能上传。
> 国内网络首次下载嵌入模型可能失败（huggingface.co）；后端会自动改走 hf-mirror 再试。

## 每台电脑需要什么

1. **macOS 或 Windows**
2. **Node.js ≥ 22.5**（[nodejs.org](https://nodejs.org) LTS）。安装脚本在 Mac 上会尝试用 Homebrew 安装，在 Windows 上会尝试用 winget 安装。
3. **钉钉 DWS CLI**：脚本会自动安装并弹出扫码登录（需账号能访问听记）。
4. **大模型 API Key**：装好后在设置页填写（问答/总结用）。
5. **要上传公司库时**：再在设置里填 RAGFlow 地址、密钥，以及四个 dataset id。

不需要安装 DSH。

## 安装（一次）

把仓库放到本机后，在项目目录执行：

**Mac**

```bash
bash scripts/install.sh
```

**Windows**（PowerShell）

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

脚本会：检查 Node / 钉钉 DWS → 安装依赖 → 构建界面 → 在桌面放「会议助手」快捷方式 → 启动服务并打开浏览器。

数据库无需准备：首次点「更新」时自动创建。

## 以后怎么用

双击桌面上的 **会议助手**。服务已在运行则直接打开浏览器；否则先启动再打开。

| | Mac | Windows |
|---|---|---|
| 日常打开 | 双击桌面「会议助手」 | 双击桌面「会议助手」 |
| 也可以 | `bash scripts/start.sh` | `scripts\start.bat` 或 `powershell -ExecutionPolicy Bypass -File scripts\start.ps1` |
| 停止服务 | `bash scripts/stop.sh` | `powershell -ExecutionPolicy Bypass -File scripts\stop.ps1` |

关掉浏览器不会关掉后台服务。要停止再跑上面的停止命令。

首次使用：打开 **设置** 填写大模型 API Key，再到会议列表点 **更新** 拉取钉钉听记。要上传公司库，再到设置里填 RAGFlow。

Mac 若双击桌面快捷方式被系统拦截：右键 → 打开。

## 会议类型与上传

详情里先选类型。列表「更新」只从钉钉拉听记，不会自动上传。

| 类型 | 进哪个知识库 |
|---|---|
| 个人 | 不上传 |
| 公司管理 | 公司管理会议 |
| 公司运营 | 公司运营会议 |
| 项目 | 项目会议（不同项目用标签区分，不拆库） |
| 部门 | 部门会议（不同部门用标签区分，不拆库） |

点 **上传到…** 才会写入对应库：

- 正文优先用本机「总结」，没有则用「记录」；**不传逐字稿**。有待办会附在文末。
- 文件名是 `{日期} {标题}.md`。同一天标题也相同，会加上开会时刻。
- 同一场钉钉听记用 `meeting_id`（听记 id）识别，四个库都会查。库里已有则先确认再覆盖，并记下上传人、时间。
- 点「已到…」会先确认，再从知识库删掉这场会那一篇。本机记录还在。若发现是同事传的，确认里会写明。
- 改成「个人」、或删除本机这场会，也会先撤远端。

同事各用各的本机库。「已到公司」只是这台电脑上的标记；知识库里是否已有，以上传时的查询为准。

## 词表与深度总结

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
                                      ├─ lib/ask.js   大模型 RAG 语义问答
                                      └─ /api/publish 按类型写入对应 RAGFlow 知识库
                                              │      同一场会按 meeting_id 覆盖；撤回则删除该篇
其他助手（可选）  ◀── HTTP / MCP ── 本机服务
```

## 常见问题

- **同步不到听记**：确认已 `dws auth login`、账号有听记权限；查看日志 `~/.dsh/meetings/backend.log`（Windows 另有 `backend.err.log`）
- **打不开界面**：双击「会议助手」，或浏览器访问 http://127.0.0.1:3400
- **API Key 未生效**：在设置页保存后刷新；改环境变量则需重启服务
- **上传提示填 dataset id**：到设置 → 公司知识库，把四个库的 id 分别填上。只填其中一个，另外三种类型仍不能传。
- **点上传说知识库里已有**：同事已经传过同一场听记。确认覆盖才会换成你这份；取消则不动。
- **首次同步较慢**：`dws` 全量扫描听记；之后增量很快。空库启动约 4 秒后会自动全量一次；也可到设置 → 听记点「全量同步」。列表「更新」只拉本机没有的，最多 300 场。
- **更新本仓库代码后**：Mac 执行 `bash scripts/restart.sh`；Windows 执行 `powershell -ExecutionPolicy Bypass -File scripts\restart.ps1`

## 开发

```bash
npm install
npm run build        # 构建 public/app.js
npm run server       # 仅启动后端（日常请用 scripts/start.sh）
```

## 完全本地模式（可选）

后端使用 OpenAI 兼容接口。在设置里把接口指到本地 Ollama（如 `http://127.0.0.1:11434/v1`），或设环境变量 `DEEPSEEK_BASE_URL` + `DEEPSEEK_MODEL`，会议内容即不出内网。

上传公司知识库仍会出网到 RAGFlow；不点上传则不会。
