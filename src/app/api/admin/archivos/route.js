import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error; 

  try {
    const [rows] = await pool.query(`
      SELECT archivo_id, nombre_archivo, tipo_archivo, descripcion, url_archivo, fecha_subida
      FROM Archivos 
      ORDER BY fecha_subida DESC
    `);
    return NextResponse.json(rows || []);
  } catch (error) {
    console.error("Error SQL:", error);
    return NextResponse.json([], { status: 500 }); 
  }
}

export async function POST(request) {
  const { error } = await requireAdmin();
  if (error) return error; 
  try {
    const { nombre_archivo, tipo_archivo, descripcion, url_archivo } = await request.json();

    if (!nombre_archivo || !url_archivo) {
      return NextResponse.json(
        { error: 'El nombre y la URL son obligatorios' }, 
        { status: 400 }
      );
    }

    // Usamos NOW() para la fecha_subida para asegurar el registro correcto
    const [result] = await pool.query(
      `INSERT INTO Archivos (nombre_archivo, tipo_archivo, descripcion, url_archivo, fecha_subida) 
       VALUES (?, ?, ?, ?, NOW())`,
      [nombre_archivo, tipo_archivo, descripcion || '', url_archivo]
    );

    return NextResponse.json({ 
      success: true, 
      archivo_id: result.insertId 
    }, { status: 201 });

  } catch (error) {
    console.error("Error MySQL:", error);
    return NextResponse.json(
      { error: "No se pudo registrar en la base de datos. Verifica la conexión." }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const { error } = await requireAdmin();
  if (error) return error; 
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  try {
    // 1. Quitarlo de los cursos donde esté asignado
    await pool.query('DELETE FROM Archivos_Curso WHERE archivo_id = ?', [id]);
    
    // 2. Borrar el registro del archivo
    const [result] = await pool.query('DELETE FROM Archivos WHERE archivo_id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}