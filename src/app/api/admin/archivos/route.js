import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // CORRECCIÓN: Ahora consultamos la biblioteca global 'Archivos'
    // Traemos el ID para la relación y el nombre para mostrarlo en la lista
    const [rows] = await pool.query(`
      SELECT 
        archivo_id, 
        nombre_archivo, 
        tipo_archivo 
      FROM Archivos 
      ORDER BY nombre_archivo ASC
    `);
    
    // Si rows es undefined o null, mandamos array vacío para evitar errores de .map() o .filter()
    return NextResponse.json(rows || []);

  } catch (error) {
    console.error("Error SQL en Biblioteca Admin:", error);
    // Mandamos array vacío en caso de error para que el frontend no "explote"
    return NextResponse.json([], { status: 500 }); 
  }
}