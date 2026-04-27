"use client";

import { useEffect, useState, use } from 'react';
import { 
  ArrowLeft, Play, CheckCircle2, Loader2, Lock,
  Users, BookOpen, FileText, Award, Tag, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import Link from 'next/link';

import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/Button';
import { Title, Text, PageHeader } from '@/components/Typography';
import { SectionCard } from '@/components/SectionCard';
import { ResourceItem } from '@/components/ResourceItem';

export default function CursoDetalle(props) {
  const params = use(props.params);
  const id = params.id;

  const [datos, setDatos] = useState({ curso: null, items: [], secciones: [], esCompletado: false, porcentaje: 0 });
  const [loading, setLoading] = useState(true);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({});

  useEffect(() => {
    const fetchDatos = async () => {
      const usuarioId = localStorage.getItem('usuario_id');
      if (!usuarioId) { window.location.href = '/login'; return; }
      try {
        const res = await fetch(`/api/cursos/detalle?curso_id=${id}&usuario_id=${usuarioId}`);
        const data = await res.json();
        setDatos(data);
        // Abrir primera sección por defecto
        if (data.secciones?.length > 0) {
          setSeccionesAbiertas({ [data.secciones[0].seccion_id]: true });
        }
      } catch (error) {
        console.error("Error cargando curso:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-slate-300" size={36} />
        <p className="text-slate-400 text-sm font-medium">Juntando tus materiales...</p>
      </div>
    </div>
  );

  if (!datos.curso) return <div className="p-20 text-center text-slate-500 font-bold">Curso no encontrado</div>;

  const { curso, items, secciones, porcentaje } = datos;
  

  // Calcular si una sección está completada
  const seccionCompletada = (seccion_id) => {
  const itemsSeccion = items.filter(i => String(i.seccion_id) === String(seccion_id));
    if (itemsSeccion.length === 0) return true;
    return itemsSeccion.every(i => i.completado > 0);
  };

  // Calcular si una sección está desbloqueada
  const seccionDesbloqueada = (seccionIndex) => {
    if (seccionIndex === 0) return true;
    // Todas las secciones anteriores deben estar completadas
    for (let i = 0; i < seccionIndex; i++) {
      if (!seccionCompletada(secciones[i].seccion_id)) return false;
    }
    return true;
  };

  // Items sin sección asignada
  const itemsSinSeccion = items.filter(i => !i.seccion_id);

  const toggleSeccion = (seccion_id) => {
    setSeccionesAbiertas(prev => ({ ...prev, [seccion_id]: !prev[seccion_id] }));
  };

  const renderItem = (item, index, bloqueado = false) => {
    const isQuiz = item.tipo === 'quiz';
    const completado = item.completado > 0;

    console.log('SECCIONES:', secciones);
console.log('ITEMS:', items.map(i => ({ titulo: i.titulo, tipo: i.tipo, seccion_id: i.seccion_id })));

    return (
      <div key={`${item.tipo}-${item.id_contenido}`}
        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
          bloqueado ? 'bg-slate-50 border-slate-100 opacity-50' :
          completado ? 'bg-emerald-50/50 border-emerald-100' :
          'bg-white border-slate-100 hover:border-blue-100 hover:shadow-sm'
        }`}
      >
        <div className={`p-2 rounded-xl shrink-0 ${
          bloqueado ? 'bg-slate-100 text-slate-300' :
          isQuiz ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'
        }`}>
          {bloqueado ? <Lock size={16} /> : isQuiz ? <Award size={16} /> : <FileText size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm truncate ${bloqueado ? 'text-slate-400' : 'text-slate-800'}`}>
            {item.titulo}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {isQuiz ? 'Evaluación' : `Lección ${index + 1}`}
          </p>
        </div>
        {bloqueado ? (
          <div className="shrink-0">
            <Lock size={16} className="text-slate-300" />
          </div>
        ) : completado ? (
          <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl shrink-0">
            <CheckCircle2 size={18} />
          </div>
        ) : isQuiz ? (
          <Button href={`/cursos/${id}/quiz/${item.id_contenido}`} variant="dark" className="h-9 px-4 text-xs shadow-none shrink-0">
            Empezar
          </Button>
        ) : (
          <Link href={`/cursos/${id}/visor/${item.id_contenido}`}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shrink-0">
            <Play size={16} fill="currentColor" />
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10 font-sans">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 transition-all font-bold text-xs uppercase tracking-widest group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Panel
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

        {/* COLUMNA IZQUIERDA */}
        <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-10">
          <SectionCard title="Detalles del Curso">
            <div className="p-4 space-y-6">
              <div className="aspect-video w-full overflow-hidden rounded-[1.4rem]">
                <img src={curso.imagenSrc || '/fallback.jpg'} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt={curso.titulo} />
              </div>
              <div className="px-2">
                <PageHeader title={curso.titulo} />
                <Text className="mb-6" variant="description">{curso.descripcion}</Text>

                {/* Categorías */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {curso.categorias ? curso.categorias.split(', ').map((cat, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100/50">
                      <Tag size={10} /> {cat}
                    </span>
                  )) : <span className="text-[10px] text-slate-300 italic font-bold">Sin categorías</span>}
                </div>

                <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100/50 mb-6">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">
                    {curso.nombre_autor?.[0] || 'A'}
                  </div>
                  <div>
                    <Text variant="muted">Instructor Responsable</Text>
                    <p className="font-bold text-slate-700 leading-tight">{curso.nombre_autor}</p>
                  </div>
                </div>

                <ProgressBar porcentaje={porcentaje} />
              </div>
            </div>
          </SectionCard>

          {/* Métricas */}
          <SectionCard variant="dark" className="shadow-2xl shadow-slate-900/20">
            <div className="p-4 space-y-4 relative overflow-hidden">
              <Users className="absolute -right-4 -bottom-4 opacity-10 text-white" size={120} />
              <div className="space-y-4 relative z-10">
                <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4 border border-white/5">
                  <div className="p-2 bg-blue-500/20 rounded-lg shrink-0"><Users size={20} className="text-blue-400" /></div>
                  <div>
                    <p className="text-xl font-black text-white">{(curso?.total_inscritos || 0).toLocaleString()}</p>
                    <Text variant="muted" className="text-slate-400 mt-1">Compañeros Inscritos</Text>
                  </div>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl flex items-center gap-4 border border-white/5">
                  <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0"><CheckCircle2 size={20} className="text-emerald-400" /></div>
                  <div>
                    <p className="text-xl font-black text-white">{(curso?.total_graduados || 0).toLocaleString()}</p>
                    <Text variant="muted" className="text-slate-400 mt-1">Ya han terminado</Text>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </aside>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-8 space-y-6">

          {/* Si el curso tiene secciones */}
          {secciones?.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Layers size={20} className="text-blue-600" /> Contenido del Curso
                <span className="bg-blue-100 text-blue-600 text-xs font-black px-2 py-0.5 rounded-full">{items.length} items</span>
              </h2>

              {secciones.map((seccion, seccionIndex) => {
                const itemsSeccion = items.filter(i => i.seccion_id === seccion.seccion_id);
                const completada = seccionCompletada(seccion.seccion_id);
                const desbloqueada = seccionDesbloqueada(seccionIndex);
                const abierta = seccionesAbiertas[seccion.seccion_id];

                return (
                  <div key={seccion.seccion_id} className={`bg-white rounded-[2rem] border overflow-hidden transition-all ${
                    !desbloqueada ? 'border-slate-100 opacity-70' :
                    completada ? 'border-emerald-200' : 'border-slate-200'
                  }`}>
                    {/* Header de sección */}
                    <button
                      onClick={() => desbloqueada && toggleSeccion(seccion.seccion_id)}
                      disabled={!desbloqueada}
                      className={`w-full flex items-center justify-between p-6 text-left transition-all ${
                        desbloqueada ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          !desbloqueada ? 'bg-slate-100 text-slate-300' :
                          completada ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {!desbloqueada ? <Lock size={18} /> : completada ? <CheckCircle2 size={18} /> : <Layers size={18} />}
                        </div>
                        <div>
                          <p className={`font-black text-base ${!desbloqueada ? 'text-slate-400' : 'text-slate-900'}`}>
                            {seccion.titulo}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {itemsSeccion.length} item{itemsSeccion.length !== 1 ? 's' : ''} · {itemsSeccion.filter(i => i.completado > 0).length} completados
                            {!desbloqueada && ' · Completa la sección anterior para desbloquear'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {completada && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">✓ Completada</span>}
                        {desbloqueada && (abierta ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />)}
                      </div>
                    </button>

                    {/* Contenido de la sección */}
                    {abierta && desbloqueada && (
                      <div className="px-6 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        {itemsSeccion.length === 0 ? (
                          <p className="text-slate-400 text-sm font-medium text-center py-4">Esta sección no tiene contenido</p>
                        ) : itemsSeccion.map((item, index) => renderItem(item, index, false))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Items sin sección (si hay) */}
              {itemsSinSeccion.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <p className="font-black text-slate-700 flex items-center gap-2">
                      <FileText size={18} className="text-slate-400" /> Contenido General
                    </p>
                  </div>
                  <div className="p-6 space-y-3">
                    {itemsSinSeccion.map((item, index) => renderItem(item, index, false))}
                  </div>
                </div>
              )}
            </div>

          ) : (
            // Sin secciones — vista original
            <SectionCard title="Contenido Académico" count={items.length}>
              <div className="flex flex-col gap-3 p-4">
                {items.map((item, index) => renderItem(item, index, false))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}