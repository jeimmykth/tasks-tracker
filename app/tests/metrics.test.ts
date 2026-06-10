import { computeMetrics, formatDuration } from '../src/metrics';
import { Task } from '../src/models/task';

function makeTask(overrides: Partial<Task>): Task {
  const base = new Date('2026-06-01T09:00:00Z');
  return {
    id:           1,
    title:        'Test task',
    description:  null,
    status:       'pending',
    created_at:   base,
    updated_at:   base,
    completed_at: null,
    ...overrides,
  };
}

const NOW = new Date('2026-06-09T12:00:00Z'); // fixed "now" for deterministic tests

describe('formatDuration', () => {
  test('0 ms', () => expect(formatDuration(0)).toBe('0s'));
  test('30 seconds', () => expect(formatDuration(30_000)).toBe('30s'));
  test('90 seconds', () => expect(formatDuration(90_000)).toBe('1m 30s'));
  test('3661 seconds', () => expect(formatDuration(3_661_000)).toBe('1h 1m'));
  test('2 days', () => expect(formatDuration(2 * 24 * 3600_000)).toBe('2d 0h'));
});

describe('computeMetrics — empty list', () => {
  const m = computeMetrics([], NOW);

  test('total is 0',            () => expect(m.total).toBe(0));
  test('completionRate is 0',   () => expect(m.completionRate).toBe(0));
  test('avgCompletionTimeMs is 0', () => expect(m.avgCompletionTimeMs).toBe(0));
  test('completedToday is 0',   () => expect(m.completedToday).toBe(0));
});

describe('computeMetrics — mixed tasks', () => {
  const tasks: Task[] = [
    makeTask({ id: 1, status: 'pending' }),
    makeTask({ id: 2, status: 'in_progress' }),
    makeTask({ id: 3, status: 'cancelled' }),
    makeTask({
      id: 4, status: 'completed',
      created_at:   new Date('2026-06-09T08:00:00Z'),
      completed_at: new Date('2026-06-09T10:00:00Z'), // 2h — today
    }),
    makeTask({
      id: 5, status: 'completed',
      created_at:   new Date('2026-06-04T08:00:00Z'), // this week
      completed_at: new Date('2026-06-05T08:00:00Z'), // 24h
    }),
    makeTask({
      id: 6, status: 'completed',
      created_at:   new Date('2026-06-01T00:00:00Z'),
      completed_at: new Date('2026-06-01T06:00:00Z'), // 6h — this month
    }),
  ];

  const m = computeMetrics(tasks, NOW);

  test('total = 6', () => expect(m.total).toBe(6));
  test('byStatus.pending = 1',     () => expect(m.byStatus.pending).toBe(1));
  test('byStatus.in_progress = 1', () => expect(m.byStatus.in_progress).toBe(1));
  test('byStatus.completed = 3',   () => expect(m.byStatus.completed).toBe(3));
  test('byStatus.cancelled = 1',   () => expect(m.byStatus.cancelled).toBe(1));

  // actionable = 5 (all except cancelled), completed = 3 → 60%
  test('completionRate = 60', () => expect(m.completionRate).toBe(60));

  // avg = (2h + 24h + 6h) / 3 = 10.67h
  const expectedAvgMs = ((2 + 24 + 6) * 3600_000) / 3;
  test('avgCompletionTimeMs correct', () => expect(m.avgCompletionTimeMs).toBeCloseTo(expectedAvgMs, -3));

  // NOW = 2026-06-09, today starts at 2026-06-09T00:00 — task 4 completed today
  test('completedToday = 1',     () => expect(m.completedToday).toBe(1));
  // week starts Sun 2026-06-07 — only task 4 falls on or after that
  test('completedThisWeek = 1',  () => expect(m.completedThisWeek).toBe(1));
  // month = June — tasks 4, 5, 6 all in June
  test('completedThisMonth = 3', () => expect(m.completedThisMonth).toBe(3));
});

describe('computeMetrics — all cancelled', () => {
  const tasks = [
    makeTask({ id: 1, status: 'cancelled' }),
    makeTask({ id: 2, status: 'cancelled' }),
  ];
  const m = computeMetrics(tasks, NOW);

  test('completionRate = 0 when all cancelled', () => expect(m.completionRate).toBe(0));
});
