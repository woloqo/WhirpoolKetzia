import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function PUT(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;

  try {
    const { titulo, descripcion, descripcionCorta } = await request.json();

    await pool.query(
      'UPDATE Cursos SET titulo = ?, descripcion = ?, descripcionCorta = ? WHERE curso_id = ?',
      [titulo, descripcion, descripcionCorta, id]
    );

    return NextResponse.json({ success: true, message: 'Curso actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar curso:", error);
    return NextResponse.json({ error: 'No se pudo actualizar el curso' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { id } = await params;

  try {
    const [curso] = await pool.query('SELECT titulo FROM Cursos WHERE curso_id = ?', [id]);
    
    if (curso.length === 0) {
      return NextResponse.json({ error: 'El curso no existe' }, { status: 404 });
    }

    await pool.query('DELETE FROM Cursos WHERE curso_id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: `Curso "${curso[0].titulo}" eliminado correctamente` 
    });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    return NextResponse.json({ error: 'No se pudo eliminar el curso' }, { status: 500 });
  }
}