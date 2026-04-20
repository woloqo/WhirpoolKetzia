import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('id');

  if (!usuarioId) return NextResponse.json({ message: 'No ID' }, { status: 400 });

  try {
    const [userRows] = await pool.query(`
      SELECT u.*, r.nombre as nombre_rol 
      FROM Usuarios u
      JOIN Roles r ON u.rol_id = r.rol_id
      WHERE u.usuario_id = ?`, [usuarioId]);

    const [statsRows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM Inscripciones WHERE usuario_id = ?) as total_inscritos,
        (SELECT COUNT(*) FROM Completaciones c 
         JOIN Inscripciones i ON c.inscripcion_id = i.inscripcion_id 
         WHERE i.usuario_id = ?) as total_completados
    `, [usuarioId, usuarioId]);

    // Cursos del usuario (con porcentaje simulado basado en estado)
    const [cursosRows] = await pool.query(`
      SELECT c.curso_id, c.titulo, c.imagenSrc, c.descripcionCorta, i.estado,
        CASE WHEN comp.completacion_id IS NOT NULL THEN 1 ELSE 0 END as completado,
        CASE WHEN comp.completacion_id IS NOT NULL THEN 100 ELSE 50 END as porcentaje -- Simulación de porcentaje, ajusta según tu lógica real
      FROM Inscripciones i
      JOIN Cursos c ON i.curso_id = c.curso_id
      LEFT JOIN Completaciones comp ON comp.inscripcion_id = i.inscripcion_id
      WHERE i.usuario_id = ?
      ORDER BY completado ASC
    `, [usuarioId]);

    if (userRows.length === 0) return NextResponse.json({ message: 'No encontrado' }, { status: 404 });

    return NextResponse.json({
      usuario: userRows[0],
      stats: statsRows[0],
      cursos: cursosRows
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { usuario_id, alias, pfp } = body;

    if (!usuario_id) {
      return NextResponse.json({ message: 'Datos insuficientes' }, { status: 400 });
    }

    await pool.query(
      `UPDATE Usuarios SET alias = ?, pfp = ? WHERE usuario_id = ?`,
      [alias, pfp, usuario_id]
    );

    return NextResponse.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}