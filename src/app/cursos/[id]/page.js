import { pool } from '@/lib/db';
import { FileText, ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

export default async function CursoDetalle(props) {
  // 1. Resolvemos los parámetros de la URL
  const params = await props.params;
  const id = params.id;

  // 2. Consulta con el ID recuperado
  const [cursoRows] = await pool.query('SELECT * FROM Cursos WHERE curso_id = ?', [id]);
  const curso = cursoRows[0];

  if (!curso) {
    return <div className="p-20 text-center font-bold">Curso no encontrado ❌ (ID: {id})</div>;
  }

  try {
    // 2. Traer datos del curso (Usando tu tabla Cursos y curso_id)
    const [cursoRows] = await pool.query('SELECT * FROM Cursos WHERE curso_id = ?', [id]);
    const curso = cursoRows[0];

    // 3. Si el curso no existe, mostramos error
    if (!curso) {
      return (
        <div className="p-20 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Curso no encontrado ❌</h1>
          <Link href="/" className="text-blue-600 hover:underline mt-4 block">
            Volver al inicio
          </Link>
        </div>
      );
    }

    // 4. Traer archivos asociados
    const [archivos] = await pool.query(
      'SELECT * FROM Archivos_Curso WHERE curso_id = ? ORDER BY orden ASC', 
      [id]
    );

    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Botón Volver */}
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors">
            <ArrowLeft size={20} /> Volver al Dashboard
          </Link>

          {/* Header del Curso */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <img 
                src={curso.imagenSrc || '/default.jpg'} 
                className="w-full md:w-64 h-48 object-cover rounded-2xl shadow-md"
                alt={curso.titulo}
              />
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-4">{curso.titulo}</h1>
                <p className="text-slate-600 leading-relaxed">{curso.descripcion}</p>
              </div>
            </div>
          </div>

          {/* Lista de Contenido / Archivos */}
          <h2 className="text-xl font-bold text-slate-800 mb-4">Contenido del Módulo</h2>
          <div className="grid gap-4">
            {archivos.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center">
                <p className="text-slate-400 italic">No hay archivos cargados para este curso todavía.</p>
              </div>
            ) : (
              archivos.map((archivo) => (
                <Link 
                  key={archivo.archivo_id}
                  href={`/cursos/visor/${archivo.archivo_id}`} // Nueva ruta
                  className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 group-hover:text-blue-700">{archivo.nombre_archivo}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">{archivo.tipo_archivo}</p>
                    </div>
                  </div>
                  <Play size={20} className="text-slate-300 group-hover:text-blue-500" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error en CursoDetalle:", error);
    return (
      <div className="p-10 text-red-500 text-center">
        <h2 className="font-bold text-xl">⚠️ Error de sistema</h2>
        <p>Hubo un problema al conectar con la base de datos whirlpoolKetzia.</p>
      </div>
    );
  }
}