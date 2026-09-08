import mariadb from 'mariadb';

export const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ebadidon',
  database: process.env.DB_NAME || 'ebadidon',
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: 5,
});
