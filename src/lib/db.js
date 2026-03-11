import mysql from 'mysql2/promise';

// Configuramos un "Pool" de conexiones (más eficiente para Next.js)
export const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'GabrielAlejandro10.', // Pon aquí la de tu Workbench
  database: 'whirlpoolKetzia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});