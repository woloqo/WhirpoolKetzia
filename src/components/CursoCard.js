import { PlayCircle, CheckCircle2 } from 'lucide-react';

export default function CursoCard({ titulo, modulo, completado }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wider">
            {modulo}
          </span>
          {completado && <CheckCircle2 size={18} className="text-emerald-500" />}
        </div>

        <div className="p-1">
            <img src="/imagenModulo0.png" 
            alt="Curso" 
            className="w-full h-full rounded-md object-cover border-1 border-slate-100 shadow-inner" />
        </div>

        <h3 className="font-bold text-slate-800 leading-tight mb-4">
          {titulo}
        </h3>
      </div>
      
      <button className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
        <PlayCircle size={18} />
        Continuar
      </button>
    </div>
  );
}