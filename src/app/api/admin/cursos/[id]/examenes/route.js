import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;
  try {
    const [rows] = await pool.query(`
      SELECT q.*, qc.orden, qc.quiz_curso_id, qc.seccion_id
      FROM Quiz_Curso qc
      JOIN Quizzes q ON qc.quiz_id = q.quiz_id
      WHERE qc.curso_id = ?
      ORDER BY qc.orden ASC
    `, [id]);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;
  try {
    const { quiz_id, seccion_id } = await request.json();

    const [maxOrden] = await pool.query(
      'SELECT MAX(orden) as maxOrden FROM Quiz_Curso WHERE curso_id = ?', [id]
    );
    const orden = (maxOrden[0].maxOrden || 0) + 1;

    await pool.query(
      'INSERT INTO Quiz_Curso (curso_id, quiz_id, orden, seccion_id) VALUES (?, ?, ?, ?)',
      [id, quiz_id, orden, seccion_id || null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const quiz_curso_id = searchParams.get('quiz_curso_id');
  try {
    await pool.query('DELETE FROM Quiz_Curso WHERE quiz_curso_id = ? AND curso_id = ?', [quiz_curso_id, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;
  try {
    const { examenes } = await request.json();
    for (const ex of examenes) {
      await pool.query(
        'UPDATE Quiz_Curso SET orden = ?, seccion_id = ? WHERE quiz_curso_id = ? AND curso_id = ?',
        [ex.orden, ex.seccion_id || null, ex.quiz_curso_id, id]
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}