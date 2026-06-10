import { Router, Request, Response } from 'express';
import pool from '../db';
import { Task, CreateTaskDTO, UpdateTaskDTO, isValidStatus, validateTaskDates } from '../models/task';
import { computeMetrics } from '../metrics';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

function rowToTask(row: RowDataPacket): Task {
  return {
    id:           row.id,
    title:        row.title,
    description:  row.description,
    status:       row.status,
    created_at:   new Date(row.created_at),
    updated_at:   new Date(row.updated_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  };
}

// GET /api/tasks
router.get('/', async (_req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM tasks ORDER BY created_at DESC');
  res.json((rows).map(rowToTask));
});

// GET /api/tasks/metrics
router.get('/metrics', async (_req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM tasks');
  const tasks = (rows).map(rowToTask);
  res.json(computeMetrics(tasks));
});

// GET /api/tasks/:id
router.get('/:id', async (req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(rowToTask(rows[0]));
});

// POST /api/tasks
router.post('/', async (req: Request, res: Response) => {
  const { title, description }: CreateTaskDTO = req.body;
  if (!title || title.trim() === '') {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO tasks (title, description) VALUES (?, ?)',
    [title.trim(), description ?? null]
  );
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
  res.status(201).json(rowToTask(rows[0]));
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const current = rowToTask(rows[0]);
  const body: UpdateTaskDTO = req.body;

  if (body.status !== undefined && !isValidStatus(body.status)) {
    res.status(400).json({ error: `Invalid status. Valid values: pending, in_progress, completed, cancelled` });
    return;
  }

  const newStatus = body.status ?? current.status;
  const completedAt = newStatus === 'completed' ? (current.completed_at ?? new Date()) : null;

  const dateError = validateTaskDates({
    status:       newStatus,
    created_at:   current.created_at,
    completed_at: completedAt,
  });
  if (dateError) {
    res.status(400).json({ error: dateError });
    return;
  }

  await pool.query(
    `UPDATE tasks SET
       title        = ?,
       description  = ?,
       status       = ?,
       completed_at = ?
     WHERE id = ?`,
    [
      body.title?.trim()       ?? current.title,
      body.description         ?? current.description,
      newStatus,
      completedAt,
      current.id,
    ]
  );

  const [updated] = await pool.query<RowDataPacket[]>('SELECT * FROM tasks WHERE id = ?', [current.id]);
  res.json(rowToTask(updated[0]));
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const [result] = await pool.query<ResultSetHeader>('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.status(204).send();
});

export default router;
