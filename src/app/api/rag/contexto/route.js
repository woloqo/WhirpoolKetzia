// src/app/api/rag/contexto/route.js

import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const usuario_id = searchParams.get('usuario_id');

  if (!usuario_id) {
    return NextResponse.json({ error: 'Falta usuario_id' }, { status: 400 });
  }

  try {
    // 1. DATOS DEL USUARIO
    const [usuarioRows] = await pool.query(
      `SELECT nombre, alias, email, racha_actual, mejor_racha FROM Usuarios WHERE usuario_id = ?`,
      [usuario_id]
    );
    const usuario = usuarioRows[0];
    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    // 2. CURSOS CON PROGRESO (solo del usuario)
    const [cursosRows] = await pool.query(
      `SELECT 
        c.curso_id, c.titulo, c.descripcion, c.descripcionCorta,
        (SELECT COUNT(*) FROM Archivos_Curso ac WHERE ac.curso_id = c.curso_id) as total_archivos,
        (SELECT COUNT(*) FROM Archivos_Vistos av WHERE av.usuario_id = ? AND av.curso_id = c.curso_id) as archivos_vistos,
        (SELECT COUNT(*) FROM Quiz_Curso qc WHERE qc.curso_id = c.curso_id) as tiene_quiz,
        (SELECT COUNT(*) FROM Quizzes_Completados qcomp WHERE qcomp.usuario_id = ? AND qcomp.curso_id = c.curso_id) as quiz_aprobado,
        (
          SELECT GROUP_CONCAT(cat.nombre SEPARATOR ', ')
          FROM Curso_Categorias cc JOIN Categorias cat ON cc.categoria_id = cat.categoria_id
          WHERE cc.curso_id = c.curso_id
        ) as categorias
      FROM Inscripciones i
      JOIN Cursos c ON i.curso_id = c.curso_id
      WHERE i.usuario_id = ?`,
      [usuario_id, usuario_id, usuario_id]
    );

    const cursos = cursosRows.map(c => {
      const totalItems = Number(c.total_archivos) + Number(c.tiene_quiz);
      const completados = Number(c.archivos_vistos) + Number(c.quiz_aprobado);
      const porcentaje = totalItems > 0 ? Math.round((completados / totalItems) * 100) : 0;
      return {
        id: c.curso_id,
        titulo: c.titulo,
        descripcion: c.descripcionCorta || c.descripcion,
        categorias: c.categorias || 'Sin categoria',
        porcentaje,
        completado: porcentaje === 100,
        archivosVistos: Number(c.archivos_vistos),
        totalArchivos: Number(c.total_archivos),
        quizAprobado: Number(c.quiz_aprobado) > 0,
        tieneQuiz: Number(c.tiene_quiz) > 0,
      };
    });

    // 3. GEMAS GENERALES (toda la plataforma, con autor)
    const [gemasRows] = await pool.query(
      `SELECT
        g.gema_id,
        ANY_VALUE(g.titulo) AS titulo,
        ANY_VALUE(g.descripcion) AS descripcion,
        ANY_VALUE(g.fecha_creacion) AS fecha_creacion,
        ANY_VALUE(u.nombre) AS autor_nombre,
        ANY_VALUE(u.alias) AS autor_alias,
        ANY_VALUE(g.usuario_id = ?) AS es_mia,
        GROUP_CONCAT(cat.nombre SEPARATOR ', ') AS categorias
      FROM Gemas g
      JOIN Usuarios u ON g.usuario_id = u.usuario_id
      LEFT JOIN Gema_Categorias gc ON g.gema_id = gc.gema_id
      LEFT JOIN Categorias cat ON gc.categoria_id = cat.categoria_id
      GROUP BY g.gema_id
      ORDER BY ANY_VALUE(g.fecha_creacion) DESC
      LIMIT 20`,
      [usuario_id]
    );

    // 4. INTENTOS DE QUIZ (solo del usuario)
    const [quizRows] = await pool.query(
      `SELECT q.titulo, iq.calificacion, iq.fecha_intento,
        qc.curso_id, c.titulo as curso_titulo
      FROM Intentos_Quiz iq
      JOIN Quizzes q ON iq.quiz_id = q.quiz_id
      JOIN Quiz_Curso qc ON q.quiz_id = qc.quiz_id
      JOIN Cursos c ON qc.curso_id = c.curso_id
      WHERE iq.usuario_id = ?
      ORDER BY iq.fecha_intento DESC
      LIMIT 10`,
      [usuario_id]
    );

    // 5. PUBLICACIONES GENERALES (toda la plataforma, con autor)
    const [postsRows] = await pool.query(
      `SELECT p.publicacion_id, p.titulo, p.contenido, p.fecha_publicacion,
        u.nombre AS autor_nombre, u.alias AS autor_alias,
        (p.usuario_id = ?) AS es_mia,
        (SELECT COUNT(*) FROM LikesPublicacion lp WHERE lp.publicacion_id = p.publicacion_id) as likes,
        (SELECT COUNT(*) FROM Comentarios cm WHERE cm.publicacion_id = p.publicacion_id) as comentarios
      FROM Publicaciones p
      JOIN Usuarios u ON p.usuario_id = u.usuario_id
      ORDER BY p.fecha_publicacion DESC
      LIMIT 15`,
      [usuario_id]
    );

    // 6. NOTIFICACIONES NO LEIDAS (solo del usuario)
    const [notifRows] = await pool.query(
      `SELECT tipo, mensaje, fecha FROM Notificaciones
      WHERE usuario_id = ? AND leida = FALSE
      ORDER BY fecha DESC LIMIT 5`,
      [usuario_id]
    );

    const cursosPendientes = cursos.filter(c => !c.completado);
    const cursosCompletados = cursos.filter(c => c.completado);

    const contexto = buildContexto({
      usuario,
      cursosPendientes,
      cursosCompletados,
      gemas: gemasRows,
      intentosQuiz: quizRows,
      publicaciones: postsRows,
      notificaciones: notifRows,
    });

    return NextResponse.json({
      contexto,
      resumen: {
        nombre: usuario.nombre,
        totalCursos: cursos.length,
        cursosPendientes: cursosPendientes.length,
        cursosCompletados: cursosCompletados.length,
        totalGemas: gemasRows.length,
        racha: usuario.racha_actual,
      }
    });

  } catch (error) {
    console.error('Error en RAG contexto:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function authorLabel(row) {
  const nombre = row.autor_alias || row.autor_nombre;
  return row.es_mia ? `${nombre} (yo)` : nombre;
}

function buildContexto({ usuario, cursosPendientes, cursosCompletados, gemas, intentosQuiz, publicaciones, notificaciones }) {
  const lines = [];

  // Perfil
  lines.push(`=== PERFIL DEL USUARIO ===`);
  lines.push(`Nombre: ${usuario.nombre}${usuario.alias ? ` (alias: ${usuario.alias})` : ''}`);
  lines.push(`Racha actual: ${usuario.racha_actual || 0} dia(s) - Mejor racha: ${usuario.mejor_racha || 0} dia(s)`);

  // Cursos pendientes
  lines.push(`\n=== MIS CURSOS EN PROGRESO (${cursosPendientes.length}) ===`);
  if (cursosPendientes.length === 0) {
    lines.push('No tiene cursos pendientes.');
  } else {
    cursosPendientes.forEach(c => {
      lines.push(`- [${c.porcentaje}%] ${c.titulo}`);
      lines.push(`  Archivos vistos: ${c.archivosVistos}/${c.totalArchivos}${c.tieneQuiz ? ` - Quiz: ${c.quizAprobado ? 'aprobado' : 'pendiente'}` : ''}`);
      if (c.descripcion) lines.push(`  Tema: ${c.descripcion}`);
      if (c.categorias) lines.push(`  Categorias: ${c.categorias}`);
    });
  }

  // Cursos completados
  lines.push(`\n=== MIS CURSOS COMPLETADOS (${cursosCompletados.length}) ===`);
  if (cursosCompletados.length === 0) {
    lines.push('Aun no ha completado ningun curso.');
  } else {
    cursosCompletados.forEach(c => {
      lines.push(`- [completado] ${c.titulo}${c.categorias ? ` [${c.categorias}]` : ''}`);
    });
  }

  // Intentos de quiz
  if (intentosQuiz.length > 0) {
    lines.push(`\n=== MIS ULTIMOS INTENTOS DE EVALUACION ===`);
    intentosQuiz.slice(0, 5).forEach(q => {
      const fecha = new Date(q.fecha_intento).toLocaleDateString('es-MX');
      lines.push(`- ${q.titulo} (${q.curso_titulo}): ${q.calificacion}% - ${fecha}`);
    });
  }

  // Gemas generales
  const misGemas = gemas.filter(g => g.es_mia);
  const gemasDeOtros = gemas.filter(g => !g.es_mia);

  lines.push(`\n=== GEMAS EN LA PLATAFORMA (${gemas.length} total) ===`);
  if (gemas.length === 0) {
    lines.push('No hay gemas publicadas en la plataforma.');
  } else {
    if (misGemas.length > 0) {
      lines.push(`Mis gemas (${misGemas.length}):`);
      misGemas.forEach(g => {
        lines.push(`- "${g.titulo}" - por: yo${g.categorias ? ` [${g.categorias}]` : ''}`);
        if (g.descripcion) lines.push(`  ${g.descripcion.substring(0, 120)}${g.descripcion.length > 120 ? '...' : ''}`);
      });
    }
    if (gemasDeOtros.length > 0) {
      lines.push(`Gemas de companeros (${gemasDeOtros.length}):`);
      gemasDeOtros.forEach(g => {
        lines.push(`- "${g.titulo}" - por: ${authorLabel(g)}${g.categorias ? ` [${g.categorias}]` : ''}`);
        if (g.descripcion) lines.push(`  ${g.descripcion.substring(0, 120)}${g.descripcion.length > 120 ? '...' : ''}`);
      });
    }
  }

  // Publicaciones generales
  const misPublicaciones = publicaciones.filter(p => p.es_mia);
  const pubsDeOtros = publicaciones.filter(p => !p.es_mia);

  lines.push(`\n=== PUBLICACIONES EN COMUNIDAD (${publicaciones.length} recientes) ===`);
  if (publicaciones.length === 0) {
    lines.push('No hay publicaciones recientes en la comunidad.');
  } else {
    if (misPublicaciones.length > 0) {
      lines.push(`Mis publicaciones (${misPublicaciones.length}):`);
      misPublicaciones.forEach(p => {
        const texto = p.titulo || p.contenido?.substring(0, 80);
        lines.push(`- "${texto}" - likes: ${p.likes} - comentarios: ${p.comentarios}`);
      });
    }
    if (pubsDeOtros.length > 0) {
      lines.push(`Publicaciones de companeros (${pubsDeOtros.length}):`);
      pubsDeOtros.forEach(p => {
        const texto = p.titulo || p.contenido?.substring(0, 80);
        lines.push(`- "${texto}" - por: ${authorLabel(p)} - likes: ${p.likes} - comentarios: ${p.comentarios}`);
      });
    }
  }

  // Notificaciones pendientes
  if (notificaciones.length > 0) {
    lines.push(`\n=== NOTIFICACIONES PENDIENTES (${notificaciones.length}) ===`);
    notificaciones.forEach(n => lines.push(`- ${n.mensaje}`));
  }

  return lines.join('\n');
}