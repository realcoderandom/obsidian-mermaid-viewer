export const ROLES = {
  entry: { label: '重点节点', color: 'ink' },
  service: { label: '处理步骤', color: 'tint' },
  cache: { label: '数据存储', color: 'tint' },
  upstream: { label: '外部系统', color: 'paper' },
  neutral: { label: '分支 / 辅助节点', color: 'warm' },
  error: { label: '异常结果', color: 'clay' },
} as const;

export type Role = keyof typeof ROLES;
export const SEMANTIC_ROLES: Record<string, Role> = {
  focus: 'entry',
  step: 'service',
  store: 'cache',
  ext: 'upstream',
  branch: 'neutral',
  err: 'error',
};
