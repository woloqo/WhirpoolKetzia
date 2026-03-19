import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { usuario_id, curso_id, archivo_id } = await request.json();

    if (!usuario_id || !curso_id || !archivo_id) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // 1. Registrar el archivo como visto ESPECÍFICO para este curso
    // Agregamos curso_id a la inserción
    await pool.query(
      'INSERT IGNORE INTO Archivos_Vistos (usuario_id, curso_id, archivo_id) VALUES (?, ?, ?)',
      [usuario_id, curso_id, archivo_id]
    );

    // 2. Obtener el total de archivos que tiene este curso
    const [totalRows] = await pool.query(
      'SELECT COUNT(*) as total FROM Archivos_Curso WHERE curso_id = ?',
      [curso_id]
    );
    const totalArchivos = totalRows[0].total;

    // 3. Contar cuántos archivos ha visto el usuario EN ESTE CURSO
    // Ahora filtramos directamente en Archivos_Vistos por el curso_id
    const [vistosRows] = await pool.query(
      'SELECT COUNT(*) as vistos FROM Archivos_Vistos WHERE usuario_id = ? AND curso_id = ?',
      [usuario_id, curso_id]
    );
    const archivosVistos = vistosRows[0].vistos;

    // --- LÓGICA DE QUIZ ---
    
    // 4. Verificar si el curso tiene Quizzes asociados (Tabla Quiz_Curso)
    const [quizRows] = await pool.query(
      `SELECT q.quiz_id, q.puntos_minimos 
       FROM Quiz_Curso qc
       JOIN Quizzes q ON qc.quiz_id = q.quiz_id
       WHERE qc.curso_id = ?`,
      [curso_id]
    );

    let tieneQuiz = quizRows.length > 0;
    let quizAprobado = false;

    if (tieneQuiz) {
      // Verificamos si aprobó AL MENOS uno de los quizzes requeridos para este curso
      // O si prefieres, puedes ajustar esta lógica para que requiera TODOS los quizzes
      const quiz = quizRows[0];
      const [intentoRows] = await pool.query(
        `SELECT calificacion FROM Intentos_Quiz 
         WHERE usuario_id = ? AND quiz_id = ? 
         AND calificacion >= ? 
         ORDER BY calificacion DESC LIMIT 1`,
        [usuario_id, quiz.quiz_id, quiz.puntos_minimos]
      );
      if (intentoRows.length > 0) quizAprobado = true;
    }

    // --- FIN LÓGICA DE QUIZ ---

    const archivosTerminados = totalArchivos > 0 && archivosVistos >= totalArchivos;

    // 5. Lógica de completado final:
    const puedeCompletar = tieneQuiz 
      ? (archivosTerminados && quizAprobado) 
      : archivosTerminados;

    let completado = false;
    if (puedeCompletar) {
      await pool.query(`
        INSERT IGNORE INTO Completaciones (usuario_id, inscripcion_id, fecha_completacion)
        SELECT ?, inscripcion_id, NOW() 
        FROM Inscripciones 
        WHERE usuario_id = ? AND curso_id = ?`,
        [usuario_id, usuario_id, curso_id]
      );
      completado = true;
    }

    const porcentaje = totalArchivos > 0 
      ? Math.round((archivosVistos / totalArchivos) * 100) 
      : 0;

    return NextResponse.json({ 
      completado, 
      progreso: `${archivosVistos}/${totalArchivos}`,
      porcentaje,
      necesitaQuiz: tieneQuiz && !quizAprobado 
    });

  } catch (error) {
    console.error("ERROR EN API PROGRESO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}