import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [gemas] = await pool.query(`
      SELECT g.*, u.nombre, u.alias, u.pfp
      FROM Gemas g
      JOIN Usuarios u ON g.usuario_id = u.usuario_id
      ORDER BY g.fecha_creacion DESC
    `);

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