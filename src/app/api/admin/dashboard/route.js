import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Consulta para el Admin: Ver todo el catálogo de Whirlpool
    const [rows] = await pool.query(`
      SELECT 
        c.curso_id, 
        c.titulo, 
        c.imagenSrc, 
        c.fecha_creacion,
        u.nombre AS nombre_creador
      FROM Cursos c
      LEFT JOIN Usuarios u ON c.creado_por = u.usuario_id
      ORDER BY c.fecha_creacion DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error en API Admin Dashboard:", error);
    return NextResponse.json({ error: "Error al cargar el catálogo completo" }, { status: 500 });
  }
}