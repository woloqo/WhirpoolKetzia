"use client";
import Fuse from 'fuse.js';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, BookOpen, ChevronRight, Loader2, ShieldCheck, 
  Trash2, Users, CheckCircle, BarChart3, TrendingUp, 
  UserCircle, FileText, ExternalLink, HelpCircle, Search, Tag, Edit3, X, Check
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/Button';
import { SectionCard } from '@/components/SectionCard';
import { ResourceItem } from '@/components/ResourceItem';
import { PageHeader, Title, Text } from '@/components/Typography';

export default function AdminDashboard() {
  const [cursos, setCursos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [categorias, setCategorias] = useState([]); // Nuevo: Estado para categorías
  const [selectedAlumno, setSelectedAlumno] = useState('global');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rolId, setRolId] = useState(null);
  const [stats, setStats] = useState({
    totalCursos: 0, totalAlumnos: 0, tasaCompletado: 0, promedioQuiz: 0
  });

  // Estados para creación/edición de categorías
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [editandoCatId, setEditandoCatId] = useState(null);
  const [editandoCatNombre, setEditandoCatNombre] = useState('');

  // Estados de búsqueda
  const [searchCursos, setSearchCursos] = useState('');
  const [searchMateriales, setSearchMateriales] = useState('');
  const [searchExamenes, setSearchExamenes] = useState('');

  // Buscadores Fuse.js
  const cursosFiltrados = searchCursos.trim() === '' ? cursos : new Fuse(cursos, {
    keys: ['titulo', 'descripcion', 'nombre_creador', 'categorias'],
    threshold: 0.4,
    ignoreLocation: true,
  }).search(searchCursos).map(r => r.item);

  const materialesFiltrados = searchMateriales.trim() === '' ? materiales : new Fuse(materiales, {
    keys: ['nombre_archivo', 'tipo_archivo'],
    threshold: 0.4,
    ignoreLocation: true,
  }).search(searchMateriales).map(r => r.item);

  const examenesFiltrados = searchExamenes.trim() === '' ? examenes : new Fuse(examenes, {
    keys: ['titulo'],
    threshold: 0.4,
    ignoreLocation: true,
  }).search(searchExamenes).map(r => r.item);

  const router = useRouter();

  const cargarDatos = async (alumnoId = 'global', isInitial = false) => {
    if (!isInitial) setIsUpdating(true);
    try {
      if (isInitial) {
        const [resCursos, resMateriales, resAlumnos, resExamenes, resCategorias] = await Promise.all([
            fetch('/api/admin/dashboard'), fetch('/api/admin/archivos'),
            fetch('/api/admin/usuarios'), fetch('/api/admin/quizzes'),
            fetch('/api/admin/categorias') // Cargamos categorías
        ]);
        setCursos(await resCursos.json());
        setMateriales(await resMateriales.json());
        setAlumnos(await resAlumnos.json());
        setExamenes(await resExamenes.json());
        setCategorias(await resCategorias.json());
      }
      const resStats = await fetch(alumnoId === 'global' ? '/api/admin/stats' : `/api/admin/stats?usuario_id=${alumnoId}`);
      if (resStats.ok) setStats(await resStats.json());
    } catch (err) { console.error(err); } 
    finally {
      if (isInitial) setLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const rol = localStorage.getItem('rol_id');
    if (rol !== '1' && rol !== '30001') return router.push('/');
    setRolId(Number(rol));
    cargarDatos('global', true);
  }, [router]);

  // --- FUNCIONES CATEGORÍAS ---
  const agregarCategoria = async () => {
    if (!nuevaCatNombre.trim()) return;
    const res = await fetch('/api/admin/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevaCatNombre })
    });
    if (res.ok) {
      const nueva = await res.json();
      setCategorias([...categorias, nueva]);
      setNuevaCatNombre('');
    }
  };

  const eliminarCategoria = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar la categoría "${nombre}"? Los cursos perderán esta etiqueta.`)) return;
    const res = await fetch(`/api/admin/categorias?id=${id}`, { method: 'DELETE' });
    if (res.ok) setCategorias(categorias.filter(c => c.categoria_id !== id));
  };

  const actualizarCategoria = async (id) => {
    if (!editandoCatNombre.trim()) return;
    const res = await fetch(`/api/admin/categorias`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nombre: editandoCatNombre })
    });
    if (res.ok) {
      setCategorias(categorias.map(c => c.categoria_id === id ? { ...c, nombre: editandoCatNombre } : c));
      setEditandoCatId(null);
    }
  };

  // --- FUNCIONES ELIMINAR OTROS ---
  const eliminarCurso = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar curso "${titulo}"? Esta acción borrará inscripciones relacionadas.`)) return;
    const res = await fetch(`/api/admin/cursos/${id}`, { method: 'DELETE' });
    if (res.ok) setCursos(cursos.filter(c => c.curso_id !== id));
  };

  const eliminarMaterial = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar material "${titulo}"? Se quitará de todos los cursos.`)) return;
    const res = await fetch(`/api/admin/archivos?id=${id}`, { method: 'DELETE' });
    if (res.ok) setMateriales(materiales.filter(m => m.archivo_id !== id));
  };

  const eliminarExamen = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar examen "${titulo}"? Se perderán las calificaciones de este quiz.`)) return;
    const res = await fetch(`/api/admin/quizzes?id=${id}`, { method: 'DELETE' });
    if (res.ok) setExamenes(examenes.filter(ex => ex.quiz_id !== id));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-[1800px] mx-auto p-6 lg:p-10 font-sans">
      <PageHeader title="Panel de Control" subtitle="Gestión de Capacitación Whirlpool" icon={ShieldCheck} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-10">
          
          {/* CURSOS */}
          <SectionCard 
            title="Catálogo Global" 
            count={cursosFiltrados.length} 
            action={<Button href="/admin/nuevo-curso" icon={Plus}>Crear Curso</Button>}
          >
            <div className="px-4 pt-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, creador o múltiples categorías..."
                  value={searchCursos}
                  onChange={(e) => setSearchCursos(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4"><Text variant="muted">Curso</Text></th>
                    <th className="px-6 py-4"><Text variant="muted">Categorías</Text></th>
                    <th className="px-6 py-4"><Text variant="muted">Descripción</Text></th>
                    <th className="px-6 py-4 text-right"><Text variant="muted">Acciones</Text></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cursosFiltrados.map((curso) => (
                    <tr key={curso.curso_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                            <img src={curso.imagenSrc || '/fallback.jpg'} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="min-w-0">
                            <Text className="font-bold truncate">{curso.titulo}</Text>
                            <Text variant="muted" className="text-[10px] font-black tracking-tighter uppercase">Por: {curso.nombre_creador || 'SISTEMA'}</Text>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                          {curso.categorias ? curso.categorias.split(', ').map((cat, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black uppercase border border-blue-100/50">
                              <Tag size={8} />
                              {cat}
                            </span>
                          )) : <span className="text-[9px] text-slate-300 italic font-bold">Sin categorías</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Text variant="description" className="line-clamp-2 max-w-xs text-xs">{curso.descripcionCorta || curso.descripcion}</Text>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button href={`/admin/gestionar/${curso.curso_id}`} variant="ghost" className="h-8 text-[10px] font-black uppercase">Alumnos</Button>
                          <Button href={`/admin/editar-curso/${curso.curso_id}`} variant="ghost" className="h-8 text-[10px] font-black uppercase">Editar</Button>
                          {rolId === 1 && (
                            <button onClick={() => eliminarCurso(curso.curso_id, curso.titulo)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* MATERIALES */}
          <SectionCard title="Biblioteca de Materiales" count={materialesFiltrados.length} action={rolId === 1 && <Button href="/admin/nuevo-material" variant="dark" icon={Plus}>Nuevo Material</Button>}>
            {/* Buscador materiales similar... */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {materialesFiltrados.map((m) => (
                <ResourceItem key={m.archivo_id} title={m.nombre_archivo} subtitle={m.tipo_archivo || 'Documento'} icon={FileText} action={<div className="flex items-center gap-1">{rolId === 1 && <button onClick={() => eliminarMaterial(m.archivo_id, m.nombre_archivo)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>}<a href={m.url_archivo} target="_blank" className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><ExternalLink size={18} /></a></div>} />
              ))}
            </div>
          </SectionCard>

          {/* EXÁMENES */}
          <SectionCard title="Exámenes Disponibles" count={examenesFiltrados.length} action={rolId === 1 && <Button href="/admin/nuevo-examen" className="bg-purple-600 hover:bg-purple-700 shadow-purple-100" icon={Plus}>Crear Examen</Button>}>
            {/* Buscador examenes similar... */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {examenesFiltrados.map((ex) => (
                <ResourceItem key={ex.quiz_id} variant="purple" title={ex.titulo} subtitle={`${ex.total_preguntas || 0} Preguntas`} icon={HelpCircle} action={<div className="flex items-center gap-1">{rolId === 1 && <button onClick={() => eliminarExamen(ex.quiz_id, ex.titulo)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>}<Link href={`/admin/editar-examen/${ex.quiz_id}`} className="p-2 text-slate-300 hover:text-purple-600 transition-colors"><ChevronRight size={18} /></Link></div>} />
              ))}
            </div>
          </SectionCard>

          {/* NUEVA SECCIÓN: GESTIÓN DE CATEGORÍAS */}
          <SectionCard title="Gestión de Categorías" count={categorias.length}>
            <div className="p-6">
              {/* Input para agregar nueva */}
              <div className="flex gap-3 mb-8">
                <div className="relative flex-1">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    placeholder="Nombre de nueva categoría..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                    value={nuevaCatNombre}
                    onChange={(e) => setNuevaCatNombre(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && agregarCategoria()}
                  />
                </div>
                <Button onClick={agregarCategoria} variant="dark" icon={Plus} className="rounded-2xl px-6">Agregar</Button>
              </div>

              {/* Lista de categorías */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorias.map((cat) => (
                  <div key={cat.categoria_id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Tag size={14} />
                      </div>
                      
                      {editandoCatId === cat.categoria_id ? (
                        <input 
                          autoFocus
                          className="flex-1 bg-slate-50 border-b border-blue-500 outline-none text-sm font-bold px-1"
                          value={editandoCatNombre}
                          onChange={(e) => setEditandoCatNombre(e.target.value)}
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-700 truncate">{cat.nombre}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      {editandoCatId === cat.categoria_id ? (
                        <>
                          <button onClick={() => actualizarCategoria(cat.categoria_id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditandoCatId(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => { setEditandoCatId(cat.categoria_id); setEditandoCatNombre(cat.nombre); }}
                            className="p-1.5 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => eliminarCategoria(cat.categoria_id, cat.nombre)}
                            className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* STATS ASIDE */}
        <aside className="xl:col-span-4 h-full overflow-y-auto pb-10">
          <SectionCard title="Estadísticas">
            <div className={`p-6 space-y-6 transition-all duration-300 ${isUpdating ? 'opacity-50 blur-[1px] pointer-events-none' : 'opacity-100'}`}>

              {/* Selector de alumno */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                  <UserCircle size={14} className="text-blue-500" /> Seleccionar Alumno
                </label>
                <select
                  value={selectedAlumno}
                  onChange={(e) => { setSelectedAlumno(e.target.value); cargarDatos(e.target.value, false); }}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-700 cursor-pointer transition-all appearance-none"
                >
                  <option value="global">Vista Global (Todos)</option>
                  {alumnos.map(alumno => <option key={alumno.value} value={alumno.value}>{alumno.label}</option>)}
                </select>
              </div>

              {selectedAlumno === 'global' ? (
                /* ── VISTA GLOBAL ── */
                <>
                  <Title className="justify-between">
                    Rendimiento Global <TrendingUp size={20} className="text-blue-600" />
                  </Title>
                  <div className="grid grid-cols-1 gap-4">
                    <StatCard icon={<BookOpen size={20} className="text-blue-600"/>} label="Cursos Totales" value={cursos.length} color="bg-blue-50" />
                    <StatCard icon={<Users size={20} className="text-purple-600"/>} label="Alumnos Activos" value={stats.totalAlumnos} color="bg-purple-50" />
                    <StatCard icon={<CheckCircle size={20} className="text-green-600"/>} label="Tasa de Finalización" value={`${stats.tasaCompletado}%`} color="bg-green-50" progress={stats.tasaCompletado} />
                    <StatCard icon={<BarChart3 size={20} className="text-orange-600"/>} label="Promedio Quiz" value={`${stats.promedioQuiz} pts`} color="bg-orange-50" />
                  </div>
                </>
              ) : (
                /* ── VISTA INDIVIDUAL ── */
                <>
                  {/* Tarjeta de perfil del alumno */}
                  <div className="bg-slate-50 rounded-3xl p-5 flex items-center gap-4 border border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                      <UserCircle size={26} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 truncate">{stats.nombre}</p>
                      <p className="text-xs text-slate-400 font-medium truncate">{stats.correo || '—'}</p>
                    </div>
                  </div>

                  <Title className="justify-between">
                    Rendimiento Individual <TrendingUp size={20} className="text-blue-600" />
                  </Title>

                  <div className="grid grid-cols-1 gap-4">
                    <StatCard icon={<BookOpen size={20} className="text-blue-600"/>} label="Cursos Inscritos" value={stats.totalCursos} color="bg-blue-50" />
                    <StatCard icon={<CheckCircle size={20} className="text-green-600"/>} label="Cursos Terminados" value={stats.cursosTerminados ?? '—'} color="bg-green-50" progress={stats.tasaCompletado} />
                    <StatCard icon={<BarChart3 size={20} className="text-orange-600"/>} label="Promedio Quiz" value={stats.promedioQuiz ? `${stats.promedioQuiz} pts` : '—'} color="bg-orange-50" />
                  </div>

                  {/* Detalles extra */}
                  <div className="bg-slate-50 rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Intentos de Quiz</span>
                      <span className="font-black text-slate-700">{stats.totalIntentos ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mejor Puntaje</span>
                      <span className="font-black text-slate-700">{stats.mejorPuntaje ? `${stats.mejorPuntaje} pts` : '—'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, progress }) {
  return (
    <div className="p-5 rounded-3xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>{icon}</div>
        <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
      <div className="flex items-center justify-between">
        <Text variant="muted">{label}</Text>
        {progress !== undefined && <span className="text-[10px] font-black text-green-600">{progress}%</span>}
      </div>
      {progress !== undefined && (
        <div className="w-full bg-slate-200 h-1 mt-3 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}