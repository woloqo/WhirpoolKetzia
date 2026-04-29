import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error; 

  try {
    const [rows] = await pool.query(
      'SELECT usuario_id AS value, nombre AS label FROM Usuarios ORDER BY nombre ASC'
    );
    return NextResponse.json(rows || []);
  } catch (error) {
    console.error("ERROR API USUARIOS:", error);
    return NextResponse.json({ error: "Error en DB" }, { status: 500 });
  }
}