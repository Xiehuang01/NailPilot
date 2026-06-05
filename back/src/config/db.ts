import mysql, { type Pool } from 'mysql2/promise';
import { env } from './env.js';

let pool: Pool | undefined;

export const getDb = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      namedPlaceholders: true,
      charset: 'utf8mb4',
    });
  }

  return pool;
};

export const closeDb = async () => {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
};
