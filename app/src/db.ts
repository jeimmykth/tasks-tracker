import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     Number(process.env.DB_PORT ?? 3306),
  database: process.env.DB_NAME     ?? 'tasks_db',
  user:     process.env.DB_USER     ?? 'tasks_user',
  password: process.env.DB_PASSWORD ?? 'tasks_password',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
});

export default pool;
