import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { notificarComentario } from '@/lib/email';

export async function POST(request) {
  try {
    const { usuario_id, publicacion_id, contenido } = await request.json();

    if (!usuario_id || !publicacion_id || !contenido) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO Comentarios (publicacion_id, usuario_id, contenido) VALUES (?, ?, ?)',
      [publicacion_id, usuario_id, contenido]
    );

    const [userRows] = await pool.query(
      'SELECT nombre FROM Usuarios WHERE usuario_id = ?', [usuario_id]
    );
    const nombreQueComento = userRows[0]?.nombre || 'Alguien';

    const [rows] = await pool.query(
      'SELECT usuario_id, titulo FROM Publicaciones WHERE publicacion_id = ?', [publicacion_id]
    );

    if (rows.length > 0 && rows[0].usuario_id !== parseInt(usuario_id)) {
      const tituloPost = rows[0].titulo || 'sin título';
      const mensaje = `${nombreQueComento} comentó en tu publicación "${tituloPost}": "${contenido.substring(0, 50)}${contenido.length > 50 ? '...' : ''}"`;
      
      // Notificación interna
      await pool.query(
        'INSERT INTO Notificaciones (usuario_id, tipo, mensaje) VALUES (?, ?, ?)',
        [rows[0].usuario_id, 'comentario', mensaje]
      );

      // Notificación por correo
      const [duenioRows] = await pool.query(
        'SELECT nombre, email FROM Usuarios WHERE usuario_id = ?', [rows[0].usuario_id]
      );
      if (duenioRows[0]?.email) {
        await notificarComentario({
          toEmail: duenioRows[0].email,
          toNombre: duenioRows[0].nombre,
          autorNombre: nombreQueComento,
          contenidoComentario: contenido.substring(0, 100),
          tituloPost,
        });
      }
    }

    return NextResponse.json({ success: true, comentario_id: result.insertId });
  } catch (error) {
    console.error("Error en API Comentarios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const uid = searchParams.get('uid');
  try {
    await pool.query('DELETE FROM LikesComentario WHERE comentario_id = ?', [id]);
    const [res] = await pool.query('DELETE FROM Comentarios WHERE comentario_id = ? AND usuario_id = ?', [id, uid]);
    return NextResponse.json({ success: res.affectedRows > 0 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { comentario_id, usuario_id, contenido } = await request.json();
    if (!comentario_id || !usuario_id || !contenido) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }
    const [res] = await pool.query(
      'UPDATE Comentarios SET contenido = ? WHERE comentario_id = ? AND usuario_id = ?',
      [contenido, comentario_id, usuario_id]
    );
    if (res.affectedRows === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}