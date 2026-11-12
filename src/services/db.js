import mariadb from 'mariadb';

export const pool = mariadb.createPool({
  host: 'hn297.myd.infomaniak.com',
  user: 'hn297_admin',
  password: '!6202NoDiDaBe',
  database: 'hn297_theatre',
  port: 3306,
  connectionLimit: 5,
});
