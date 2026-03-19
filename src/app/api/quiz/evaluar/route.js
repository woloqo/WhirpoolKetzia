import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { usuario_id, quiz_id, respuestas, curso_id } = await request.json();

    // 1. Obtener las respuestas correctas de la base de datos para este quiz
    const [correctas] = await pool.query(`
      SELECT p.pregunta_id, o.opcion_id 
      FROM Preguntas p
      JOIN Opciones o ON p.pregunta_id = o.pregunta_id
      WHERE p.quiz_id = ? AND o.es_correcta = TRUE
    `, [quiz_id]);

    // 2. Calcular la calificación
    let aciertos = 0;
    const totalPreguntas = correctas.length;

    correctas.forEach(c => {
      if (respuestas[c.pregunta_id] === c.opcion_id) {
        aciertos++;
      }
    });

    const calificacion = Math.round((aciertos / totalPreguntas) * 100);

    // 3. Guardar el intento en la base de datos
    await pool.query(
      'INSERT INTO Intentos_Quiz (usuario_id, quiz_id, calificacion) VALUES (?, ?, ?)',
      [usuario_id, quiz_id, calificacion]
    );

    // 4. Si aprobó, marcar la "lección de quiz" como vista en la tabla de progreso
    const [quizInfo] = await pool.query('SELECT puntos_minimos FROM Quizzes WHERE quiz_id = ?', [quiz_id]);
    
   if (calificacion >= quizInfo[0].puntos_minimos) {
    await pool.query(`
        INSERT INTO Quizzes_Completados (usuario_id, quiz_id, curso_id, calificacion_maxima)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        calificacion_maxima = IF(VALUES(calificacion_maxima) > calificacion_maxima, VALUES(calificacion_maxima), calificacion_maxima)
    `, [usuario_id, quiz_id, curso_id, calificacion]);
    }

    return NextResponse.json({ 
      calificacion, 
      aprobado: calificacion >= quizInfo[0].puntos_minimos 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}