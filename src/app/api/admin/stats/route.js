import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const { error } = await requireAdmin();
  if (error) return error; 

  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get('usuario_id');

  try {
    if (usuarioId) {
      const [
        [infoUsuario],
        [cursosInscritos],
        [completacionesStats],
        [quizStats],
      ] = await Promise.all([
        pool.query('SELECT nombre, email FROM Usuarios WHERE usuario_id = ?', [usuarioId]),
        pool.query('SELECT COUNT(*) as total FROM Inscripciones WHERE usuario_id = ?', [usuarioId]),
        pool.query(`
          SELECT
            COUNT(i.inscripcion_id) as inscritos,
            COUNT(c.completacion_id) as terminados,
            ROUND((COUNT(c.completacion_id) / NULLIF(COUNT(i.inscripcion_id), 0)) * 100) as tasa
          FROM Inscripciones i
          LEFT JOIN Completaciones c ON i.inscripcion_id = c.inscripcion_id
          WHERE i.usuario_id = ?
        `, [usuarioId]),
        pool.query(`
          SELECT
            ROUND(AVG(calificacion)) as promedio,
            COUNT(*) as totalIntentos,
            MAX(calificacion) as mejorPuntaje
          FROM Intentos_Quiz
          WHERE usuario_id = ?
        `, [usuarioId]),
      ]);

      return NextResponse.json({
        modo: 'individual',
        nombre: infoUsuario[0]?.nombre || '',
        correo: infoUsuario[0]?.email || '',
        totalCursos: cursosInscritos[0]?.total || 0,
        cursosTerminados: completacionesStats[0]?.terminados || 0,
        tasaCompletado: completacionesStats[0]?.tasa || 0,
        promedioQuiz: quizStats[0]?.promedio || 0,
        totalIntentos: quizStats[0]?.totalIntentos || 0,
        mejorPuntaje: quizStats[0]?.mejorPuntaje || 0,
      });
    }

    // ── STATS GLOBALES ────────────────────────────────────────────────────
    const [
      [alumnosCount],
      [cursosCount],
      [completacionesStats],
      [quizStats]
    ] = await Promise.all([
      pool.query('SELECT COUNT(DISTINCT usuario_id) as total FROM Inscripciones'),
      pool.query('SELECT COUNT(*) as total FROM Cursos'),
      pool.query(`
        SELECT 
          COUNT(i.inscripcion_id) as inscritos,
          COUNT(c.completacion_id) as terminados,
          ROUND((COUNT(c.completacion_id) / NULLIF(COUNT(i.inscripcion_id), 0)) * 100) as tasa
        FROM Inscripciones i
        LEFT JOIN Completaciones c ON i.inscripcion_id = c.inscripcion_id
      `),
      pool.query('SELECT ROUND(AVG(calificacion)) as promedio FROM Intentos_Quiz')
    ]);

    return NextResponse.json({
      modo: 'global',
      totalAlumnos: alumnosCount[0].total || 0,
      totalCursos: cursosCount[0].total || 0,
      tasaCompletado: completacionesStats[0].tasa || 0,
      promedioQuiz: quizStats[0].promedio || 0,
    });

  } catch (error) {
    console.error("ERROR EN API STATS:", error);
    return NextResponse.json({ 
      error: "Error al calcular métricas",
      details: error.message 
    }, { status: 500 });
  }
}