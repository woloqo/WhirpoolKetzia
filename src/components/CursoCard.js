import { PlayCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CursoCard({ id, titulo, descripcionCurso, imagenSrc, completado }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-all duration-300 h-full">
      <div className="mb-4">
        {/* Contenedor de imagen con altura fija */}
        <div className="w-full h-40 mb-4 overflow-hidden rounded-xl border border-slate-100">
          <img 
            src={imagenSrc || '/fallback-image.jpg'} // Imagen por defecto si la DB está vacía
            alt={titulo} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" 
          />
        </div>

        {/* Header de la tarjeta */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-extrabold text-slate-800 text-lg leading-tight">
            {titulo}
          </h3>
          {completado && <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />}
        </div>

        {/* Descripción con color más suave para mejor contraste */}
        <p className="text-sm text-slate-500 line-clamp-3 mb-6">
          {descripcionCurso}
        </p>
      </div>
      
      <Link 
         href={`/cursos/${id}`} 
         className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-slate-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
       >
         <PlayCircle size={18} />
         Continuar Curso
       </Link>
    </div>
  );
}