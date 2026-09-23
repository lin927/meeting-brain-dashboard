import { spawn } from 'node:child_process';
import { execOpts, spawnVisible } from '../cli-bin.js';
import { execDws, dwsOutputText } from '../dws-exec.js';
import { pull as pullDingTalk, refreshMeeting as refreshDingTalk } from '../pull.js';
import { updateDingTalkTitle, updateDingTalkSummary } from '../minutes-write.js';
import { inferProvider, canRefresh, canWriteback, providerMeta, PROVIDER_META } from './ids.js';
import * as feishu from './feishu.js';
import * as tencent from './tencent.js';

export { inferProvider, canRefresh, canWriteback, providerMeta, PROVIDER_META };

export const SOURCE_ORDER = ['dingtalk', 'feishu', 'tencent'];

export function sourceCards() {
  return SOURCE_ORDER.map((id) => ({
    id,
    label: PROVIDER_META[id].label,
    writeback: PROVIDER_META[id].writeback,
  }));
}

async function dingtalkAuth() {
  try {
    const r = await execDws(['auth', 'status'], { timeout: 20000 });
    const text = dwsOutputText(r);
    const authenticated = /"authenticated"\s*:\s*true/.test(text);
    const user = (text.match(/"user_name"\s*:\s*"([^"]*)"/) || [])[1] || null;
    return { authenticated, user, loginCmd: 'dws auth login' };
  } catch (e) {
    const msg = String((e && e.message) || e).replace(/\s+/g, ' ').slice(0, 120);
    return { authenticated: false, user: null, error: msg, loginCmd: 'dws auth login' };
  }
}

export async function authStatus(id) {
  if (id === 'feishu') return feishu.authStatus();
  if (id === 'tencent') return tencent.authStatus();
  return dingtalkAuth();
}

export async function authAll() {
  const out = {};
  for (const id of SOURCE_ORDER) {
    out[id] = await authStatus(id);
  }
  return out;
}

export async function pullProvider(id, opts = {}) {
  if (id === 'feishu') return feishu.pull(opts);
  if (id === 'tencent') return tencent.pull(opts);
  return pullDingTalk(opts);
}

export async function refreshByMeeting(meeting) {
  const p = inferProvider(meeting);
  if (p === 'import') throw new Error('导入场次没有对应的听记');
  if (p === 'feishu') return feishu.refresh(meeting);
  if (p === 'tencent') return tencent.refresh(meeting);
  return refreshDingTalk({ taskUuid: meeting.task_uuid });
}

function skippedLocal(kind, reason) {
  return { ok: true, status: 'skipped_local', message: '本机已保存，' + reason };
}

export async function writeTitle(meeting, title) {
  const p = inferProvider(meeting);
  if (p === 'import') return skippedLocal('标题', '导入场次没有对应听记');
  if (p === 'tencent') return skippedLocal('标题', '腾讯会议不支持写回标题');
  if (p === 'feishu') {
    try {
      await feishu.writeTitle(meeting, title);
      return { ok: true, status: 'updated', message: '本机已保存，飞书妙记标题已改' };
    } catch (e) {
      return { ok: false, status: 'error', message: '本机已保存，飞书标题未改：' + String(e.message || e).slice(0, 80) };
    }
  }
  return updateDingTalkTitle({ taskUuid: meeting.task_uuid, title, source: meeting.source });
}

export async function writeSummary(meeting, content) {
  const p = inferProvider(meeting);
  if (p === 'import') return skippedLocal('纪要', '导入场次没有对应听记');
  if (p === 'tencent') return skippedLocal('纪要', '腾讯会议不支持写回纪要');
  if (p === 'feishu') {
    try {
      await feishu.writeSummary(meeting, content);
      return { ok: true, status: 'updated', message: '本机已保存，飞书妙记总结已改' };
    } catch (e) {
      return { ok: false, status: 'error', message: '本机已保存，飞书总结未改：' + String(e.message || e).slice(0, 80) };
    }
  }
  return updateDingTalkSummary({ taskUuid: meeting.task_uuid, content, source: meeting.source });
}

const LOGIN_ARGS = {
  dingtalk: ['dws', ['auth', 'login']],
  feishu: ['lark-cli', ['auth', 'login', '--domain', 'minutes']],
  tencent: ['tmeet', ['auth', 'login']],
};

export function loginHint(id, auth) {
  if (auth && auth.loginCmd) return auth.loginCmd;
  const spec = LOGIN_ARGS[id];
  return spec ? [spec[0], ...spec[1]].join(' ') : '';
}

export function spawnLogin(id, auth = {}) {
  if (id === 'feishu') {
    const pathPrefix = 'export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"; ';
    const done = "echo; echo '完成后可关闭本窗口'";
    const cmd = auth.configured
      ? pathPrefix + 'lark-cli auth login --domain minutes; ' + done
      : pathPrefix + 'lark-cli config init --new --brand feishu --lang zh && lark-cli auth login --domain minutes; ' + done;
    const r = spawnVisible(process.platform === 'win32'
      ? (auth.configured
        ? 'lark-cli auth login --domain minutes & echo. & echo 完成后可关闭本窗口'
        : 'lark-cli config init --new --brand feishu --lang zh && lark-cli auth login --domain minutes & echo. & echo 完成后可关闭本窗口')
      : cmd);
    return {
      ...r,
      message: auth.configured
        ? '已打开终端，请在浏览器完成飞书妙记授权'
        : '已打开终端：先在浏览器创建并绑定飞书应用，再授权妙记',
    };
  }
  const spec = LOGIN_ARGS[id];
  if (!spec) throw new Error('未知来源');
  const env = execOpts().env;
  const bin = process.platform === 'win32' ? (spec[0] + '.cmd') : spec[0];
  const child = spawn(bin, spec[1], { detached: true, stdio: 'ignore', env });
  child.unref();
  return { spawned: true, command: [spec[0], ...spec[1]].join(' ') };
}
