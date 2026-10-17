// 会议类型：决定能否同步到公司、进哪一个知识库。
// 知识库元数据用 category（业务域）× doc_kind（资料形态）；本机「类型」只在上传时映射。
// 部门会进 department-management，不进 company-general。

export const MEETING_TYPES = ['个人', '公司管理', '公司运营', '项目', '部门'];

export const KB_TARGETS = [
  { key: 'mgmt', type: '公司管理', label: '公司管理', knowledgeBaseCode: 'company-management' },
  { key: 'ops', type: '公司运营', label: '公司运营', knowledgeBaseCode: 'company-operations' },
  { key: 'project', type: '项目', label: '项目', knowledgeBaseCode: 'project' },
  { key: 'dept', type: '部门', label: '部门管理', knowledgeBaseCode: 'department-management' },
];

/** @deprecated 旧设置页四个 RAGFlow dataset；上传已改走知识库代码。 */
export const KB_DATASETS = KB_TARGETS.map((d) => ({
  key: d.key,
  type: d.type,
  label: d.label,
  meta: 'kb_dataset_' + d.key,
}));

/** 本机会议类型 → 知识库一级类别。个人会不上传，没有映射。 */
export const CATEGORY_BY_MEETING_TYPE = {
  公司管理: { category: 'company_mgmt', category_label: '公司管理' },
  公司运营: { category: 'company_ops', category_label: '公司运营' },
  项目: { category: 'project', category_label: '项目' },
  部门: { category: 'department_mgmt', category_label: '部门管理' },
};

export const CATEGORY_LABELS = {
  company_mgmt: '公司管理',
  company_ops: '公司运营',
  project: '项目',
  department_mgmt: '部门管理',
  dept_mgmt: '部门管理',
  marketing: '市场营销',
  research: '技术研究',
  policy: '公司制度',
  project_case: '项目案例',
};

export const DOC_KIND_MEETING = { doc_kind: 'meeting', doc_kind_label: '会议' };

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

export function knowledgeTargetForType(type) {
  const t = normalizeType(type);
  return KB_TARGETS.find((d) => d.type === t) || null;
}

export function datasetForType(type) {
  return knowledgeTargetForType(type);
}

export function typeLabel(type) {
  const t = normalizeType(type);
  if (!t) return '未定类型';
  if (t === '个人') return '个人';
  return t;
}

export function categoryForMeetingType(type) {
  return CATEGORY_BY_MEETING_TYPE[normalizeType(type)] || null;
}

/** 已有元数据优先用 category；没有则从 meeting_type / 旧 type 反推。 */
export function categoryFromMeta(meta) {
  let code = String((meta && meta.category) || '').trim();
  if (code === 'dept_mgmt') code = 'department_mgmt';
  if (code && CATEGORY_LABELS[code]) {
    return {
      category: code,
      category_label: String((meta && meta.category_label) || '').trim() || CATEGORY_LABELS[code],
    };
  }
  return categoryForMeetingType((meta && (meta.meeting_type || meta.type)) || '');
}
