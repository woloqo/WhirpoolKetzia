import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { searchParams } = new URL(request.url);
  const curso_id = searchParams.get('curso_id');

  try {
    const [disponibles] = await pool.query(`
      SELECT usuario_id, nombre, email, rol_id FROM Usuarios 
      WHERE usuario_id NOT IN (
        SELECT usuario_id FROM Inscripciones WHERE curso_id = ?
      )
    `, [curso_id]);

    const [inscritos] = await pool.query(`
      SELECT u.usuario_id, u.nombre, u.email, i.fecha_asignacion, i.inscripcion_id
      FROM Usuarios u
      JOIN Inscripciones i ON u.usuario_id = i.usuario_id
      WHERE i.curso_id = ?
    `, [curso_id]);

    return NextResponse.json({ disponibles, inscritos });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { error } = await requireAdmin();
  if (error) return error; 

  try {
    const { usuario_id, curso_id } = await request.json();
    await pool.query(
      'DELETE FROM Inscripciones WHERE usuario_id = ? AND curso_id = ?',
      [usuario_id, curso_id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAdmin();
  if (error) return error; 

  try {
    const { usuario_id, curso_id } = await request.json();

    await pool.query(
      'INSERT INTO Inscripciones (usuario_id, curso_id, estado) VALUES (?, ?, "En curso")',
      [usuario_id, curso_id]
    );

    const [cursoRows] = await pool.query(
      'SELECT titulo, descripcionCorta FROM Cursos WHERE curso_id = ?', [curso_id]
    );
    const tituloCurso = cursoRows[0]?.titulo || 'un nuevo curso';

    await pool.query(
      'INSERT INTO Notificaciones (usuario_id, tipo, mensaje) VALUES (?, ?, ?)',
      [usuario_id, 'inscripcion', `Has sido inscrito en el curso: "${tituloCurso}"`]
    );

    const [alumnoRows] = await pool.query(
      'SELECT nombre, email FROM Usuarios WHERE usuario_id = ?', [usuario_id]
    );
    if (alumnoRows[0]?.email) {
      const { notificarCursoAsignado } = await import('@/lib/email');
      await notificarCursoAsignado({
        toEmail: alumnoRows[0].email,
        toNombre: alumnoRows[0].nombre,
        tituloCurso,
        descripcionCurso: cursoRows[0]?.descripcionCorta || '',
        cursoId: curso_id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error asignando curso:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}