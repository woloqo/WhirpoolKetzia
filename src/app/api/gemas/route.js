import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireSession, requireOwner } from "@/lib/auth";

const LIMITE_GEMAS = 10;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const usuario_id = searchParams.get('usuario_id');

  if (!usuario_id) return NextResponse.json({ error: 'No ID' }, { status: 400 });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM Gemas WHERE usuario_id = ? ORDER BY fecha_creacion DESC',
      [usuario_id]
    );

    // Cargar categorías de cada gema
    if (rows.length > 0) {
      const gemaIds = rows.map(g => g.gema_id);
      const [categorias] = await pool.query(`
        SELECT gc.gema_id, c.categoria_id, c.nombre
        FROM Gema_Categorias gc
        JOIN Categorias c ON gc.categoria_id = c.categoria_id
        WHERE gc.gema_id IN (?)
      `, [gemaIds]);

      rows.forEach(gema => {
        gema.categorias = categorias.filter(c => c.gema_id === gema.gema_id);
      });
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { error, session } = await requireSession();
    if (error) return error;
    
    const { usuario_id, titulo, descripcion, categorias } = await request.json();

    const ownerCheck = await requireOwner(usuario_id);
    if (ownerCheck.error) return ownerCheck.error;

    if (!usuario_id || !titulo || !descripcion) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const [count] = await pool.query(
      'SELECT COUNT(*) as total FROM Gemas WHERE usuario_id = ?',
      [usuario_id]
    );
    if (count[0].total >= LIMITE_GEMAS) {
      return NextResponse.json({ error: `Límite de ${LIMITE_GEMAS} gemas alcanzado` }, { status: 400 });
    }

    const [result] = await pool.query(
      'INSERT INTO Gemas (usuario_id, titulo, descripcion) VALUES (?, ?, ?)',
      [usuario_id, titulo, descripcion]
    );

    const gema_id = result.insertId;

    // Guardar categorías si hay
    if (categorias?.length > 0) {
      const valores = categorias.map(cat_id => [gema_id, cat_id]);
      await pool.query(
        'INSERT INTO Gema_Categorias (gema_id, categoria_id) VALUES ?',
        [valores]
      );
    }

    return NextResponse.json({ success: true, gema_id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { error, session } = await requireSession();
    if (error) return error;
    
    const { gema_id, usuario_id, titulo, descripcion, categorias } = await request.json();
    
    const ownerCheck = await requireOwner(usuario_id);
    if (ownerCheck.error) return ownerCheck.error;


    if (!gema_id || !usuario_id || !titulo || !descripcion) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    await pool.query(
      'UPDATE Gemas SET titulo = ?, descripcion = ? WHERE gema_id = ? AND usuario_id = ?',
      [titulo, descripcion, gema_id, usuario_id]
    );

    // Actualizar categorías — borrar las viejas y poner las nuevas
    await pool.query('DELETE FROM Gema_Categorias WHERE gema_id = ?', [gema_id]);
    if (categorias?.length > 0) {
      const valores = categorias.map(cat_id => [gema_id, cat_id]);
      await pool.query(
        'INSERT INTO Gema_Categorias (gema_id, categoria_id) VALUES ?',
        [valores]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { error, session } = await requireSession();
    if (error) return error;
    
    const { searchParams } = new URL(request.url);
    const gema_id = searchParams.get('gema_id');
    const usuario_id = searchParams.get('usuario_id');

    const ownerCheck = await requireOwner(usuario_id);
    if (ownerCheck.error) return ownerCheck.error;

    await pool.query(
      'DELETE FROM Gemas WHERE gema_id = ? AND usuario_id = ?',
      [gema_id, usuario_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}