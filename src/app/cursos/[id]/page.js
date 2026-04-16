"use client";

import { useEffect, useState, use } from 'react';
import { 
  ArrowLeft, Play, CheckCircle2, Loader2, 
  Users, BookOpen, FileText, Download, Award, ShieldCheck, Tag 
} from 'lucide-react';
import Link from 'next/link';

// Importación de componentes refactorizados
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/Button';
import { Title, Text, PageHeader } from '@/components/Typography';
import { SectionCard } from '@/components/SectionCard';
import { ResourceItem } from '@/components/ResourceItem';

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
  
  if (!datos.curso) return <div className="p-20 text-center text-slate-500 font-bold">Curso no encontrado</div>;

  const { curso, items, porcentaje } = datos;
  const materiales = items.filter(item => item.tipo !== 'quiz');

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10 font-sans">
      {/* Botón Volver */}
      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 transition-all font-bold text-xs uppercase tracking-widest group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Panel
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* COLUMNA IZQUIERDA */}
        <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-10">
          
          <SectionCard title="Detalles del Curso">
            <div className="p-4 space-y-6">
                <div className="aspect-video w-full overflow-hidden rounded-[1.4rem]">
                  <img 
                    src={curso.imagenSrc || '/fallback.jpg'} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                    alt={curso.titulo} 
                  />
                </div>

              <div className="px-2">
                <PageHeader 
                  title={curso.titulo}
                />

                <Text className="mb-8" variant='description'>
                  {curso.descripcion}
                </Text>

                {/* VISUALIZACIÓN DE CATEGORÍAS (TAGS) */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {curso.categorias ? curso.categorias.split(', ').map((cat, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100/50"
                    >
                      <Tag size={10} />
                      {cat}
                    </span>
                  )) : (
                    <span className="text-[10px] text-slate-300 italic font-bold">Sin categorías</span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100/50">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
                      {curso.nombre_autor?.[0] || 'A'}
                    </div>
                    <div>
                      <Text variant="muted">Instructor Responsable</Text>
                      <p className="font-bold text-slate-700 leading-tight">{curso.nombre_autor}</p>
                    </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <ProgressBar porcentaje={porcentaje} />
                </div>

              </div>
            </div>
          </SectionCard>

          {/* Tarjeta de Métricas */}
          <SectionCard 
            variant="dark"
            className="shadow-2xl shadow-slate-900/20"
          >
            <div className="p-4 space-y-4 relative overflow-hidden">
              <Users 
                className="absolute -right-4 -bottom-4 opacity-10 text-white" 
                size={120} 
              />

              <div className="space-y-4 relative z-10">
                <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4 border border-white/5 transition-all hover:bg-white/15">
                  <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                    <Users size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-black leading-none text-white">
                      {(curso?.total_inscritos || 0).toLocaleString()}
                    </p>
                    <Text variant="muted" className="text-slate-400 mt-1">
                      Compañeros Inscritos
                    </Text>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4 border border-white/5 transition-all hover:bg-white/15">
                  <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl font-black leading-none text-white">
                      {(curso?.total_graduados || 0).toLocaleString()}
                    </p>
                    <Text variant="muted" className="text-slate-400 mt-1">
                      Ya han terminado
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

        </aside>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-8 space-y-8">
          
          <SectionCard 
            title="Contenido Académico" 
            count={items.length}
          >
            <div className="flex flex-col gap-3 p-4">
              {items.map((item, index) => {
                const isQuiz = item.tipo === 'quiz';
                const uniqueKey = `${item.tipo}-${item.id_contenido}`;

                return (
                  <ResourceItem
                    key={uniqueKey}
                    title={item.titulo}
                    subtitle={isQuiz ? "Quiz" : `Lección ${index + 1}`}
                    icon={isQuiz ? Award : FileText}
                    variant={isQuiz ? 'yellow' : 'blue'}
                    action={
                      isQuiz ? (
                        item.completado ? (
                          <div className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                            Completado
                          </div>
                        ) : (
                          <Button 
                            href={`/cursos/${id}/quiz/${item.id_contenido}`} 
                            variant="dark" 
                            className="h-10 px-4 text-xs shadow-none"
                          >
                            Empezar Test
                          </Button>
                        )
                      ) : (
                        <Link 
                          href={`/cursos/${id}/visor/${item.id_contenido}`}
                          className={`p-2 rounded-full transition-all ${
                            item.completado 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
                          }`}
                        >
                          {item.completado ? <CheckCircle2 size={22} /> : <Play size={20} fill="currentColor" />}
                        </Link>
                      )
                    }
                  />
                );
              })}
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}