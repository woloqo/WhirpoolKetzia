import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const quiz_id = searchParams.get('quiz_id');

  try {
    // 1. Obtener la cabecera del quiz
    const [quizRows] = await pool.query(
      'SELECT * FROM Quizzes WHERE quiz_id = ?', 
      [quiz_id]
    );

    if (quizRows.length === 0) {
      return NextResponse.json({ error: 'Quiz no encontrado' }, { status: 404 });
    }

    // 2. Obtener todas las preguntas de este quiz
    const [preguntas] = await pool.query(
      'SELECT pregunta_id, texto_pregunta FROM Preguntas WHERE quiz_id = ?',
      [quiz_id]
    );

    // 3. Para cada pregunta, obtener sus opciones (Ocultando cuál es la correcta)
    for (let pregunta of preguntas) {
      const [opciones] = await pool.query(
        'SELECT opcion_id, texto_opcion FROM Opciones WHERE pregunta_id = ?',
        [pregunta.pregunta_id]
      );
      pregunta.opciones = opciones;
    }

    return NextResponse.json({
      ...quizRows[0],
      preguntas
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}