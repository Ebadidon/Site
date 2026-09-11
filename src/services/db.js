import mariadb from 'mariadb';

export const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'hn297.myd.infomaniak.com',
  user: process.env.DB_USER || 'hn297_admin',
  password: process.env.DB_PASSWORD || '!6202NoDiDaBe',
  database: process.env.DB_NAME || 'hn297_theatre',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 5,
});
