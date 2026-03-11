import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('usuario_id');

  if (!usuarioId) {
    return NextResponse.json({ message: 'No se detectó usuario' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query(`
      SELECT c.* FROM Cursos c
      JOIN Inscripciones i ON c.curso_id = i.curso_id
      WHERE i.usuario_id = ?`, 
      [usuarioId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error de base de datos' }, { status: 500 });
  }
}