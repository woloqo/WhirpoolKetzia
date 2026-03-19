import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const { titulo, descripcion, imagenSrc, archivosSeleccionados, quizzesSeleccionados, creado_por } = await request.json();

    if (!titulo || !creado_por) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    await connection.beginTransaction();

    // 1. Insertar el curso
    const [cursoResult] = await connection.query(
      `INSERT INTO Cursos (titulo, descripcion, imagenSrc, creado_por) VALUES (?, ?, ?, ?)`,
      [titulo, descripcion, imagenSrc, creado_por]
    );
    const nuevoCursoId = cursoResult.insertId;

    // 2. Vincular ARCHIVOS (N:M)
    if (archivosSeleccionados && archivosSeleccionados.length > 0) {
      for (let i = 0; i < archivosSeleccionados.length; i++) {
        await connection.query(
          `INSERT INTO Archivos_Curso (curso_id, archivo_id, orden) VALUES (?, ?, ?)`,
          [nuevoCursoId, archivosSeleccionados[i], i + 1]
        );
      }
    }

    // 3. Vincular QUIZZES (N:M) - NUEVO
    if (quizzesSeleccionados && quizzesSeleccionados.length > 0) {
      for (let j = 0; j < quizzesSeleccionados.length; j++) {
        // El orden de los quizzes empieza después de los archivos o puedes manejarlo independiente
        const ordenQuiz = (archivosSeleccionados?.length || 0) + j + 1;
        
        await connection.query(
          `INSERT INTO Quiz_Curso (curso_id, quiz_id, orden) VALUES (?, ?, ?)`,
          [nuevoCursoId, quizzesSeleccionados[j], ordenQuiz]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ success: true, curso_id: nuevoCursoId }, { status: 201 });

  } catch (error) {
    await connection.rollback();
    console.error("ERROR AL CREAR CURSO COMPLETO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}