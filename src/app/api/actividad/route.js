import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { usuario_id } = await request.json();
    if (!usuario_id) return NextResponse.json({ error: 'Falta usuario_id' }, { status: 400 });

    const hoy = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(
      'SELECT racha_actual, mejor_racha, ultima_racha_fecha FROM Usuarios WHERE usuario_id = ?',
      [usuario_id]
    );
    const u = rows[0];
    if (!u) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const ultimaFecha = u.ultima_racha_fecha
      ? new Date(u.ultima_racha_fecha).toISOString().split('T')[0]
      : null;

    // Si ya se registró hoy, solo actualizar ultima_actividad
    if (ultimaFecha === hoy) {
      await pool.query(
        'UPDATE Usuarios SET ultima_actividad = NOW() WHERE usuario_id = ?',
        [usuario_id]
      );
      return NextResponse.json({ ok: true });
    }

    // Calcular nueva racha
    let nuevaRacha = u.racha_actual || 0;
    if (!ultimaFecha) {
      nuevaRacha = 1;
    } else {
      const diff = Math.floor((new Date(hoy) - new Date(ultimaFecha)) / (1000 * 60 * 60 * 24));
      nuevaRacha = diff === 1 ? nuevaRacha + 1 : 1;
    }

    const mejorRacha = Math.max(nuevaRacha, u.mejor_racha || 0);

    await pool.query(
      `UPDATE Usuarios SET 
        ultima_actividad = NOW(),
        racha_actual = ?,
        mejor_racha = ?,
        ultima_racha_fecha = ?
      WHERE usuario_id = ?`,
      [nuevaRacha, mejorRacha, hoy, usuario_id]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}