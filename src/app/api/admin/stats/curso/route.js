import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { searchParams } = new URL(request.url);
  const curso_id = searchParams.get('curso_id');

  if (!curso_id) return NextResponse.json({ error: 'Falta curso_id' }, { status: 400 });

  try {
    const [
      [infoCurso],
      [inscripcionesStats],
      [quizStats],
      [materialesStats],
      [topAlumnos],
      [seccionesStats],
    ] = await Promise.all([

      pool.query(`
        SELECT c.titulo, c.imagenSrc, c.fecha_creacion, u.nombre as creador
        FROM Cursos c
        LEFT JOIN Usuarios u ON c.creado_por = u.usuario_id
        WHERE c.curso_id = ?
      `, [curso_id]),

      pool.query(`
        SELECT
          COUNT(DISTINCT i.usuario_id) as total_inscritos,
          COUNT(DISTINCT c.completacion_id) as total_completados,
          ROUND((COUNT(DISTINCT c.completacion_id) / NULLIF(COUNT(DISTINCT i.usuario_id), 0)) * 100) as tasa_completacion,
          MIN(i.fecha_asignacion) as primera_inscripcion,
          COUNT(DISTINCT CASE WHEN i.fecha_asignacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN i.usuario_id END) as nuevos_mes
        FROM Inscripciones i
        LEFT JOIN Completaciones comp ON i.inscripcion_id = comp.inscripcion_id
        LEFT JOIN Completaciones c ON i.inscripcion_id = c.inscripcion_id
        WHERE i.curso_id = ?
      `, [curso_id]),

      pool.query(`
        SELECT
          COUNT(*) as total_intentos,
          ROUND(AVG(iq.calificacion)) as promedio,
          MAX(iq.calificacion) as mejor,
          MIN(iq.calificacion) as peor,
          COUNT(DISTINCT iq.usuario_id) as alumnos_con_intento
        FROM Intentos_Quiz iq
        JOIN Quiz_Curso qc ON iq.quiz_id = qc.quiz_id
        WHERE qc.curso_id = ?
      `, [curso_id]),

      pool.query(`
        SELECT
          COUNT(DISTINCT ac.archivo_id) as total_materiales,
          COUNT(DISTINCT av.usuario_id) as alumnos_con_avance,
          COUNT(DISTINCT av.archivo_id) as materiales_vistos
        FROM Archivos_Curso ac
        LEFT JOIN Archivos_Vistos av ON ac.archivo_id = av.archivo_id AND av.curso_id = ?
        WHERE ac.curso_id = ?
      `, [curso_id, curso_id]),

      pool.query(`
  SELECT u.usuario_id, u.nombre, u.alias, u.pfp,
    COUNT(DISTINCT av.archivo_id) as materiales_vistos,
    MAX(iq.calificacion) as mejor_quiz,
    MAX(CASE WHEN comp.completacion_id IS NOT NULL THEN 1 ELSE 0 END) as completado
  FROM Inscripciones i
  JOIN Usuarios u ON i.usuario_id = u.usuario_id
  LEFT JOIN Archivos_Vistos av ON u.usuario_id = av.usuario_id AND av.curso_id = ?
  LEFT JOIN Quiz_Curso qc ON qc.curso_id = ?
  LEFT JOIN Intentos_Quiz iq ON iq.usuario_id = u.usuario_id AND iq.quiz_id = qc.quiz_id
  LEFT JOIN Completaciones comp ON comp.inscripcion_id = i.inscripcion_id
  WHERE i.curso_id = ?
  GROUP BY u.usuario_id, u.nombre, u.alias, u.pfp
  ORDER BY completado DESC, materiales_vistos DESC
  LIMIT 6
`, [curso_id, curso_id, curso_id]),

      pool.query(`
        SELECT s.seccion_id, s.titulo,
          COUNT(DISTINCT ac.archivo_id) + COUNT(DISTINCT qc.quiz_id) as total_items,
          COUNT(DISTINCT av.usuario_id) as alumnos_con_avance
        FROM Secciones s
        LEFT JOIN Archivos_Curso ac ON ac.seccion_id = s.seccion_id
        LEFT JOIN Quiz_Curso qc ON qc.seccion_id = s.seccion_id
        LEFT JOIN Archivos_Vistos av ON av.archivo_id = ac.archivo_id AND av.curso_id = s.curso_id
        WHERE s.curso_id = ?
        GROUP BY s.seccion_id
        ORDER BY s.orden ASC
      `, [curso_id]),
    ]);

    return NextResponse.json({
      info: infoCurso[0],
      inscripciones: inscripcionesStats[0],
      quizzes: quizStats[0],
      materiales: materialesStats[0],
      topAlumnos,
      secciones: seccionesStats,
    });

  } catch (error) {
    console.error("ERROR STATS CURSO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}