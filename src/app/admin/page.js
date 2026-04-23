"use client";
import Fuse from 'fuse.js';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, BookOpen, ChevronRight, Loader2, ShieldCheck, 
  Trash2, Users, CheckCircle, BarChart3, TrendingUp, 
  UserCircle, FileText, ExternalLink, HelpCircle, Search, 
  Tag, Edit3, X, Check, Activity, BookCheck,
  Award, Layers, Eye
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/Button';
import { SectionCard } from '@/components/SectionCard';
import { ResourceItem } from '@/components/ResourceItem';
import { PageHeader, Text } from '@/components/Typography';

const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button onClick={onClick}
    className={`flex flex-1 md:flex-none items-center justify-center gap-2 py-4 text-[11px] font-black tracking-widest uppercase transition-all relative ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
    {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-slate-900 rounded-full" />}
    <Icon size={15} />
    <span className="hidden sm:inline">{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
    )}
  </button>
);

function StatCard({ icon, label, value, color, progress, sub }) {
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
      {sub && <p className="text-[10px] text-slate-300 font-bold mt-1">{sub}</p>}
      {progress !== undefined && (
        <div className="w-full bg-slate-200 h-1 mt-3 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('cursos');
  const [cursos, setCursos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rolId, setRolId] = useState(null);

  const [modoCurso, setModoCurso] = useState('global');
  const [cursoIdSeleccionado, setCursoIdSeleccionado] = useState(null);
  const [statsGlobal, setStatsGlobal] = useState({ totalCursos: 0, totalAlumnos: 0, tasaCompletado: 0, promedioQuiz: 0 });
  const [statsCurso, setStatsCurso] = useState(null);
  const [loadingStatsCurso, setLoadingStatsCurso] = useState(false);

  const [statsUsuarios, setStatsUsuarios] = useState(null);
  const [selectedUsuario, setSelectedUsuario] = useState('global');
  const [statsUsuarioIndividual, setStatsUsuarioIndividual] = useState(null);
  const [loadingStatsUsuario, setLoadingStatsUsuario] = useState(false);

  const [searchCursos, setSearchCursos] = useState('');
  const [searchMateriales, setSearchMateriales] = useState('');
  const [searchExamenes, setSearchExamenes] = useState('');
  const [searchStatsCurso, setSearchStatsCurso] = useState('');
  const [searchStatsUsuario, setSearchStatsUsuario] = useState('');

  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [editandoCatId, setEditandoCatId] = useState(null);
  const [editandoCatNombre, setEditandoCatNombre] = useState('');

  const router = useRouter();

  const filter = (arr, q, keys) => !q.trim() ? arr : new Fuse(arr, { keys, threshold: 0.4, ignoreLocation: true }).search(q).map(r => r.item);
  const cursosFiltrados = filter(cursos, searchCursos, ['titulo', 'descripcion', 'nombre_creador', 'categorias']);
  const materialesFiltrados = filter(materiales, searchMateriales, ['nombre_archivo', 'tipo_archivo']);
  const examenesFiltrados = filter(examenes, searchExamenes, ['titulo']);
  const cursosStatsFiltrados = filter(cursos, searchStatsCurso, ['titulo', 'nombre_creador']);
  const usuariosStatsFiltrados = filter(alumnos, searchStatsUsuario, ['label']);

  const cargarDatos = async () => {
    try {
      const [resCursos, resMateriales, resAlumnos, resExamenes, resCategorias, resStats, resStatsUsuarios] = await Promise.all([
        fetch('/api/admin/dashboard'), fetch('/api/admin/archivos'),
        fetch('/api/admin/usuarios'), fetch('/api/admin/quizzes'),
        fetch('/api/admin/categorias'), fetch('/api/admin/stats'),
        fetch('/api/admin/stats/usuarios'),
      ]);
      setCursos(await resCursos.json());
      setMateriales(await resMateriales.json());
      setAlumnos(await resAlumnos.json());
      setExamenes(await resExamenes.json());
      setCategorias(await resCategorias.json());
      setStatsGlobal(await resStats.json());
      setStatsUsuarios(await resStatsUsuarios.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const rol = localStorage.getItem('rol_id');
    if (rol !== '1' && rol !== '30001') return router.push('/');
    setRolId(Number(rol));
    cargarDatos();
  }, [router]);

  const cargarStatsCurso = async (curso_id) => {
    setLoadingStatsCurso(true);
    try {
      const res = await fetch(`/api/admin/stats/curso?curso_id=${curso_id}`);
      if (res.ok) setStatsCurso(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingStatsCurso(false); }
  };

  const cargarStatsUsuario = async (uid) => {
    setLoadingStatsUsuario(true);
    try {
      const res = await fetch(`/api/admin/stats?usuario_id=${uid}`);
      if (res.ok) setStatsUsuarioIndividual(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingStatsUsuario(false); }
  };

  const agregarCategoria = async () => {
    if (!nuevaCatNombre.trim()) return;
    const res = await fetch('/api/admin/categorias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nuevaCatNombre }) });
    if (res.ok) { const nueva = await res.json(); setCategorias([...categorias, nueva]); setNuevaCatNombre(''); }
  };
  const eliminarCategoria = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    const res = await fetch(`/api/admin/categorias?id=${id}`, { method: 'DELETE' });
    if (res.ok) setCategorias(categorias.filter(c => c.categoria_id !== id));
  };
  const actualizarCategoria = async (id) => {
    if (!editandoCatNombre.trim()) return;
    const res = await fetch('/api/admin/categorias', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, nombre: editandoCatNombre }) });
    if (res.ok) { setCategorias(categorias.map(c => c.categoria_id === id ? { ...c, nombre: editandoCatNombre } : c)); setEditandoCatId(null); }
  };
  const eliminarCurso = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar "${titulo}"?`)) return;
    const res = await fetch(`/api/admin/cursos/${id}`, { method: 'DELETE' });
    if (res.ok) setCursos(cursos.filter(c => c.curso_id !== id));
  };
  const eliminarMaterial = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar "${titulo}"?`)) return;
    const res = await fetch(`/api/admin/archivos?id=${id}`, { method: 'DELETE' });
    if (res.ok) setMateriales(materiales.filter(m => m.archivo_id !== id));
  };
  const eliminarExamen = async (id, titulo) => {
    if (!window.confirm(`¿Eliminar "${titulo}"?`)) return;
    const res = await fetch(`/api/admin/quizzes?id=${id}`, { method: 'DELETE' });
    if (res.ok) setExamenes(examenes.filter(ex => ex.quiz_id !== id));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-slate-300" size={36} />
        <p className="text-slate-400 text-sm font-medium">Cargando panel...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1800px] mx-auto p-6 lg:p-10 font-sans">
      <PageHeader title="Panel de Control" subtitle="Gestión de Capacitación Whirlpool" icon={ShieldCheck} />

      <div className="flex justify-start md:gap-4 border-b border-slate-200 mb-8">
        <TabButton active={activeTab === 'cursos'} onClick={() => setActiveTab('cursos')} icon={BookOpen} label="Cursos" count={cursos.length} />
        <TabButton active={activeTab === 'estadisticas'} onClick={() => setActiveTab('estadisticas')} icon={BarChart3} label="Estadísticas" />
      </div>

      {/* ══════════ TAB: CURSOS ══════════ */}
      {activeTab === 'cursos' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 space-y-10">

            <SectionCard title="Catálogo Global" count={cursosFiltrados.length} action={<Button href="/admin/nuevo-curso" icon={Plus}>Crear Curso</Button>}>
              <div className="px-4 pt-4"><SearchBox value={searchCursos} onChange={setSearchCursos} placeholder="Buscar por nombre, creador o categorías..." /></div>
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-50/50">
                    <th className="px-6 py-4"><Text variant="muted">Curso</Text></th>
                    <th className="px-6 py-4"><Text variant="muted">Categorías</Text></th>
                    <th className="px-6 py-4"><Text variant="muted">Descripción</Text></th>
                    <th className="px-6 py-4 text-right"><Text variant="muted">Acciones</Text></th>
                  </tr></thead>
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
                          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                            {curso.categorias ? curso.categorias.split(', ').map((cat, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black uppercase border border-blue-100/50">
                                <Tag size={8} />{cat}
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
                            {rolId === 1 && <button onClick={() => eliminarCurso(curso.curso_id, curso.titulo)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Biblioteca de Materiales" count={materialesFiltrados.length} action={rolId === 1 && <Button href="/admin/nuevo-material" variant="dark" icon={Plus}>Nuevo Material</Button>}>
              <div className="px-4 pt-4"><SearchBox value={searchMateriales} onChange={setSearchMateriales} placeholder="Buscar material..." /></div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {materialesFiltrados.map((m) => (
                  <ResourceItem key={m.archivo_id} title={m.nombre_archivo} subtitle={m.tipo_archivo || 'Documento'} icon={FileText}
                    action={<div className="flex items-center gap-1">
                      {rolId === 1 && <button onClick={() => eliminarMaterial(m.archivo_id, m.nombre_archivo)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>}
                      <a href={m.url_archivo} target="_blank" className="p-2 text-slate-300 hover:text-blue-600"><ExternalLink size={18} /></a>
                    </div>} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Exámenes Disponibles" count={examenesFiltrados.length} action={rolId === 1 && <Button href="/admin/nuevo-examen" className="bg-purple-600 hover:bg-purple-700 shadow-purple-100" icon={Plus}>Crear Examen</Button>}>
              <div className="px-4 pt-4"><SearchBox value={searchExamenes} onChange={setSearchExamenes} placeholder="Buscar examen..." /></div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {examenesFiltrados.map((ex) => (
                  <ResourceItem key={ex.quiz_id} variant="purple" title={ex.titulo} subtitle={`${ex.total_preguntas || 0} Preguntas`} icon={HelpCircle}
                    action={<div className="flex items-center gap-1">
                      {rolId === 1 && <button onClick={() => eliminarExamen(ex.quiz_id, ex.titulo)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>}
                      <Link href={`/admin/editar-examen/${ex.quiz_id}`} className="p-2 text-slate-300 hover:text-purple-600"><ChevronRight size={18} /></Link>
                    </div>} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Gestión de Categorías" count={categorias.length}>
              <div className="p-6">
                <div className="flex gap-3 mb-8">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" placeholder="Nueva categoría..." value={nuevaCatNombre}
                      onChange={(e) => setNuevaCatNombre(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregarCategoria()}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" />
                  </div>
                  <Button onClick={agregarCategoria} variant="dark" icon={Plus} className="rounded-2xl px-6">Agregar</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorias.map((cat) => (
                    <div key={cat.categoria_id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Tag size={14} /></div>
                        {editandoCatId === cat.categoria_id
                          ? <input autoFocus className="flex-1 bg-slate-50 border-b border-blue-500 outline-none text-sm font-bold px-1" value={editandoCatNombre} onChange={(e) => setEditandoCatNombre(e.target.value)} />
                          : <span className="text-sm font-bold text-slate-700 truncate">{cat.nombre}</span>}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {editandoCatId === cat.categoria_id ? (
                          <>
                            <button onClick={() => actualizarCategoria(cat.categoria_id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check size={16} /></button>
                            <button onClick={() => setEditandoCatId(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"><X size={16} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditandoCatId(cat.categoria_id); setEditandoCatNombre(cat.nombre); }} className="p-1.5 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={16} /></button>
                            <button onClick={() => eliminarCategoria(cat.categoria_id, cat.nombre)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ASIDE CURSOS — stats rápidas globales */}
          <aside className="xl:col-span-4 space-y-6 lg:sticky lg:top-10">
            <SectionCard title="Resumen Rápido">
              <div className="p-6 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={13} className="text-blue-500" /> Vista Global
                </p>
                <StatCard icon={<BookOpen size={20} className="text-blue-600"/>} label="Cursos Totales" value={cursos.length} color="bg-blue-50" />
                <StatCard icon={<Users size={20} className="text-purple-600"/>} label="Alumnos Inscritos" value={statsGlobal.totalAlumnos} color="bg-purple-50" />
                <StatCard icon={<CheckCircle size={20} className="text-green-600"/>} label="Tasa de Finalización" value={`${statsGlobal.tasaCompletado}%`} color="bg-green-50" progress={statsGlobal.tasaCompletado} />
                <StatCard icon={<BarChart3 size={20} className="text-orange-600"/>} label="Promedio en Quizzes" value={`${statsGlobal.promedioQuiz ?? 0} pts`} color="bg-orange-50" />
                <StatCard icon={<FileText size={20} className="text-slate-500"/>} label="Materiales" value={materiales.length} color="bg-slate-100" />
                <StatCard icon={<HelpCircle size={20} className="text-purple-500"/>} label="Exámenes" value={examenes.length} color="bg-purple-50" />
                <div className="pt-3 border-t border-slate-100">
                  <button onClick={() => setActiveTab('estadisticas')}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-500 hover:text-blue-600 text-xs font-black rounded-2xl transition-all">
                    <BarChart3 size={14} /> Ver estadísticas completas
                  </button>
                </div>
              </div>
            </SectionCard>
          </aside>
        </div>
      )}

      {/* ══════════ TAB: ESTADÍSTICAS ══════════ */}
      {activeTab === 'estadisticas' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* ── ESTADÍSTICAS DE CURSOS ── */}
          <SectionCard title="Estadísticas de Cursos">
            <div className="p-6 space-y-5">
              <div className="flex gap-2">
                <button onClick={() => { setModoCurso('global'); setCursoIdSeleccionado(null); setStatsCurso(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${modoCurso === 'global' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:border-slate-400'}`}>
                  Global
                </button>
                <button onClick={() => setModoCurso('curso')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${modoCurso === 'curso' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:border-blue-300'}`}>
                  Por Curso
                </button>
              </div>

              {modoCurso === 'global' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={13} className="text-blue-500" /> Rendimiento Global
                  </p>
                  <StatCard icon={<BookOpen size={20} className="text-blue-600"/>} label="Cursos Totales" value={cursos.length} color="bg-blue-50" />
                  <StatCard icon={<Users size={20} className="text-purple-600"/>} label="Alumnos Inscritos" value={statsGlobal.totalAlumnos} color="bg-purple-50" />
                  <StatCard icon={<CheckCircle size={20} className="text-green-600"/>} label="Tasa de Finalización" value={`${statsGlobal.tasaCompletado}%`} color="bg-green-50" progress={statsGlobal.tasaCompletado} />
                  <StatCard icon={<BarChart3 size={20} className="text-orange-600"/>} label="Promedio en Quizzes" value={`${statsGlobal.promedioQuiz ?? 0} pts`} color="bg-orange-50" />
                  <StatCard icon={<FileText size={20} className="text-slate-500"/>} label="Materiales Disponibles" value={materiales.length} color="bg-slate-100" />
                  <StatCard icon={<HelpCircle size={20} className="text-purple-500"/>} label="Exámenes Disponibles" value={examenes.length} color="bg-purple-50" />
                </div>
              )}

              {modoCurso === 'curso' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={13} className="text-blue-500" /> Selecciona un curso
                  </p>
                  <SearchBox value={searchStatsCurso} onChange={setSearchStatsCurso} placeholder="Buscar curso..." />
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cursosStatsFiltrados.map(c => (
                      <button key={c.curso_id}
                        onClick={() => { setCursoIdSeleccionado(c.curso_id); cargarStatsCurso(c.curso_id); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${cursoIdSeleccionado === c.curso_id ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                          <img src={c.imagenSrc || '/fallback.jpg'} className="w-full h-full object-cover" alt="" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 truncate">{c.titulo}</p>
                      </button>
                    ))}
                  </div>

                  {loadingStatsCurso && <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-400" size={24} /></div>}

                  {statsCurso && !loadingStatsCurso && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="font-black text-slate-900 text-sm">{statsCurso.info?.titulo}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Por {statsCurso.info?.creador}</p>
                      </div>
                      <StatCard icon={<Users size={20} className="text-blue-600"/>} label="Alumnos inscritos" value={statsCurso.inscripciones?.total_inscritos || 0} color="bg-blue-50" sub={`+${statsCurso.inscripciones?.nuevos_mes || 0} este mes`} />
                      <StatCard icon={<CheckCircle size={20} className="text-green-600"/>} label="Tasa de finalización" value={`${statsCurso.inscripciones?.tasa_completacion || 0}%`} color="bg-green-50" progress={statsCurso.inscripciones?.tasa_completacion || 0} />
                      <StatCard icon={<BarChart3 size={20} className="text-orange-600"/>} label="Promedio en quizzes" value={`${statsCurso.quizzes?.promedio || 0} pts`} color="bg-orange-50" sub={`Mejor: ${statsCurso.quizzes?.mejor || 0} · Peor: ${statsCurso.quizzes?.peor || 0} pts`} />
                      <StatCard icon={<Eye size={20} className="text-cyan-600"/>} label="Materiales" value={statsCurso.materiales?.total_materiales || 0} color="bg-cyan-50" sub={`${statsCurso.materiales?.alumnos_con_avance || 0} alumnos con avance`} />

                      {statsCurso.secciones?.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Layers size={12} /> Progreso por sección</p>
                          <div className="space-y-2">
                            {statsCurso.secciones.map(s => (
                              <div key={s.seccion_id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-bold text-slate-700 truncate">{s.titulo}</p>
                                  <span className="text-[10px] font-black text-slate-400">{s.alumnos_con_avance} alumnos</span>
                                </div>
                                <p className="text-[10px] text-slate-400">{s.total_items} items</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {statsCurso.topAlumnos?.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Award size={12} /> Alumnos en este curso</p>
                          <div className="space-y-2">
                            {statsCurso.topAlumnos.map(u => (
                              <Link key={u.usuario_id} href={`/perfil/${u.usuario_id}`}
                                className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                                <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
                                  {u.pfp ? <img src={u.pfp} className="w-full h-full object-cover" alt="" /> : u.nombre?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-600">{u.alias || u.nombre}</p>
                                  <p className="text-[9px] text-slate-400">{u.materiales_vistos} materiales vistos</p>
                                </div>
                                {u.completado ? <CheckCircle size={14} className="text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 shrink-0" />}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          {/* ── ESTADÍSTICAS DE USUARIOS ── */}
          <SectionCard title="Estadísticas de Usuarios">
            <div className="p-6 space-y-5">
              <div className="flex gap-2">
                <button onClick={() => { setSelectedUsuario('global'); setStatsUsuarioIndividual(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${selectedUsuario === 'global' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:border-slate-400'}`}>
                  Global
                </button>
                <button onClick={() => setSelectedUsuario('pick')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${selectedUsuario !== 'global' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:border-blue-300'}`}>
                  Individual
                </button>
              </div>

              {selectedUsuario === 'global' && statsUsuarios && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={13} className="text-blue-500" /> Vista General
                  </p>
                  <StatCard icon={<Users size={20} className="text-blue-600"/>} label="Total de usuarios" value={statsUsuarios.totalUsuarios} color="bg-blue-50" />
                  <StatCard icon={<Activity size={20} className="text-emerald-600"/>} label="Nuevos este mes" value={statsUsuarios.usuariosActivos} color="bg-emerald-50" />
                  <StatCard icon={<BookCheck size={20} className="text-orange-600"/>} label="Sin cursos asignados" value={statsUsuarios.usuariosInactivos} color="bg-orange-50" />

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Distribución por rol</p>
                    <div className="space-y-2">
                      {statsUsuarios.distribucionRoles?.map((rol) => (
                        <div key={rol.rol} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-600">{rol.rol}</span>
                          <span className="text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-100">{rol.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Actividad en Comunidad</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-blue-50 rounded-2xl p-3 text-center border border-blue-100">
                        <p className="text-lg font-black text-blue-600">{statsUsuarios.comunidad?.total_publicaciones || 0}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5">Posts</p>
                      </div>
                      <div className="bg-purple-50 rounded-2xl p-3 text-center border border-purple-100">
                        <p className="text-lg font-black text-purple-600">{statsUsuarios.comunidad?.total_comentarios || 0}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5">Comentarios</p>
                      </div>
                      <div className="bg-emerald-50 rounded-2xl p-3 text-center border border-emerald-100">
                        <p className="text-lg font-black text-emerald-600">{statsUsuarios.comunidad?.total_gemas || 0}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5">Gemas</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Award size={12} /> Top por cursos terminados
                    </p>
                    <div className="space-y-2">
                      {statsUsuarios.topUsuarios?.map((u, i) => (
                        <Link key={u.usuario_id} href={`/perfil/${u.usuario_id}`}
                          className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-all group border border-slate-100 hover:border-blue-200">
                          <span className="text-sm w-5 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                          <div className="w-7 h-7 rounded-xl overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
                            {u.pfp ? <img src={u.pfp} className="w-full h-full object-cover" alt="" /> : u.nombre?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate group-hover:text-blue-600">{u.alias || u.nombre}</p>
                            <p className="text-[9px] text-slate-400">{u.cursos_terminados} terminados · {u.promedio_quiz ?? '—'} pts avg</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedUsuario !== 'global' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <UserCircle size={13} className="text-blue-500" /> Selecciona un usuario
                  </p>
                  <SearchBox value={searchStatsUsuario} onChange={setSearchStatsUsuario} placeholder="Buscar usuario..." />
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {usuariosStatsFiltrados.map(a => (
                      <button key={a.value}
                        onClick={() => { setSelectedUsuario(a.value); cargarStatsUsuario(a.value); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedUsuario === a.value ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs shrink-0">{a.label?.[0]}</div>
                        <p className="text-xs font-bold text-slate-700 truncate">{a.label}</p>
                      </button>
                    ))}
                  </div>

                  {loadingStatsUsuario && <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-400" size={24} /></div>}

                  {statsUsuarioIndividual && !loadingStatsUsuario && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm shrink-0">
                          {statsUsuarioIndividual.nombre?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-sm truncate">{statsUsuarioIndividual.nombre}</p>
                          <p className="text-[10px] text-slate-400 truncate">{statsUsuarioIndividual.correo}</p>
                        </div>
                      </div>
                      <StatCard icon={<BookOpen size={20} className="text-blue-600"/>} label="Cursos inscritos" value={statsUsuarioIndividual.totalCursos} color="bg-blue-50" />
                      <StatCard icon={<CheckCircle size={20} className="text-green-600"/>} label="Cursos terminados" value={statsUsuarioIndividual.cursosTerminados ?? 0} color="bg-green-50" progress={statsUsuarioIndividual.tasaCompletado} />
                      <StatCard icon={<BarChart3 size={20} className="text-orange-600"/>} label="Promedio en quizzes" value={`${statsUsuarioIndividual.promedioQuiz ?? 0} pts`} color="bg-orange-50" />
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Intentos de Quiz</span>
                          <span className="font-black text-slate-700">{statsUsuarioIndividual.totalIntentos ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between px-5 py-3">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mejor Puntaje</span>
                          <span className="font-black text-slate-700">{statsUsuarioIndividual.mejorPuntaje ? `${statsUsuarioIndividual.mejorPuntaje} pts` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between px-5 py-3">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tasa Completación</span>
                          <span className="font-black text-emerald-600">{statsUsuarioIndividual.tasaCompletado ?? 0}%</span>
                        </div>
                      </div>
                      <Link href={`/perfil/${selectedUsuario}`}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-blue-600 transition-all">
                        Ver perfil completo <ChevronRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

        </div>
      )}
    </div>
  );
}