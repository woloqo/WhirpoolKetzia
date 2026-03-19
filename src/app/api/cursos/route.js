import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const usuario_id = searchParams.get('usuario_id');

  try {
    const [cursos] = await pool.query(`
      SELECT 
        c.*,
        -- 1. Contar archivos totales del curso
        (SELECT COUNT(*) FROM Archivos_Curso ac WHERE ac.curso_id = c.curso_id) as total_archivos,
        
        -- 2. Contar archivos vistos por este usuario EN ESTE CURSO ESPECÍFICO
        (SELECT COUNT(*) FROM Archivos_Vistos av 
         WHERE av.usuario_id = ? AND av.curso_id = c.curso_id) as archivos_vistos,
         
        -- 3. Verificar si tiene Quizzes y si aprobó al menos uno asignado al curso
        (SELECT COUNT(*) FROM Quiz_Curso qc WHERE qc.curso_id = c.curso_id) as tiene_quiz,
        (SELECT COUNT(*) FROM Quizzes_Completados qcomp 
         WHERE qcomp.usuario_id = ? AND qcomp.curso_id = c.curso_id) as quiz_aprobado
         
      FROM Inscripciones i
      JOIN Cursos c ON i.curso_id = c.curso_id
      WHERE i.usuario_id = ?
    `, [usuario_id, usuario_id, usuario_id]);

    // Procesamos el porcentaje en JS para que sea más limpio
    const cursosConProgreso = cursos.map(curso => {
      const totalItems = curso.total_archivos + curso.tiene_quiz;
      const completados = curso.archivos_vistos + curso.quiz_aprobado;
      
      const porcentaje = totalItems > 0 
        ? Math.round((completados / totalItems) * 100) 
        : 0;

      return {
        ...curso,
        porcentaje,
        completado: porcentaje === 100
      };
    });

    return NextResponse.json(cursosConProgreso);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}