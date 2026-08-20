#!/usr/bin/env node
// 会议智能中枢 CLI：pull（拉取落库）/ index（向量化）/ ask（语义问答）/

import { pull } from './pull.js';
import { indexChunks } from './embed.js';
import { ask, summarizeTranscript } from './ask.js';
import { overview, projectTodos, meetingDetail, allMeetings, backfillSummaries, todoTracking, todosByRange } from './overview.js';
import { open, listMeetings, listActions } from './db.js';

function args() {
  const [cmd, ...rest] = process.argv.slice(2);
  const kv = {};
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) {
      const k = rest[i].slice(2);
      const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
      kv[k] = v;
    }
  }
  return { cmd, kv };
}

async function main() {
  const { cmd, kv } = args();
  switch (cmd) {
    case 'pull':
      pull({
        maxUuid: kv.max ? Number(kv.max) : 300,
        skipTranscript: !!kv['skip-transcript'],
        skipExisting: kv['skip-existing'] !== 'false',
        quiet: !!kv.q || !!kv.quiet,
      });
      break;
    case 'index':
      await indexChunks({});
      break;
    case 'ask': {
      const query = kv.q || kv.query || kv._ || restText();
      if (!query) { console.error('用法: node lib/cli.js ask --q "你的问题"'); process.exit(1); }
      const res = await ask({ query });
      if (kv.json || kv.raw) {
        process.stdout.write(JSON.stringify({ answer: res.answer, hits: res.hits || [] }));
      } else {
        console.log('\n========== 回答 ==========\n');
        console.log(res.answer);
        console.log('\n========== 命中来源 ==========\n');
        (res.hits || []).forEach((h, i) => console.log(`${i + 1}. [${h.kind} 会议${h.title || h.task_uuid.slice(0, 8)}… 相似度${h.similarity.toFixed(3)}]`));
      }
      break;
    }
    case 'summarize': {
      const id = kv.id || kv.uuid || kv._ || restText();
      if (!id) { console.error('用法: node lib/cli.js summarize --id <taskUuid>'); process.exit(1); }
      const res = await summarizeTranscript({ taskUuid: id.trim() });
      if (kv.json || kv.raw) process.stdout.write(JSON.stringify(res));
      else if (res.error) console.error(res.error);
      else {
        console.log(`\n=== 基于逐字稿的总结：${res.meeting} ===`);
        console.log(`（逐字稿 ${res.paras} 段，清洗后 ${res.meaningful} 段）\n`);
        console.log(res.summary);
      }
      break;
    }
    case 'stats': {
      const db = open();
      const meetings = listMeetings(db);
      const actions = listActions(db);
      const openA = actions.filter((a) => a.status === 'open');
      console.log(`会议: ${meetings.length} 条 | 待办: ${actions.length} 项（未完成 ${openA.length}）`);
      db.close();
      break;
    }
    case 'overview': {
      const data = overview();
      if (kv.json || kv.raw) {
        process.stdout.write(JSON.stringify(data));
      } else {
        console.log(`本周（${data.week.label}）会议 ${data.thisWeek.length} 场 | 累计会议 ${data.stats.meetings} | 待办 ${data.stats.actions}（未完成 ${data.stats.openActions}）`);
        for (const g of data.thisWeek) {
          console.log(`  ${new Date(g.time).toLocaleString('zh-CN')} | ${g.title} | 待办 ${g.actions.length}`);
          for (const a of g.actions) console.log(`    - ${a.title} (${a.status})`);
        }
      }
      break;
    }
    case 'todos': {
      const data = todoTracking();
      if (kv.json || kv.raw) process.stdout.write(JSON.stringify(data));
      else {
        console.log(`待办总数 ${data.total} | open ${data.open} | 疑似逾期 ${data.overdue} | 重复组 ${data.duplicates.length}`);
        console.log(`\n== 重复项识别 (${data.duplicates.length} 组) ==`);
        data.duplicates.forEach((g, i) => { console.log(`组${i + 1}:`); g.forEach(t => console.log(`   - ${t.title} [${t.meetingTitle}]`)); });
        console.log(`\n== 疑似逾期 ${data.overdue} 项（会议距今超 7 天仍未完成） ==`);
      }
      break;
    }
    case 'todos-range': {
      const r = kv.r || kv.range || 'today';
      const data = todosByRange(r);
      if (kv.json || kv.raw) process.stdout.write(JSON.stringify(data));
      else {
        console.log(`${data.label}（${new Date(data.start).toLocaleDateString('zh-CN')} ~ ${new Date(data.end - 1).toLocaleDateString('zh-CN')}）会议 ${data.meetings.length} 场，待办 ${data.count} 项：`);
        for (const m of data.meetings) {
          console.log(`  ${new Date(m.time).toLocaleString('zh-CN')} | ${m.title}`);
          m.actions.forEach(a => console.log(`    - ${a.title} (${a.status})`));
        }
      }
      break;
    }
    case 'backfill': {
      const n = backfillSummaries();
      console.log(`补插 ${n} 条会议摘要块，请运行 index 向量化`);
      break;
    }
    case 'detail': {
      const id = kv.id || kv.uuid || kv._ || restText();
      if (!id) { console.error('用法: node lib/cli.js detail --id <taskUuid>'); process.exit(1); }
      const d = meetingDetail(id.trim());
      if (!d) { console.error('未找到会议: ' + id); process.exit(1); }
      if (kv.json || kv.raw) {
        process.stdout.write(JSON.stringify(d));
      } else {
        console.log(`# ${d.title}`);
        if (d.startTime) console.log(`时间: ${new Date(d.startTime).toLocaleString('zh-CN')}`);
        if (d.attendees) console.log(`参会人: ${d.attendees}`);
        if (d.keywords?.length) console.log(`关键词: ${d.keywords.join(', ')}`);
        if (d.actions?.length) { console.log(`\n待办 (${d.actions.length}):`); d.actions.forEach(a => console.log(`  - ${a.title} (${a.status})`)); }
        if (d.summary) { console.log(`\n摘要:\n${d.summary}`); }
        if (d.transcript?.length) { console.log(`\n逐字稿段落 (${d.transcript.length}):`); d.transcript.slice(0, 20).forEach(p => console.log(`  ${p}`)); }
      }
      break;
    }
    case 'meetings': {
      const data = allMeetings();
      if (kv.json || kv.raw) process.stdout.write(JSON.stringify(data));
      else { console.log(`全部会议 ${data.length} 场:`); data.forEach(m => console.log(`  ${new Date(m.time).toLocaleDateString('zh-CN')} | ${m.title} | 待办${m.actionCount}`)); }
      break;
    }
    case 'project': {
      const kw = kv.k || kv.keyword || kv._ || restText();
      if (!kw) { console.error('用法: node lib/cli.js project --k "XX项目"'); process.exit(1); }
      const data = projectTodos(kw);
      if (kv.json || kv.raw) {
        process.stdout.write(JSON.stringify(data));
      } else {
        console.log(`项目「${data.keyword}」相关会议 ${data.meetings.length} 场：`);
        for (const m of data.meetings) {
          console.log(`  ${new Date(m.time).toLocaleDateString('zh-CN')} | ${m.title} | 待办 ${m.actions.length}`);
          for (const a of m.actions) console.log(`    - ${a.title} (${a.status})`);
        }
      }
      break;
    }
    default:
      console.log('用法: node lib/cli.js <pull|index|ask|overview|project|meetings|detail|todos|todos-range|stats>');
  }
}

function restText() {
  const [,, ...rest] = process.argv.slice(2);
  return rest.join(' ');
}

main().catch((e) => { console.error(e); process.exit(1); });
