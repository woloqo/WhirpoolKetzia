import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 4000, // Asegura que sea un número
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // CONFIGURACIÓN OBLIGATORIA PARA TIDB CLOUD
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});