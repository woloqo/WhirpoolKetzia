import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM Categorias ORDER BY nombre ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { nombre } = await request.json();
    if (!nombre?.trim()) return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });
    const [result] = await pool.query('INSERT INTO Categorias (nombre) VALUES (?)', [nombre]);
    return NextResponse.json({ categoria_id: result.insertId, nombre });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, nombre } = await request.json();
    if (!id || !nombre?.trim()) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    await pool.query('UPDATE Categorias SET nombre = ? WHERE categoria_id = ?', [nombre, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    await pool.query('DELETE FROM Categorias WHERE categoria_id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}