import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params; 

  try {
    const [rows] = await pool.query(
      'SELECT a.*, c.titulo as curso_titulo FROM Archivos_Curso a JOIN Cursos c ON a.curso_id = c.curso_id WHERE a.archivo_id = ?',
      [id]
    );
    if (rows && rows.length > 0) {
      const archivo = JSON.parse(JSON.stringify(rows[0]));
      return NextResponse.json(archivo);
    }

    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  } catch (error) {
    console.error("Error en API Archivos:", error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}