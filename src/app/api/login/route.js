import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    // CORRECCIÓN: Agregamos 'rol_id' a la consulta SELECT
    const [rows] = await pool.query(
      'SELECT usuario_id, rol_id FROM Usuarios WHERE email = ?', 
      [email]
    );

    if (rows.length > 0) {
      // Ahora enviamos un objeto que contiene AMBOS valores
      return NextResponse.json({ 
        usuario_id: rows[0].usuario_id,
        rol_id: rows[0].rol_id // <--- Esto es lo que le faltaba a tu Sidebar
      });
    } else {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 401 });
    }
  } catch (error) {
    console.error("Error en el servidor:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}