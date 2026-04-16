import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

const LIMITE_IMAGENES = 5;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const publicacion_id = searchParams.get('publicacion_id');

  try {
    const [rows] = await pool.query(
      'SELECT * FROM Publicaciones_Imagenes WHERE publicacion_id = ? ORDER BY orden ASC',
      [publicacion_id]
    );
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { publicacion_id, url_imagen, orden } = await request.json();

    // Verificar límite
    const [count] = await pool.query(
      'SELECT COUNT(*) as total FROM Publicaciones_Imagenes WHERE publicacion_id = ?',
      [publicacion_id]
    );
    if (count[0].total >= LIMITE_IMAGENES) {
      return NextResponse.json({ error: `Límite de ${LIMITE_IMAGENES} imágenes alcanzado` }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO Publicaciones_Imagenes (publicacion_id, url_imagen, orden) VALUES (?, ?, ?)',
      [publicacion_id, url_imagen, orden || 1]
    );

    return NextResponse.json({ success: true, imagen_id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const imagen_id = searchParams.get('imagen_id');

  try {
    await pool.query('DELETE FROM Publicaciones_Imagenes WHERE imagen_id = ?', [imagen_id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}