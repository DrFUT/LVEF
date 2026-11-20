export const STATUSES = Object.freeze(['PASS', 'PARTIAL', 'FAIL', 'BLOCKED', 'NOT_TESTED']);

const RANK = Object.freeze({ NOT_TESTED: 0, PASS: 1, PARTIAL: 2, BLOCKED: 3, FAIL: 4 });

export function assertStatus(value) {
  if (!STATUSES.includes(value)) throw new Error(`unknown status: ${value}`);
  return value;
}

export function aggregateStatus(statuses) {
  const values = statuses.filter(Boolean).map(assertStatus);
  if (values.length === 0) return 'NOT_TESTED';
  return values.reduce((best, current) => RANK[current] > RANK[best] ? current : best, 'NOT_TESTED');
}

export function exitCodeForStatus(status) {
  assertStatus(status);
  return status === 'PASS' || status === 'PARTIAL' ? 0 : 1;
}
