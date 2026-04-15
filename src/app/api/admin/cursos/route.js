import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

const handleUploadImage = async (file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`; // Nombre aleatorio para evitar duplicados
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from('portadas') // El nombre que pusiste en el paso 1
    .upload(filePath, file);

  if (error) throw error;

  // Obtener la URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('portadas')
    .getPublicUrl(filePath);

  return publicUrl;
};

export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const { titulo, descripcion, descripcionCorta, imagenSrc, archivosSeleccionados, quizzesSeleccionados, creado_por, alumnosSeleccionados } = await request.json();

    if (!titulo || !creado_por) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    await connection.beginTransaction();

    // 1. Insertar el curso
    const [cursoResult] = await connection.query(
      `INSERT INTO Cursos (titulo, descripcion, descripcionCorta, imagenSrc, creado_por) VALUES (?, ?, ?, ?, ?)`,
      [titulo, descripcion, descripcionCorta, imagenSrc, creado_por]
    );
    const nuevoCursoId = cursoResult.insertId;

    // 2. Vincular ARCHIVOS
    if (archivosSeleccionados?.length > 0) {
      const valoresArchivos = archivosSeleccionados.map((id, index) => [nuevoCursoId, id, index + 1]);
      await connection.query(
        `INSERT INTO Archivos_Curso (curso_id, archivo_id, orden) VALUES ?`,
        [valoresArchivos]
      );
    }

    // 3. Vincular QUIZZES
    if (quizzesSeleccionados?.length > 0) {
      const offset = archivosSeleccionados?.length || 0;
      const valoresQuizzes = quizzesSeleccionados.map((id, index) => [nuevoCursoId, id, offset + index + 1]);
      await connection.query(
        `INSERT INTO Quiz_Curso (curso_id, quiz_id, orden) VALUES ?`,
        [valoresQuizzes]
      );
    }

    // 4. Inscribir ALUMNOS
    if (alumnosSeleccionados?.length > 0) {
      const valoresAlumnos = alumnosSeleccionados.map(usuario_id => [usuario_id, nuevoCursoId]);
      await connection.query(
        `INSERT INTO Inscripciones (usuario_id, curso_id) VALUES ?`,
        [valoresAlumnos]
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true, curso_id: nuevoCursoId }, { status: 201 });

  } catch (error) {
    await connection.rollback();
    console.error("ERROR AL CREAR CURSO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}