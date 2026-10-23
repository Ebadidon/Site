import mariadb from 'mariadb';

export const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'ebadidon',
  database: 'ebadidon',
  port: 3306,
  connectionLimit: 5,
});
