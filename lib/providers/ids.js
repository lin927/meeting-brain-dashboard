export const PROVIDER_META = {
  dingtalk: { id: 'dingtalk', label: '钉钉', prefix: '', writeback: true, origin: '钉钉听记' },
  feishu: { id: 'feishu', label: '飞书', prefix: 'fs:', writeback: true, origin: '飞书妙记' },
  tencent: { id: 'tencent', label: '腾讯会议', prefix: 'tm:', writeback: false, origin: '腾讯纪要' },
  import: { id: 'import', label: '导入', prefix: 'import-', writeback: false, origin: '手工' },
};

export function providerMeta(id) {
  return PROVIDER_META[id] || PROVIDER_META.dingtalk;
}

export function localId(provider, remoteId) {
  const id = String(remoteId || '').trim();
  if (!id) return '';
  if (provider === 'dingtalk' || provider === 'import') return id;
  if (provider === 'feishu') return id.startsWith('fs:') ? id : ('fs:' + id);
  if (provider === 'tencent') {
    if (id.startsWith('tm:')) return id;
    return 'tm:rf:' + id;
  }
  return id;
}

export function tencentYuanbaoId(minuteId) {
  const id = String(minuteId || '').trim();
  if (!id) return '';
  return id.startsWith('tm:m:') ? id : ('tm:m:' + id);
}

export function remoteIdOf(meeting) {
  if (meeting && meeting.remote_id) return String(meeting.remote_id);
  const id = String((meeting && (meeting.task_uuid || meeting.taskUuid)) || '');
  if (id.startsWith('fs:')) return id.slice(3);
  if (id.startsWith('tm:rf:')) return id.slice(6);
  if (id.startsWith('tm:m:')) return id.slice(5);
  if (id.startsWith('tm:')) return id.slice(3);
  return id;
}

export function inferProvider(meeting) {
  if (meeting && meeting.provider) return meeting.provider;
  const id = String((meeting && (meeting.task_uuid || meeting.taskUuid)) || '');
  const source = meeting && meeting.source;
  if (source === 'import' || id.startsWith('import-')) return 'import';
  if (id.startsWith('fs:')) return 'feishu';
  if (id.startsWith('tm:')) return 'tencent';
  return 'dingtalk';
}

export function canRefresh(meeting) {
  const p = inferProvider(meeting);
  return p === 'dingtalk' || p === 'feishu' || p === 'tencent';
}

export function canWriteback(meeting) {
  return providerMeta(inferProvider(meeting)).writeback;
}

export function parseRemoteJson(meeting) {
  const raw = meeting && meeting.remote_json;
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}
