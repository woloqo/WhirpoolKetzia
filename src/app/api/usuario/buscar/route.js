import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Usamos CONVERT para ignorar acentos en MySQL
    const [rows] = await pool.query(`
      SELECT usuario_id, nombre, alias, pfp
      FROM Usuarios
      WHERE CONVERT(nombre USING utf8mb4) COLLATE utf8mb4_general_ci LIKE ?
         OR CONVERT(alias USING utf8mb4) COLLATE utf8mb4_general_ci LIKE ?
      LIMIT 20
    `, [`%${query}%`, `%${query}%`]);

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}