import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

// ESTO ES CRÍTICO: Obliga a Next.js a ejecutar la base de datos siempre y no devolver caché viejo
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit')) || 5;
  const offset = parseInt(searchParams.get('offset')) || 0;
  const myId = parseInt(searchParams.get('myId')) || 0;
  const targetUserId = searchParams.get('usuario_id'); // Esto viene como string o null

  try {
    let whereClause = "";
    let queryParams = [myId];

    if (targetUserId && targetUserId !== 'null' && targetUserId !== 'undefined') {
      whereClause = ` WHERE p.usuario_id = ? `;
      queryParams.push(parseInt(targetUserId));
    }

    // Ahora los parámetros para LIMIT y OFFSET van al final correctamente
    queryParams.push(limit, offset);

    const query = `
      SELECT p.*, u.nombre, u.pfp,
      (SELECT COUNT(*) FROM LikesPublicacion WHERE publicacion_id = p.publicacion_id) as totalLikes,
      (SELECT COUNT(*) FROM LikesPublicacion WHERE publicacion_id = p.publicacion_id AND usuario_id = ?) as iLiked,
      g.gema_id as gem_id, g.titulo as gem_titulo, g.descripcion as gem_descripcion
      FROM Publicaciones p 
      LEFT JOIN Usuarios u ON p.usuario_id = u.usuario_id 
      LEFT JOIN Gemas g ON p.gema_id = g.gema_id
      ${whereClause}
      ORDER BY p.fecha_publicacion DESC, p.publicacion_id DESC 
      LIMIT ? OFFSET ?
    `;

    const [posts] = await pool.query(query, queryParams);

    if (!posts || posts.length === 0) return NextResponse.json([]);

    const postIds = posts.map(p => p.publicacion_id);

    const [comentarios] = await pool.query(`
      SELECT c.*, u.nombre, u.pfp,
      (SELECT COUNT(*) FROM LikesComentario WHERE comentario_id = c.comentario_id) as totalLikes,
      (SELECT COUNT(*) FROM LikesComentario WHERE comentario_id = c.comentario_id AND usuario_id = ?) as iLiked
      FROM Comentarios c
      LEFT JOIN Usuarios u ON c.usuario_id = u.usuario_id
      WHERE c.publicacion_id IN (?)
      ORDER BY c.fecha_comentario DESC
    `, [myId, postIds]);

    const [imagenes] = await pool.query(`
      SELECT * FROM Publicaciones_Imagenes 
      WHERE publicacion_id IN (?)
      ORDER BY publicacion_id, orden ASC
    `, [postIds]);

    const data = posts.map(post => ({
      ...post,
      gema: post.gem_id ? {
        gema_id: post.gem_id,
        titulo: post.gem_titulo,
        descripcion: post.gem_descripcion,
      } : null,
      imagenes: imagenes.filter(img => img.publicacion_id === post.publicacion_id),
      comentarios: comentarios.filter(c => c.publicacion_id === post.publicacion_id)
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { usuario_id, titulo, contenido, gema_id } = await request.json();
    const [result] = await pool.query(
      'INSERT INTO Publicaciones (usuario_id, titulo, contenido, gema_id) VALUES (?, ?, ?, ?)',
      [usuario_id, titulo, contenido, gema_id || null]
    );
    return NextResponse.json({ success: true, publicacion_id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { publicacion_id, usuario_id, titulo, contenido } = await request.json();
    const [res] = await pool.query(
      'UPDATE Publicaciones SET titulo = ?, contenido = ? WHERE publicacion_id = ? AND usuario_id = ?',
      [titulo, contenido, publicacion_id, usuario_id]
    );
    return NextResponse.json({ success: res.affectedRows > 0 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const uid = searchParams.get('uid');

  try {
    await pool.query('DELETE FROM LikesPublicacion WHERE publicacion_id = ?', [id]);
    const [res] = await pool.query('DELETE FROM Publicaciones WHERE publicacion_id = ? AND usuario_id = ?', [id, uid]);
    return NextResponse.json({ success: res.affectedRows > 0 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}