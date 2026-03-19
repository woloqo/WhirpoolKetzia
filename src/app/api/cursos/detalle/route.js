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
    const [items] = await pool.query(`
      -- PARTE 1: Archivos
      SELECT 
        a.archivo_id AS id_contenido,
        a.nombre_archivo AS titulo,
        'archivo' AS tipo,
        ac.orden,
        (SELECT COUNT(*) FROM Archivos_Vistos av 
        WHERE av.archivo_id = a.archivo_id 
        AND av.usuario_id = ? 
        AND av.curso_id = ?) AS completado -- <--- FILTRO POR CURSO AÑADIDO
      FROM Archivos_Curso ac
      JOIN Archivos a ON ac.archivo_id = a.archivo_id
      WHERE ac.curso_id = ?

      UNION ALL

      -- PARTE 2: Quizzes (Este se mantiene igual ya que Quizzes_Completados ya tiene curso_id)
      SELECT 
        q.quiz_id AS id_contenido,
        q.titulo AS titulo,
        'quiz' AS tipo,
        qc.orden,
        (SELECT COUNT(*) FROM Quizzes_Completados qc_comp 
        WHERE qc_comp.quiz_id = q.quiz_id 
        AND qc_comp.usuario_id = ? 
        AND qc_comp.curso_id = ?) AS completado
      FROM Quiz_Curso qc
      JOIN Quizzes q ON qc.quiz_id = q.quiz_id
      WHERE qc.curso_id = ?

      ORDER BY orden ASC
    `, [usuario_id, curso_id, curso_id, usuario_id, curso_id, curso_id]); 

    // 3. Cálculo de Progreso
    const totalItems = items.length;
    const completadosCount = items.filter(i => i.completado > 0).length;
    const porcentaje = totalItems > 0 ? Math.round((completadosCount / totalItems) * 100) : 0;
    const esCompletadoReal = porcentaje === 100 && totalItems > 0;

    // 4. Inserción automática en Completaciones si aplica
    if (esCompletadoReal) {
      await pool.query(`
        INSERT IGNORE INTO Completaciones (usuario_id, inscripcion_id, fecha_completacion)
        SELECT ?, inscripcion_id, NOW() 
        FROM Inscripciones 
        WHERE usuario_id = ? AND curso_id = ?
      `, [usuario_id, usuario_id, curso_id]);
    }

    return NextResponse.json({
      curso: cursoRows[0],
      items,
      porcentaje,
      esCompletado: esCompletadoReal
    });

  } catch (error) {
    console.error("ERROR EN API DETALLE:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}