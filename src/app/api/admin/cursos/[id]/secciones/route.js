import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Secciones WHERE curso_id = ? ORDER BY orden ASC',
      [id]
    );
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
    const { titulo } = await request.json();
    const [maxOrden] = await pool.query(
      'SELECT MAX(orden) as maxOrden FROM Secciones WHERE curso_id = ?', [id]
    );
    const orden = (maxOrden[0].maxOrden || 0) + 1;
    const [result] = await pool.query(
      'INSERT INTO Secciones (curso_id, titulo, orden) VALUES (?, ?, ?)',
      [id, titulo, orden]
    );
    return NextResponse.json({ success: true, seccion_id: result.insertId, titulo, orden });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;
  try {
    const { seccion_id, titulo } = await request.json();
    await pool.query(
      'UPDATE Secciones SET titulo = ? WHERE seccion_id = ? AND curso_id = ?',
      [titulo, seccion_id, id]
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
  const seccion_id = searchParams.get('seccion_id');
  try {
    // Desasignar materiales y exámenes de la sección antes de borrarla
    await pool.query('UPDATE Archivos_Curso SET seccion_id = NULL WHERE seccion_id = ?', [seccion_id]);
    await pool.query('UPDATE Quiz_Curso SET seccion_id = NULL WHERE seccion_id = ?', [seccion_id]);
    await pool.query('DELETE FROM Secciones WHERE seccion_id = ? AND curso_id = ?', [seccion_id, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}