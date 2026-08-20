// 从钉钉 DWS 拉取听记并结构化落库。
// 数据流：dws minutes +search --scope all（全量列表） -> 逐条 +detail（摘要/关键词/待办/逐字稿） -> 落本地 SQLite。

import { execFileSync } from 'node:child_process';
import { open, upsertMeeting, clearActions, insertAction, clearChunks, insertChunk, getMeeting } from './db.js';

// 剥离 UTF-8 BOM（Windows 管道/控制台常带 \uFEFF，会让 JSON.parse 失败）
function stripBom(s) {
  if (typeof s !== 'string') return s;
  return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}

function runDws(args, opts = {}) {
  try {
    // Windows 上 dws 是 dws.cmd，execFileSync 不解析 .cmd（ENOENT），
    // 需 shell:true 或改用 execSync；shell 会让参数走一次转义，
    // 所有参数均为内部固定值（无用户输入），安全。
    const out = execFileSync('dws', args, {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(stripBom(out));
  } catch (e) {
    if (opts.soft) {
      // 尝试从 stderr/stdout 提取部分 JSON（剥离 BOM 后解析）
      const txt = stripBom(e.stdout || '');
      const jsonMatch = txt.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[0]); } catch {}
      }
      return null;
    }
    throw e;
  }
}

// 解析 summary markdown 中的参与人
export function parseAttendees(summary) {
  if (!summary) return null;
  const m = summary.match(/参与人\*\*:\s*([^\n]+)/);
  if (!m) return null;
  return m[1].trim();
}

export function normalizeMinutes(listJson) {
  const minutes = listJson.minutes ?? listJson.items ?? listJson.list ?? [];
  return minutes.map((m) => ({
    task_uuid: m.taskUuid ?? m.task_uuid ?? m.id,
    title: m.title,
    start_time: m.startTime,
    end_time: m.endTime,
    url: m.url,
  })).filter((m) => m.task_uuid);
}

export function pull({ dbPath, maxUuid = 300, skipTranscript = false, only = null, skipExisting = true, quiet = false } = {}) {
  const db = open(dbPath);
  const log = quiet ? () => {} : (msg) => console.log(msg);
  // 1. 用 +search 全量拉取所有可访问的听记（+list-all 只返回去重后的子集）
  const listJson = runDws(['minutes', '+search', '--scope', 'all',
    '--start', '2025-01-01T00:00:00+08:00', '--limit', '100', '--page-all', '--format', 'json'],
    { soft: true });
  const all = normalizeMinutes(listJson ?? {});
  log(`[pull] 发现 ${all.length} 条听记（+search 全量）`);

  // 跳过已在库中的（增量同步）
  const targets0 = only
    ? all.filter((m) => only.includes(m.task_uuid))
    : all.slice(0, maxUuid);
  const targets = skipExisting
    ? targets0.filter((m) => getMeeting(db, m.task_uuid) === undefined)
    : targets0;
  if (skipExisting && targets.length < targets0.length) {
    log(`[pull] 跳过 ${targets0.length - targets.length} 条已在库中的，待同步 ${targets.length} 条`);
  }

  for (const meta of targets) {
    // 每个产物单独调用，失败互不影响
    const fetchOne = (artifacts, extra = []) => {
      try {
        return runDws(['minutes', '+detail', '--id', meta.task_uuid,
          '--format', 'json', '--artifacts', artifacts, ...extra]) ?? {};
      } catch (e) {
        console.error(`  (${artifacts}跳过) ${e.message.slice(0, 70)}`);
        return {};
      }
    };

    // 基础产物
    const detail = fetchOne('basic,summary,keywords');
    const basic = detail.basic?.result ?? {};
    const summaryObj = detail.summary?.result ?? {};
    const summary = typeof summaryObj.fullSummary === 'string' ? summaryObj.fullSummary
      : (summaryObj.summary ?? null);
    const keywords = detail.keywords?.result?.keywords ?? null;

    try {
      upsertMeeting(db, {
        task_uuid: meta.task_uuid,
        title: basic.title ?? meta.title ?? '未命名会议',
        start_time: basic.startTime ?? meta.start_time,
        end_time: basic.endTime ?? meta.end_time,
        duration_ms: basic.duration,
        url: basic.url ?? meta.url,
        source: 'mine',
        summary,
        keywords_json: keywords ? JSON.stringify(keywords) : null,
        attendees: parseAttendees(summary),
      });
    } catch (e) {
      console.error(`  ✗ 会议信息落库失败 ${meta.task_uuid}: ${e.message}`);
      continue;
    }

    // 待办
    let actionTitles = new Set();
    const todosRes = fetchOne('todos');
    const todos = todosRes.todos?.result?.actions ?? todosRes.todos?.result?.dingtalkTodoList ?? [];
    clearActions(db, meta.task_uuid);
    for (const t of todos) {
      let title = null, minutesTodoId = null;
      if (typeof t === 'string') {
        try { const parsed = JSON.parse(t); title = parsed.value ?? parsed.title; }
        catch { title = t; }
      } else {
        title = t.title ?? t.value;
        minutesTodoId = t.minutesTodoId ?? null;
      }
      if (!title || actionTitles.has(title)) continue;
      actionTitles.add(title);
      insertAction(db, {
        task_uuid: meta.task_uuid,
        title,
        minutes_todo_id: minutesTodoId,
        status: 'open',
      });
    }

    // 逐字稿
    let nChunks = 0;
    if (!skipTranscript) {
      clearChunks(db, meta.task_uuid);
      const txRes = fetchOne('transcript', ['--single-page']);
      const plist = txRes.transcript?.paragraphList ?? [];
      for (const p of plist) {
        const speaker = p.nickName ?? p.speakerDisplay?.nickName ?? '未知发言人';
        const text = p.paragraph;
        if (!text) continue;
        insertChunk(db, {
          task_uuid: meta.task_uuid,
          kind: 'transcript',
          chunk_text: `【${speaker}】${text}`,
        });
      }
      nChunks = plist.length;
      if (summary) {
        insertChunk(db, { task_uuid: meta.task_uuid, kind: 'summary', chunk_text: summary });
      }
    }

    log(`  ✓ ${meta.title} (${meta.task_uuid.slice(0, 8)}…) 待办${actionTitles.size} 段落${nChunks}`);
  }
  db.close();
  return targets.length;
}
