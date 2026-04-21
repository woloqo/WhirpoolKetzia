import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) return NextResponse.json([]);

  try {
    const [gemas] = await pool.query(`
      SELECT g.gema_id, g.titulo, g.descripcion, g.usuario_id,
             u.nombre, u.alias, u.pfp
      FROM Gemas g
      JOIN Usuarios u ON g.usuario_id = u.usuario_id
      WHERE CONVERT(g.titulo USING utf8mb4) COLLATE utf8mb4_general_ci LIKE ?
         OR CONVERT(g.descripcion USING utf8mb4) COLLATE utf8mb4_general_ci LIKE ?
      ORDER BY g.fecha_creacion DESC
      LIMIT 20
    `, [`%${query}%`, `%${query}%`]);

    if (gemas.length === 0) return NextResponse.json([]);

    const gemaIds = gemas.map(g => g.gema_id);
    const [categorias] = await pool.query(`
      SELECT gc.gema_id, c.categoria_id, c.nombre
      FROM Gema_Categorias gc
      JOIN Categorias c ON gc.categoria_id = c.categoria_id
      WHERE gc.gema_id IN (?)
    `, [gemaIds]);

    gemas.forEach(g => {
      g.categorias = categorias.filter(c => c.gema_id === g.gema_id);
    });

    return NextResponse.json(gemas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}