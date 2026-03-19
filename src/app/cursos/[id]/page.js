"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, Play, CheckCircle2, Circle, Loader2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { ProgressBar } from '@/components/ProgressBar';

export default function CursoDetalle(props) {
  const params = use(props.params);
  const id = params.id;

  const [datos, setDatos] = useState({ curso: null, items: [], esCompletado: false, porcentaje: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatos = async () => {
      const usuarioId = localStorage.getItem('usuario_id');
      if (!usuarioId) { window.location.href = '/login'; return; }

      try {
        const res = await fetch(`/api/cursos/detalle?curso_id=${id}&usuario_id=${usuarioId}`);
        const data = await res.json();
        setDatos(data);
      } catch (error) {
        console.error("Error cargando curso:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );
  
  if (!datos.curso) return <div className="p-20 text-center">Curso no encontrado</div>;

  const { curso, items, porcentaje } = datos;

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10">
      {/* Header */}
      <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 transition-colors font-medium text-sm group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
      </Link>

      {/* Hero Card */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-10 overflow-hidden relative">
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <img 
            src={curso.imagenSrc} 
            className="w-full md:w-80 h-56 object-cover rounded-3xl shadow-lg shadow-slate-200" 
            alt={curso.titulo} 
          />
          <div className="flex-1 w-full">
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{curso.titulo}</h1>
            <p className="text-slate-400 text-sm font-bold mb-4">
              Creado por: <span className="text-slate-600">{curso.nombre_autor}</span>
            </p>
            <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-2xl">{curso.descripcion}</p>
            <div className="max-w-xl">
              <ProgressBar porcentaje={porcentaje} />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Contenido Intercalado */}
      <div className="grid gap-6">
        {items.map((item, index) => {
          const isQuiz = item.tipo === 'quiz';
          // Usamos id_contenido que es el nombre que viene de la API corregida
          const uniqueKey = `${item.tipo}-${item.id_contenido}`;
          
          if (isQuiz) {
            return (
              <div key={uniqueKey} className="relative group">
                <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden
                  ${item.completado 
                    ? 'bg-emerald-500 border-emerald-400 text-white' 
                    : 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-200'}`}>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                      <div className={`p-4 rounded-2xl ${item.completado ? 'bg-white/20' : 'bg-blue-600 shadow-lg shadow-blue-500/30'}`}>
                        <HelpCircle size={28} />
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${item.completado ? 'text-white/70' : 'text-blue-400'}`}>
                          Evaluación de conocimientos
                        </p>
                        <h3 className="text-xl font-bold">{item.titulo}</h3>
                      </div>
                    </div>

                    {item.completado ? (
                      <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl font-black text-sm italic">
                        <CheckCircle2 size={18} /> ¡APROBADO!
                      </div>
                    ) : (
                      <Link 
                        href={`/cursos/${id}/quiz/${item.id_contenido}`}
                        className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black hover:bg-blue-500 hover:text-white transition-all text-center"
                      >
                        Comenzar Quiz
                      </Link>
                    )}
                  </div>

                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <HelpCircle size={150} />
                  </div>
                </div>
              </div>
            );
          }

          // Renderizado de Archivo Normal
          return (
            <Link 
              key={uniqueKey}
              href={`/cursos/${id}/visor/${item.id_contenido}`}
              className={`group p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between
                ${item.completado 
                  ? 'bg-emerald-50/20 border-emerald-100/50' 
                  : 'bg-white border-slate-100 hover:border-blue-400 hover:shadow-md'}`}
            >
              <div className="flex items-center gap-5">
                <div className={`transition-colors ${item.completado ? 'text-emerald-500' : 'text-slate-300 group-hover:text-blue-500'}`}>
                  {item.completado ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                </div>
                <div>
                  <p className={`font-bold text-lg ${item.completado ? 'text-slate-400' : 'text-slate-800'}`}>
                    {item.titulo}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Lección {index + 1}</p>
                </div>
              </div>
              
              <div className={`transition-all ${item.completado ? 'text-emerald-200' : 'text-slate-200 group-hover:text-blue-400'}`}>
                <Play size={22} fill="currentColor" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}