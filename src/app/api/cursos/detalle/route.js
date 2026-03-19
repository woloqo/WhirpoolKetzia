import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const curso_id = searchParams.get('curso_id');
  const usuario_id = searchParams.get('usuario_id');

  try {
    const [archivos] = await pool.query(
      `SELECT a.*, (SELECT COUNT(*) FROM Archivos_Vistos av WHERE av.archivo_id = a.archivo_id AND av.usuario_id = ?) as fue_visto
       FROM Archivos_Curso a WHERE a.curso_id = ? ORDER BY orden ASC`, [usuario_id, curso_id]
    );
    const [completadoRows] = await pool.query(
      'SELECT * FROM Completaciones WHERE usuario_id = ? AND inscripcion_id IN (SELECT inscripcion_id FROM Inscripciones WHERE curso_id = ?)',
      [usuario_id, curso_id]
    );

    const [cursoRows] = await pool.query(`
      SELECT 
        c.*, 
        u.nombre as nombre_autor 
      FROM Cursos c
      LEFT JOIN Usuarios u ON c.creado_por = u.usuario_id
      WHERE c.curso_id = ?
    `, [curso_id]);

     // 2. Obtener el total de archivos que tiene este curso
    const [totalRows] = await pool.query(
      'SELECT COUNT(*) as total FROM Archivos_Curso WHERE curso_id = ?',
      [curso_id]
    );
    const totalArchivos = totalRows[0].total; 

    // 3. Contar cuántos archivos distintos ha visto el usuario en este curso
    const [vistosRows] = await pool.query(`
      SELECT COUNT(DISTINCT av.archivo_id) as vistos
      FROM Archivos_Vistos av
      JOIN Archivos_Curso ac ON av.archivo_id = ac.archivo_id
      WHERE av.usuario_id = ? AND ac.curso_id = ?`,
      [usuario_id, curso_id]
    );
    const archivosVistos = vistosRows[0].vistos;

    let completado = false;

    // 4. Lógica de completado con la nueva tabla que incluye usuario_id
    if (totalArchivos > 0 && archivosVistos >= totalArchivos) {
      await pool.query(`
        INSERT IGNORE INTO Completaciones (usuario_id, inscripcion_id, fecha_completacion)
        SELECT ?, inscripcion_id, NOW() 
        FROM Inscripciones 
        WHERE usuario_id = ? AND curso_id = ?`,
        [usuario_id, usuario_id, curso_id]
      );
      completado = true;
    }

    const porcentaje = totalArchivos > 0 
    ? Math.round((archivosVistos / totalArchivos) * 100) 
    : 0;

    return NextResponse.json({
      curso: cursoRows[0],
      archivos,
      esCompletado: completadoRows.length > 0,
      porcentaje
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}