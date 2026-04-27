import bcrypt from 'bcrypt';
import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

const actualizarRacha = async (usuario_id) => {
  const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const [rows] = await pool.query(
    'SELECT racha_actual, mejor_racha, ultima_racha_fecha FROM Usuarios WHERE usuario_id = ?',
    [usuario_id]
  );
  const u = rows[0];

  const ultimaFecha = u.ultima_racha_fecha 
    ? new Date(u.ultima_racha_fecha).toISOString().split('T')[0] 
    : null;

  let nuevaRacha = u.racha_actual || 0;

  if (!ultimaFecha) {
    // Primera vez que entra
    nuevaRacha = 1;
  } else if (ultimaFecha === hoy) {
    // Ya entró hoy, no cambia nada
    await pool.query(
      'UPDATE Usuarios SET ultima_actividad = NOW() WHERE usuario_id = ?',
      [usuario_id]
    );
    return;
  } else {
    // Calcular diferencia en días
    const diff = Math.floor(
      (new Date(hoy) - new Date(ultimaFecha)) / (1000 * 60 * 60 * 24)
    );
    if (diff === 1) {
      // Día consecutivo — aumentar racha
      nuevaRacha = nuevaRacha + 1;
    } else {
      // Se rompió la racha
      nuevaRacha = 1;
    }
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
};

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const [rows] = await pool.query('SELECT * FROM Usuarios WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "El correo no está registrado" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    // Actualizar racha y última actividad
    await actualizarRacha(user.usuario_id);

    return NextResponse.json({
      message: "Login exitoso",
      user: {
        id: user.usuario_id,
        nombre: user.nombre,
        rol: user.rol_id,
        pfp: user.pfp,
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}