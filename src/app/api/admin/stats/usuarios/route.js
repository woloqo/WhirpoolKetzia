import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [
      [totalUsuarios],
      [usuariosActivos],
      [topUsuarios],
      [distribucionRoles],
      [usuariosInactivos],
      [actividadComunidad],
    ] = await Promise.all([

      pool.query('SELECT COUNT(*) as total FROM Usuarios'),

      pool.query(`
        SELECT COUNT(DISTINCT usuario_id) as total 
        FROM Inscripciones 
        WHERE fecha_asignacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `),

      pool.query(`
        SELECT u.usuario_id, u.nombre, u.pfp, u.alias,
          COUNT(DISTINCT i.curso_id) as cursos_inscritos,
          COUNT(DISTINCT c.completacion_id) as cursos_terminados,
          ROUND(AVG(iq.calificacion)) as promedio_quiz
        FROM Usuarios u
        LEFT JOIN Inscripciones i ON u.usuario_id = i.usuario_id
        LEFT JOIN Completaciones c ON i.inscripcion_id = c.inscripcion_id
        LEFT JOIN Intentos_Quiz iq ON u.usuario_id = iq.usuario_id
        WHERE u.rol_id = 2
        GROUP BY u.usuario_id
        ORDER BY cursos_terminados DESC, cursos_inscritos DESC
        LIMIT 5
      `),

      pool.query(`
        SELECT r.nombre as rol, COUNT(*) as total
        FROM Usuarios u
        JOIN Roles r ON u.rol_id = r.rol_id
        GROUP BY r.nombre
      `),

      pool.query(`
        SELECT COUNT(*) as total
        FROM Usuarios u
        LEFT JOIN Inscripciones i ON u.usuario_id = i.usuario_id
        WHERE u.rol_id = 2 AND i.inscripcion_id IS NULL
      `),

      pool.query(`
        SELECT 
          COUNT(DISTINCT p.publicacion_id) as total_publicaciones,
          COUNT(DISTINCT c.comentario_id) as total_comentarios,
          COUNT(DISTINCT g.gema_id) as total_gemas
        FROM Usuarios u
        LEFT JOIN Publicaciones p ON u.usuario_id = p.usuario_id
        LEFT JOIN Comentarios c ON u.usuario_id = c.usuario_id
        LEFT JOIN Gemas g ON u.usuario_id = g.usuario_id
      `),
    ]);

    return NextResponse.json({
      totalUsuarios: totalUsuarios[0].total || 0,
      usuariosActivos: usuariosActivos[0].total || 0,
      usuariosInactivos: usuariosInactivos[0].total || 0,
      distribucionRoles: distribucionRoles,
      topUsuarios: topUsuarios,
      comunidad: actividadComunidad[0],
    });

  } catch (error) {
    console.error("ERROR STATS USUARIOS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}