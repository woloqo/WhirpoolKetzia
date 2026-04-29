import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

// GET: Obtener quiz completo con preguntas y opciones (incluyendo cuál es correcta)
export async function GET(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;

  try {
    const [quizRows] = await pool.query(
      'SELECT * FROM Quizzes WHERE quiz_id = ?',
      [id]
    );

    if (quizRows.length === 0) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 });
    }

    const [preguntas] = await pool.query(
      'SELECT pregunta_id, texto_pregunta FROM Preguntas WHERE quiz_id = ? ORDER BY pregunta_id ASC',
      [id]
    );

    for (let pregunta of preguntas) {
      const [opciones] = await pool.query(
        'SELECT opcion_id, texto_opcion, es_correcta FROM Opciones WHERE pregunta_id = ? ORDER BY opcion_id ASC',
        [pregunta.pregunta_id]
      );
      pregunta.opciones = opciones;
    }

    return NextResponse.json({ ...quizRows[0], preguntas });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar quiz completo (título, descripción, preguntas y opciones)
export async function PUT(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;
  const connection = await pool.getConnection();

  try {
    const { titulo, descripcion, preguntas } = await request.json();

    if (!titulo || !preguntas?.length) {
      return NextResponse.json({ error: 'Título y preguntas son obligatorios' }, { status: 400 });
    }

    await connection.beginTransaction();

    // 1. Actualizar datos del quiz
    await connection.query(
      'UPDATE Quizzes SET titulo = ?, descripcion = ? WHERE quiz_id = ?',
      [titulo, descripcion, id]
    );

    // 2. Obtener IDs de preguntas actuales en DB
    const [preguntasDB] = await connection.query(
      'SELECT pregunta_id FROM Preguntas WHERE quiz_id = ?',
      [id]
    );
    const idsEnDB = preguntasDB.map(p => p.pregunta_id);
    const idsEnForm = preguntas.filter(p => p.pregunta_id).map(p => p.pregunta_id);

    // 3. Eliminar preguntas que fueron removidas
    for (const pid of idsEnDB) {
      if (!idsEnForm.includes(pid)) {
        await connection.query('DELETE FROM Opciones WHERE pregunta_id = ?', [pid]);
        await connection.query('DELETE FROM Preguntas WHERE pregunta_id = ?', [pid]);
      }
    }

    // 4. Actualizar o insertar preguntas
    for (const p of preguntas) {
      let preguntaId = p.pregunta_id;

      if (preguntaId) {
        // Pregunta existente — actualizar texto
        await connection.query(
          'UPDATE Preguntas SET texto_pregunta = ? WHERE pregunta_id = ?',
          [p.texto, preguntaId]
        );
        // Borrar opciones viejas y re-insertar
        await connection.query('DELETE FROM Opciones WHERE pregunta_id = ?', [preguntaId]);
      } else {
        // Pregunta nueva — insertar
        const [res] = await connection.query(
          'INSERT INTO Preguntas (quiz_id, texto_pregunta) VALUES (?, ?)',
          [id, p.texto]
        );
        preguntaId = res.insertId;
      }

      // Insertar opciones
      for (let i = 0; i < p.opciones.length; i++) {
        const esCorrecta = i === p.respuestaCorrecta;
        await connection.query(
          'INSERT INTO Opciones (pregunta_id, texto_opcion, es_correcta) VALUES (?, ?, ?)',
          [preguntaId, p.opciones[i], esCorrecta]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando examen:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}