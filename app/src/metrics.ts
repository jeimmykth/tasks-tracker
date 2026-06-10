import { Task, TaskStatus, VALID_STATUSES } from './models/task';

export interface TaskMetrics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  completionRate: number;          // completed / (total - cancelled) as %
  avgCompletionTimeMs: number;     // average ms from created_at to completed_at
  avgCompletionTimeHuman: string;  // human-readable
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = startOfDay(d);
  r.setDate(r.getDate() - r.getDay()); // Sunday as first day
  return r;
}

function startOfMonth(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), 1);
  return r;
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (days > 0)    return `${days}d ${hours % 24}h`;
  if (hours > 0)   return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function computeMetrics(tasks: Task[], now: Date = new Date()): TaskMetrics {
  const byStatus = Object.fromEntries(VALID_STATUSES.map(s => [s, 0])) as Record<TaskStatus, number>;

  for (const t of tasks) {
    byStatus[t.status]++;
  }

  const completed = tasks.filter(t => t.status === 'completed' && t.completed_at !== null);
  const actionable = tasks.filter(t => t.status !== 'cancelled');
  const completionRate = actionable.length > 0
    ? Math.round((byStatus.completed / actionable.length) * 100)
    : 0;

  const totalCompletionMs = completed.reduce((sum, t) => {
    return sum + (t.completed_at!.getTime() - t.created_at.getTime());
  }, 0);
  const avgCompletionTimeMs = completed.length > 0 ? totalCompletionMs / completed.length : 0;

  const todayStart     = startOfDay(now);
  const weekStart      = startOfWeek(now);
  const monthStart     = startOfMonth(now);

  const completedToday     = completed.filter(t => t.completed_at! >= todayStart).length;
  const completedThisWeek  = completed.filter(t => t.completed_at! >= weekStart).length;
  const completedThisMonth = completed.filter(t => t.completed_at! >= monthStart).length;

  return {
    total: tasks.length,
    byStatus,
    completionRate,
    avgCompletionTimeMs,
    avgCompletionTimeHuman: formatDuration(avgCompletionTimeMs),
    completedToday,
    completedThisWeek,
    completedThisMonth,
  };
}
