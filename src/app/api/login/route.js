import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // Buscamos si el correo existe en la tabla Usuarios
    const [rows] = await pool.query(
      'SELECT usuario_id FROM Usuarios WHERE email = ?', 
      [email]
    );

    if (rows.length > 0) {
      // Si existe, regresamos el ID
      return NextResponse.json({ usuario_id: rows[0].usuario_id });
    } else {
      // Si no existe, mandamos un error 401
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 401 });
    }
  } catch (error) {
    console.error("Error en el servidor:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}