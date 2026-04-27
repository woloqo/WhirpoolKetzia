import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { notificarRecordatorio } from '@/lib/email';

export async function POST(request) {
  try {
    // Buscar alumnos con cursos sin avance en los últimos 7 días
    const [alumnos] = await pool.query(`
      SELECT DISTINCT
        u.usuario_id, u.nombre, u.email,
        c.curso_id, c.titulo,
        COALESCE(progreso.porcentaje, 0) as porcentaje,
        MAX(av.fecha_visto) as ultimo_avance
      FROM Inscripciones i
      JOIN Usuarios u ON i.usuario_id = u.usuario_id
      JOIN Cursos c ON i.curso_id = c.curso_id
      LEFT JOIN Archivos_Vistos av ON av.usuario_id = u.usuario_id AND av.curso_id = c.curso_id
      LEFT JOIN Completaciones comp ON comp.inscripcion_id = i.inscripcion_id
      LEFT JOIN (
        SELECT i2.usuario_id, i2.curso_id,
          ROUND(COUNT(DISTINCT av2.archivo_id) / NULLIF(COUNT(DISTINCT ac.archivo_id), 0) * 100) as porcentaje
        FROM Inscripciones i2
        LEFT JOIN Archivos_Vistos av2 ON av2.usuario_id = i2.usuario_id AND av2.curso_id = i2.curso_id
        LEFT JOIN Archivos_Curso ac ON ac.curso_id = i2.curso_id
        GROUP BY i2.usuario_id, i2.curso_id
      ) progreso ON progreso.usuario_id = i.usuario_id AND progreso.curso_id = i.curso_id
      WHERE comp.completacion_id IS NULL
        AND u.email IS NOT NULL
        AND (av.fecha_visto IS NULL OR av.fecha_visto < DATE_SUB(NOW(), INTERVAL 7 DAY))
      GROUP BY u.usuario_id, c.curso_id
      HAVING porcentaje < 100
    `);

    let enviados = 0;
    for (const alumno of alumnos) {
      await notificarRecordatorio({
        toEmail: alumno.email,
        toNombre: alumno.nombre,
        tituloCurso: alumno.titulo,
        porcentaje: alumno.porcentaje,
        cursoId: alumno.curso_id,
      });
      enviados++;
    }

    return NextResponse.json({ success: true, enviados });
  } catch (error) {
    console.error('Error recordatorios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}