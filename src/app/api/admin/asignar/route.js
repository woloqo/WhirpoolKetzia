import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const curso_id = searchParams.get('curso_id');

  try {
    // 1. Usuarios NO inscritos (incluye Admins y Empleados que falten)
    const [disponibles] = await pool.query(`
      SELECT usuario_id, nombre, email, rol_id FROM Usuarios 
      WHERE usuario_id NOT IN (
        SELECT usuario_id FROM Inscripciones WHERE curso_id = ?
      )
    `, [curso_id]);

    // 2. Usuarios YA inscritos
    const [inscritos] = await pool.query(`
      SELECT u.usuario_id, u.nombre, u.email, i.fecha_asignacion, i.inscripcion_id
      FROM Usuarios u
      JOIN Inscripciones i ON u.usuario_id = i.usuario_id
      WHERE i.curso_id = ?
    `, [curso_id]);

    return NextResponse.json({ disponibles, inscritos });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { usuario_id, curso_id } = await request.json();
    await pool.query(
      'DELETE FROM Inscripciones WHERE usuario_id = ? AND curso_id = ?',
      [usuario_id, curso_id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// El POST se mantiene igual que antes...

export async function POST(request) {
  try {
    const { usuario_id, curso_id } = await request.json();
    
    await pool.query(
      'INSERT INTO Inscripciones (usuario_id, curso_id, estado) VALUES (?, ?, "En curso")',
      [usuario_id, curso_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}