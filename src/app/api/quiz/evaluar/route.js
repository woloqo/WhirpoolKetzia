import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { usuario_id, quiz_id, curso_id, respuestas } = await request.json();

    if (!usuario_id || !quiz_id || !curso_id) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // 1. Obtener las respuestas correctas de la DB
    const [opcionesCorrectas] = await pool.query(
      `SELECT pregunta_id, opcion_id FROM Opciones 
       WHERE pregunta_id IN (SELECT pregunta_id FROM Preguntas WHERE quiz_id = ?) 
       AND es_correcta = TRUE`,
      [quiz_id]
    );

    // 2. Calcular la calificación
    let aciertos = 0;
    opcionesCorrectas.forEach(correcta => {
      if (respuestas[correcta.pregunta_id] === correcta.opcion_id) {
        aciertos++;
      }
    });

    const totalPreguntas = opcionesCorrectas.length;
    const calificacion = totalPreguntas > 0 ? Math.round((aciertos / totalPreguntas) * 100) : 0;

    // 3. Obtener puntos mínimos del quiz
    const [quizInfo] = await pool.query('SELECT puntos_minimos FROM Quizzes WHERE quiz_id = ?', [quiz_id]);
    const puntos_minimos = quizInfo[0]?.puntos_minimos || 80;
    const aprobado = calificacion >= puntos_minimos;

    // 4. Guardar el intento histórico
    await pool.query(
      'INSERT INTO Intentos_Quiz (usuario_id, quiz_id, calificacion) VALUES (?, ?, ?)',
      [usuario_id, quiz_id, calificacion]
    );

    let cursoCompletado = false;

    // 5. LÓGICA DE PROGRESO INTEGRADA (Sin lib externa)
    if (aprobado) {
      // Registrar el quiz como aprobado para este curso
      await pool.query(`
        INSERT INTO Quizzes_Completados (usuario_id, quiz_id, curso_id, calificacion_maxima)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE calificacion_maxima = GREATEST(calificacion_maxima, ?)
      `, [usuario_id, quiz_id, curso_id, calificacion, calificacion]);

      // --- VERIFICACIÓN DE CURSO COMPLETO ---
      // Contar ítems totales del curso (Archivos + Quizzes)
      const [totalRows] = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM Archivos_Curso WHERE curso_id = ?) +
          (SELECT COUNT(*) FROM Quiz_Curso WHERE curso_id = ?) as total
      `, [curso_id, curso_id]);
      
      const totalItems = totalRows[0].total;

      // Contar ítems hechos por el usuario
      const [hechosRows] = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM Archivos_Vistos WHERE usuario_id = ? AND curso_id = ?) +
          (SELECT COUNT(*) FROM Quizzes_Completados WHERE usuario_id = ? AND curso_id = ?) as hechos
      `, [usuario_id, curso_id, usuario_id, curso_id]);
      
      const itemsHechos = hechosRows[0].hechos;

      // Si terminó todo, marcar curso como completado
      if (itemsHechos >= totalItems && totalItems > 0) {
        await pool.query(`
          INSERT IGNORE INTO Completaciones (usuario_id, inscripcion_id)
          SELECT ?, inscripcion_id FROM Inscripciones 
          WHERE usuario_id = ? AND curso_id = ?
        `, [usuario_id, usuario_id, curso_id]);
        
        cursoCompletado = true;
      }
    }

    // 6. Respuesta para el frontend
    return NextResponse.json({ 
      calificacion, 
      aprobado, 
      cursoCompletado 
    });

  } catch (error) {
    console.error("ERROR EN EVALUAR QUIZ:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}