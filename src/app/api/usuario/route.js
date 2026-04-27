import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('id');

  if (!usuarioId) return NextResponse.json({ message: 'No ID' }, { status: 400 });

  try {
    const [rows] = await pool.query(`
      SELECT 
        nombre, email, pfp, alias, rol_id,
        ultima_actividad, racha_actual, mejor_racha, ultima_racha_fecha
      FROM Usuarios 
      WHERE usuario_id = ?
    `, [usuarioId]);

    if (rows.length > 0) return NextResponse.json(rows[0]);
    return NextResponse.json({ message: 'No encontrado' }, { status: 404 });
  } catch (error) {
    console.error("ERROR DETECTADO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}