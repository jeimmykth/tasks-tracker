export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export const VALID_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export function isValidStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (VALID_STATUSES as string[]).includes(value);
}

/** Business rule: completed_at must be set iff status is 'completed', and must be >= created_at */
export function validateTaskDates(task: Pick<Task, 'status' | 'created_at' | 'completed_at'>): string | null {
  if (task.status === 'completed') {
    if (!task.completed_at) {
      return 'completed_at is required when status is completed';
    }
    if (task.completed_at < task.created_at) {
      return 'completed_at cannot be earlier than created_at';
    }
  } else {
    if (task.completed_at !== null) {
      return `completed_at must be null when status is "${task.status}"`;
    }
  }
  return null;
}
