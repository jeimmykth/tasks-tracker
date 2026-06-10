import { isValidStatus, validateTaskDates, VALID_STATUSES, TaskStatus } from '../src/models/task';

describe('isValidStatus', () => {
  test.each(VALID_STATUSES)('accepts valid status: %s', (s) => {
    expect(isValidStatus(s)).toBe(true);
  });

  test.each(['done', 'PENDING', 'active', '', 0, null, undefined])(
    'rejects invalid value: %s',
    (v) => { expect(isValidStatus(v)).toBe(false); }
  );
});

describe('validateTaskDates', () => {
  const base = new Date('2026-06-01T09:00:00Z');

  // ── completed status ──────────────────────────────────────
  test('completed with valid completed_at returns null', () => {
    expect(validateTaskDates({
      status: 'completed',
      created_at: base,
      completed_at: new Date('2026-06-01T10:00:00Z'),
    })).toBeNull();
  });

  test('completed with completed_at === created_at is valid (same instant)', () => {
    expect(validateTaskDates({
      status: 'completed',
      created_at: base,
      completed_at: base,
    })).toBeNull();
  });

  test('completed without completed_at returns error', () => {
    const err = validateTaskDates({ status: 'completed', created_at: base, completed_at: null });
    expect(err).toMatch(/required/);
  });

  test('completed with completed_at before created_at returns error', () => {
    const err = validateTaskDates({
      status: 'completed',
      created_at: base,
      completed_at: new Date('2026-05-31T09:00:00Z'),
    });
    expect(err).toMatch(/earlier/);
  });

  // ── non-completed statuses must not have completed_at ──────
  test.each(['pending', 'in_progress', 'cancelled'] as TaskStatus[])(
    '%s with completed_at returns error',
    (status) => {
      const err = validateTaskDates({ status, created_at: base, completed_at: new Date() });
      expect(err).toMatch(/null/);
    }
  );

  test.each(['pending', 'in_progress', 'cancelled'] as TaskStatus[])(
    '%s with null completed_at returns null',
    (status) => {
      expect(validateTaskDates({ status, created_at: base, completed_at: null })).toBeNull();
    }
  );
});
