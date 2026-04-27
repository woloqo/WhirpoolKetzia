import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { notificarLike } from '@/lib/email';

export async function POST(request) {
  try {
    const { usuario_id, id, tipo } = await request.json();
    const tabla = tipo === 'post' ? 'LikesPublicacion' : 'LikesComentario';
    const columnaId = tipo === 'post' ? 'publicacion_id' : 'comentario_id';

    const [exist] = await pool.query(
      `SELECT * FROM ${tabla} WHERE usuario_id = ? AND ${columnaId} = ?`,
      [usuario_id, id]
    );

    if (exist.length > 0) {
      await pool.query(
        `DELETE FROM ${tabla} WHERE usuario_id = ? AND ${columnaId} = ?`,
        [usuario_id, id]
      );
      return NextResponse.json({ liked: false });
    } else {
      await pool.query(
        `INSERT INTO ${tabla} (usuario_id, ${columnaId}) VALUES (?, ?)`,
        [usuario_id, id]
      );

      const [userRows] = await pool.query(
        'SELECT nombre FROM Usuarios WHERE usuario_id = ?', [usuario_id]
      );
      const nombreQueLikeo = userRows[0]?.nombre || 'Alguien';

      let duenio = null;
      let mensaje = '';
      let tituloPost = '';

      if (tipo === 'post') {
        const [rows] = await pool.query(
          'SELECT usuario_id, titulo FROM Publicaciones WHERE publicacion_id = ?', [id]
        );
        if (rows.length > 0 && rows[0].usuario_id !== parseInt(usuario_id)) {
          duenio = rows[0].usuario_id;
          tituloPost = rows[0].titulo;
          mensaje = `${nombreQueLikeo} dio like a tu publicación "${tituloPost || 'sin título'}"`;
        }
      } else {
        const [rows] = await pool.query(
          `SELECT c.usuario_id, p.titulo FROM Comentarios c 
           JOIN Publicaciones p ON c.publicacion_id = p.publicacion_id 
           WHERE c.comentario_id = ?`, [id]
        );
        if (rows.length > 0 && rows[0].usuario_id !== parseInt(usuario_id)) {
          duenio = rows[0].usuario_id;
          tituloPost = rows[0].titulo;
          mensaje = `${nombreQueLikeo} dio like a tu comentario en "${tituloPost || 'sin título'}"`;
        }
      }

      if (duenio) {
        // Notificación interna
        await pool.query(
          'INSERT INTO Notificaciones (usuario_id, tipo, mensaje) VALUES (?, ?, ?)',
          [duenio, `like_${tipo}`, mensaje]
        );

        

        // Notificación por correo
        const [duenioRows] = await pool.query(
          'SELECT nombre, email FROM Usuarios WHERE usuario_id = ?', [duenio]
        );
        if (duenioRows[0]?.email) {
          await notificarLike({
            toEmail: duenioRows[0].email,
            toNombre: duenioRows[0].nombre,
            autorNombre: nombreQueLikeo,
            tituloPost,
          });
        }
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}