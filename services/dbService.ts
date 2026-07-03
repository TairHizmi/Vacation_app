import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'vacation_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const query = async <T = any>(sql: string, params: Array<string | number | boolean | null> = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
};

export default {
  pool,
  query,
};
