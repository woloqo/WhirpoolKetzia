import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT quiz_id, titulo FROM Quizzes ORDER BY titulo ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}