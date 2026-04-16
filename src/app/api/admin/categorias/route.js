import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

// Obtener todas las categorías para el listado
export async function GET() {
  try {
    const [rows] = await pool.query('SELECT categoria_id, nombre FROM Categorias ORDER BY nombre ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    return NextResponse.json({ error: "Falla al cargar categorías" }, { status: 500 });
  }
}

// Crear una nueva categoría
export async function POST(request) {
  try {
    const { nombre } = await request.json();

    if (!nombre || nombre.trim() === '') {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }

    // Insertar en la base de datos
    const [result] = await pool.query(
      'INSERT INTO Categorias (nombre) VALUES (?)',
      [nombre.trim()]
    );

    // Retornamos el objeto completo para que el frontend lo agregue al estado inmediatamente
    return NextResponse.json({
      categoria_id: result.insertId,
      nombre: nombre.trim()
    }, { status: 201 });

  } catch (error) {
    // Manejar error de nombre duplicado (si pusiste UNIQUE en SQL)
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "Esta categoría ya existe" }, { status: 409 });
    }

    console.error("Error creando categoría:", error);
    return NextResponse.json({ error: "Error interno al crear la categoría" }, { status: 500 });
  }
}

// DELETE: Eliminar categoría
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  try {
    await pool.query('DELETE FROM Categorias WHERE categoria_id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar nombre
export async function PUT(request) {
  try {
    const { id, nombre } = await request.json();
    await pool.query('UPDATE Categorias SET nombre = ? WHERE categoria_id = ?', [nombre, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}