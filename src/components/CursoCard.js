import { PlayCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function CursoCard({ id, titulo, descripcionCurso, imagenSrc, completado }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-all duration-300 h-full group">
      <div className="mb-4">
        {/* Contenedor de imagen */}
        <div className="w-full h-40 mb-5 overflow-hidden rounded-[1.5rem] border border-slate-100 relative">
          <img 
            src={imagenSrc || '/fallback-image.jpg'} 
            alt={titulo} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" 
          />
          {/* Badge de completado sobre la imagen (opcional, se ve muy Pro) */}
          {completado && (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
              <CheckCircle2 size={12} /> Completado
            </div>
          )}
        </div>

        {/* Header de la tarjeta */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-extrabold text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">
            {titulo}
          </h3>
        </div>

        {/* Descripción */}
        <p className="text-sm text-slate-500 line-clamp-2 font-medium">
          {descripcionCurso}
        </p>
      </div>
      
      {/* Botón Dinámico */}
      <Link 
        href={`/cursos/${id}`} 
        className={`mt-auto flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black transition-all border-2
          ${completado 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100' 
            : 'bg-slate-50 border-slate-50 text-blue-600 hover:bg-blue-100 hover:border-blue-100'
          }`}
      >
        {completado ? (
          <>
            <CheckCircle2 size={20} />
            <span>Curso Terminado</span>
          </>
        ) : (
          <>
            <PlayCircle size={20} />
            <span>Continuar Curso</span>
          </>
        )}
      </Link>
    </div>
  );
}