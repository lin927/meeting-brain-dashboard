// 会议类型：决定能否同步到公司、进 RAGFlow 哪一个数据集。
// 项目会议、部门会议各自一个库；不同项目/部门用标签等元数据区分。

export const MEETING_TYPES = ['个人', '公司管理', '公司运营', '项目', '部门'];

export const KB_DATASETS = [
  { key: 'mgmt', type: '公司管理', label: '公司管理会议', meta: 'kb_dataset_mgmt' },
  { key: 'ops', type: '公司运营', label: '公司运营会议', meta: 'kb_dataset_ops' },
  { key: 'project', type: '项目', label: '项目会议', meta: 'kb_dataset_project' },
  { key: 'dept', type: '部门', label: '部门会议', meta: 'kb_dataset_dept' },
];

export function normalizeType(raw) {
  const s = String(raw || '').trim();
  if (s === '公司') return '公司管理';
  if (MEETING_TYPES.includes(s)) return s;
  return '';
}

export function canPublishType(type) {
  const t = normalizeType(type);
  return t !== '' && t !== '个人';
}

export function datasetForType(type) {
  const t = normalizeType(type);
  return KB_DATASETS.find((d) => d.type === t) || null;
}

export function typeLabel(type) {
  const t = normalizeType(type);
  if (!t) return '未定类型';
  if (t === '个人') return '个人';
  return t;
}
