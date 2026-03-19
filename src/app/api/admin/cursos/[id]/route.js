import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    // 1. Verificamos que el curso exista
    const [curso] = await pool.query('SELECT titulo FROM Cursos WHERE curso_id = ?', [id]);
    
    if (curso.length === 0) {
      return NextResponse.json({ error: 'El curso no existe' }, { status: 404 });
    }

    // 2. Eliminamos el curso
    // Nota: Las tablas Archivos_Curso e Inscripciones se limpian solas si 
    // configuraste el FK con ON DELETE CASCADE.
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