import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error; 

  try {
    // Consulta mejorada para obtener múltiples categorías por curso
    const [rows] = await pool.query(`
      SELECT 
        c.curso_id, 
        c.titulo, 
        c.imagenSrc, 
        c.fecha_creacion,
        u.nombre AS nombre_creador,
        c.descripcion,
        c.descripcionCorta,
        -- Obtenemos las categorías concatenadas por coma
        (
          SELECT GROUP_CONCAT(cat.nombre SEPARATOR ', ')
          FROM Curso_Categorias cc
          JOIN Categorias cat ON cc.categoria_id = cat.categoria_id
          WHERE cc.curso_id = c.curso_id
        ) AS categorias
      FROM Cursos c
      LEFT JOIN Usuarios u ON c.creado_por = u.usuario_id
      ORDER BY c.fecha_creacion DESC
    `);

    // Si un curso no tiene categorías, GROUP_CONCAT devuelve NULL. 
    // Podrías manejarlo aquí o dejarlo así para que el front use el fallback.
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error en API Admin Dashboard:", error);
    return NextResponse.json({ error: "Error al cargar el catálogo completo" }, { status: 500 });
  }
}