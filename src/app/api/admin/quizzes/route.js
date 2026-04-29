import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error; 

  try {
    const [rows] = await pool.query(`
      SELECT 
        q.quiz_id, 
        q.titulo, 
        q.descripcion,
        (SELECT COUNT(*) FROM Preguntas p WHERE p.quiz_id = q.quiz_id) as total_preguntas
      FROM Quizzes q
      ORDER BY q.quiz_id DESC
    `);
    return NextResponse.json(rows || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const connection = await pool.getConnection();
  try {
    const { titulo, descripcion, preguntas } = await request.json();

    if (!titulo || !preguntas?.length) {
      return NextResponse.json({ error: 'Título y preguntas son obligatorios' }, { status: 400 });
    }

    await connection.beginTransaction();

    // 1. Insertar el Quiz
    const [quizResult] = await connection.query(
      'INSERT INTO Quizzes (titulo, descripcion) VALUES (?, ?)',
      [titulo, descripcion]
    );
    const quizId = quizResult.insertId;

    // 2. Insertar cada Pregunta y sus Opciones
    for (const p of preguntas) {
      // Insertamos en la tabla Preguntas (usando texto_pregunta como definiste)
      const [pregResult] = await connection.query(
        'INSERT INTO Preguntas (quiz_id, texto_pregunta) VALUES (?, ?)',
        [quizId, p.texto]
      );
      const preguntaId = pregResult.insertId;

      // 3. Insertar las Opciones de esta pregunta
      for (let i = 0; i < p.opciones.length; i++) {
        const esCorrecta = (i === p.respuestaCorrecta);
        
        await connection.query(
          'INSERT INTO Opciones (pregunta_id, texto_opcion, es_correcta) VALUES (?, ?, ?)',
          [preguntaId, p.opciones[i], esCorrecta]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ success: true, quiz_id: quizId }, { status: 201 });

  } catch (error) {
    await connection.rollback();
    console.error("Error creando examen:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}


export async function DELETE(request) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Eliminar referencias en Quiz_Curso (si las hay) para evitar errores de FK
    await connection.query('DELETE FROM Quiz_Curso WHERE quiz_id = ?', [id]);

    // 2. Eliminar de la tabla Quizzes
    
    // Opciones (nietos)
    await connection.query(`
      DELETE FROM Opciones 
      WHERE pregunta_id IN (SELECT pregunta_id FROM Preguntas WHERE quiz_id = ?)
    `, [id]);

    // Preguntas (hijos)
    await connection.query('DELETE FROM Preguntas WHERE quiz_id = ?', [id]);

    // El Quiz (padre)
    const [result] = await connection.query('DELETE FROM Quizzes WHERE quiz_id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 });
    }

    await connection.commit();
    return NextResponse.json({ success: true, message: 'Examen eliminado correctamente' });

  } catch (error) {
    await connection.rollback();
    console.error("ERROR ELIMINANDO EXAMEN:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}