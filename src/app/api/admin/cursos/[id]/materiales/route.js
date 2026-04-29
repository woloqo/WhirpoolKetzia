import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;
  try {
    const [rows] = await pool.query(`
      SELECT a.*, ac.orden, ac.relacion_id, ac.seccion_id
      FROM Archivos_Curso ac
      JOIN Archivos a ON ac.archivo_id = a.archivo_id
      WHERE ac.curso_id = ?
      ORDER BY ac.orden ASC
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
    const { archivo_id, seccion_id } = await request.json();
    const [maxOrden] = await pool.query(
      'SELECT MAX(orden) as maxOrden FROM Archivos_Curso WHERE curso_id = ?', [id]
    );
    const orden = (maxOrden[0].maxOrden || 0) + 1;
    await pool.query(
      'INSERT INTO Archivos_Curso (curso_id, archivo_id, orden, seccion_id) VALUES (?, ?, ?, ?)',
      [id, archivo_id, orden, seccion_id || null]
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
  const relacion_id = searchParams.get('relacion_id');
  try {
    await pool.query('DELETE FROM Archivos_Curso WHERE relacion_id = ? AND curso_id = ?', [relacion_id, id]);
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
    const { materiales } = await request.json();
    for (const m of materiales) {
      await pool.query(
        'UPDATE Archivos_Curso SET orden = ?, seccion_id = ? WHERE relacion_id = ? AND curso_id = ?',
        [m.orden, m.seccion_id || null, m.relacion_id, id]
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}