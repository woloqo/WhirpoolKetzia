import { pool } from '@/lib/db';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default async function VisorMaterial(props) {
  const params = await props.params;
  const archivo_id = params.archivo_id;

  try {
    const [rows] = await pool.query(
      'SELECT a.*, c.titulo as curso_titulo FROM Archivos_Curso a JOIN Cursos c ON a.curso_id = c.curso_id WHERE a.archivo_id = ?',
      [archivo_id]
    );
    const archivo = rows[0];

    if (!archivo) return <div className="p-10 text-center">Material no encontrado</div>;

    // TRANSFORMACIÓN DE LA URL DE DRIVE
    // Esto cambia ".../view?usp=sharing" por ".../preview"
    const embedUrl = archivo.url_archivo.replace(/\/view.*/, '/preview');

    return (
      <div className="h-screen flex flex-col bg-slate-900">
        {/* Barra de navegación superior */}
        <div className="p-4 bg-slate-800 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <Link href={`/cursos/${archivo.curso_id}`} className="hover:text-blue-400 transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{archivo.curso_titulo}</p>
              <h1 className="text-lg font-medium">{archivo.nombre_archivo}</h1>
            </div>
          </div>
          <a 
            href={archivo.url_archivo} 
            target="_blank" 
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-all text-sm"
          >
            <ExternalLink size={16} /> Abrir en Drive
          </a>
        </div>

        {/* Contenedor del Iframe */}
        <div className="flex-grow bg-white">
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-none"
            allow="autoplay"
            title={archivo.nombre_archivo}
          ></iframe>
        </div>
      </div>
    );
  } catch (error) {
    console.error(error);
    return <div className="p-10 text-center text-white">Error al cargar el visor</div>;
  }
}