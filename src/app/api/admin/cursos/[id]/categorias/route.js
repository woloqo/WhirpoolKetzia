import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const { categorias } = await request.json();

    // Borrar las categorías actuales del curso
    await pool.query('DELETE FROM Curso_Categorias WHERE curso_id = ?', [id]);

    // Insertar las nuevas
    if (categorias?.length > 0) {
      const valores = categorias.map(cat_id => [id, cat_id]);
      await pool.query('INSERT INTO Curso_Categorias (curso_id, categoria_id) VALUES ?', [valores]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}