import fs from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const connection = await mysql.createConnection({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number.parseInt(process.env.DB_PORT ?? '3306', 10),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  multipleStatements: true,
});

try {
  const schemaSql = await fs.readFile(path.join(rootDir, 'db', 'schema.sql'), 'utf8');
  const seedSql = await fs.readFile(path.join(rootDir, 'db', 'seed.sql'), 'utf8');

  await connection.query(schemaSql);
  await connection.query(seedSql);

  console.log('Database schema and seed data initialized successfully.');
} finally {
  await connection.end();
}
