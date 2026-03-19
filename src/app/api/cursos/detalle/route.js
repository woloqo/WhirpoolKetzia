import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const curso_id = searchParams.get('curso_id');
  const usuario_id = searchParams.get('usuario_id');

  if (!curso_id || !usuario_id) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  try {
    // 1. Datos básicos del curso
    const [cursoRows] = await pool.query(`
      SELECT c.*, u.nombre as nombre_autor 
      FROM Cursos c
      LEFT JOIN Usuarios u ON c.creado_por = u.usuario_id
      WHERE c.curso_id = ?
    `, [curso_id]);

    if (cursoRows.length === 0) return NextResponse.json({ error: 'No existe' }, { status: 404 });

    // 2. Consulta UNIFICADA (Archivos + Quizzes)
    // Usamos JOIN en la segunda parte para traer el título desde la tabla Quizzes
    const [items] = await pool.query(`
      -- PARTE 1: Archivos
      SELECT 
        archivo_id AS id_contenido,
        nombre_archivo AS titulo,
        'archivo' AS tipo,
        orden,
        (SELECT COUNT(*) FROM Archivos_Vistos av 
        WHERE av.archivo_id = ac.archivo_id AND av.usuario_id = ?) AS completado
      FROM Archivos_Curso ac
      WHERE curso_id = ?

      UNION ALL

      -- PARTE 2: Quizzes (Ahora leyendo de Quizzes_Completados)
      SELECT 
        q.quiz_id AS id_contenido,
        q.titulo AS titulo,
        'quiz' AS tipo,
        qc.orden,
        (SELECT COUNT(*) FROM Quizzes_Completados qc_comp 
        WHERE qc_comp.quiz_id = q.quiz_id AND qc_comp.usuario_id = ?) AS completado
      FROM Quiz_Curso qc
      JOIN Quizzes q ON qc.quiz_id = q.quiz_id
      WHERE qc.curso_id = ?

      ORDER BY orden ASC
    `, [usuario_id, curso_id, usuario_id, curso_id]);

    // 3. Progreso
    const totalItems = items.length;
    const completados = items.filter(i => i.completado > 0).length;
    const porcentaje = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0;

    return NextResponse.json({
      curso: cursoRows[0],
      items,
      porcentaje,
      esCompletado: porcentaje === 100
    });

  } catch (error) {
    console.error("ERROR EN API DETALLE:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}