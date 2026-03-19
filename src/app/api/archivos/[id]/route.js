import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params; 

  try {
    // CORRECCIÓN: Ahora unimos Archivos_Curso con Archivos (datos físicos) 
    // y con Cursos (para el título del curso)
    const [rows] = await pool.query(`
      SELECT 
        a.archivo_id,
        a.nombre_archivo,
        a.url_archivo,
        a.tipo_archivo,
        ac.orden,
        ac.curso_id,
        c.titulo as curso_titulo
      FROM Archivos_Curso ac
      JOIN Archivos a ON ac.archivo_id = a.archivo_id
      JOIN Cursos c ON ac.curso_id = c.curso_id
      WHERE a.archivo_id = ?
      LIMIT 1
    `, [id]);

    if (rows && rows.length > 0) {
      // No hace falta el JSON.parse(JSON.stringify()) con mysql2, 
      // pero lo mantenemos si prefieres asegurar la limpieza de objetos
      return NextResponse.json(rows[0]);
    }

    return NextResponse.json({ error: 'Archivo no encontrado en la biblioteca' }, { status: 404 });

  } catch (error) {
    console.error("Error en API Archivos detalle:", error.message);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}