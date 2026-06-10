import express from 'express';
import path from 'path';
import tasksRouter from './routes/tasks';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/tasks', tasksRouter);

// Serve SPA for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Tasks Tracker running on http://localhost:${PORT}`);
});

export default app;
