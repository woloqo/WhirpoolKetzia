"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  User, BookOpen, CheckCircle, LogOut, Save, X,
  Camera, Loader2, Gem, Plus, Trash2, Pencil, MessageSquare, Heart, Grid, PlayCircle,
  BookCheck, ChevronRight, Tag, Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/Button';
import { ResourceItem } from '@/components/ResourceItem';
import { SectionCard } from '@/components/SectionCard';
import PostViewer from '@/components/PostViewer';

export default function PerfilPublicoPage() {
  const { id } = useParams();
  const router = useRouter();
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const miId = typeof window !== 'undefined' ? localStorage.getItem('usuario_id') : null;
  const [gemas, setGemas] = useState([]);
  const [showGemaForm, setShowGemaForm] = useState(false);

  const [posts, setPosts] = useState([]);
  const [cursos, setCursos] = useState([]);

  const [activeTab, setActiveTab] = useState('publicaciones');
  const [viewingPost, setViewingPost] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [ahora, setAhora] = useState(new Date());

/* ─── TAB BUTTON ─────────────────────────────────────────── */
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex flex-1 md:flex-none items-center justify-center gap-2 py-4 text-[11px] font-black tracking-widest uppercase transition-all relative ${
      active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    {active && (
      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-slate-900 rounded-full" />
    )}
    <Icon size={15} />
    <span className="hidden sm:inline">{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {count}
      </span>
    )}
  </button>
);

/* ─── STAT CHIP ──────────────────────────────────────────── */
const StatChip = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
      <Icon size={13} className="text-slate-500" />
    </div>
    <div>
      <span className="font-black text-slate-900 text-sm">{value} </span>
      <span className="text-slate-400 text-xs font-medium">{label}</span>
    </div>
  </div>
);

/* ─── GEMA CARD ──────────────────────────────────────────── */
const COLORES_GEMA = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-orange-400 to-rose-500',
  'from-pink-400 to-fuchsia-600',
  'from-amber-400 to-orange-500',
];


  /* ── FETCH ────────────────────────────────── */
  const fetchGemas = async (id) => {
    try {
      const res = await fetch(`/api/gemas?usuario_id=${id}`);
      const data = await res.json();
      setGemas(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchPosts = async (id) => {
    try {
      const res = await fetch(`/api/comunidad?usuario_id=${id}&myId=${id}&limit=50`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchCursos = async (id) => {
    try {
      const res = await fetch(`/api/cursos?usuario_id=${id}`);
      const data = await res.json();
      setCursos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchDatos = async () => {
  if (!id) { router.push('/login'); return; }
  setCurrentUserId(localStorage.getItem('usuario_id'));
  try {
    const res = await fetch(`/api/perfil?id=${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setDatos(data);
    fetchGemas(id);
    fetchPosts(id);
    fetchCursos(id);
  } catch (err) {
    console.error('fetchDatos falló:', err);
  } finally {
    setLoading(false);
  }
};

  const fetchActividad = async () => {
  try {
    const res = await fetch(`/api/perfil?id=${id}`);
    const data = await res.json();
    setDatos(prev => ({ ...prev, usuario: data.usuario }));
  } catch (err) { console.error(err); }
};

useEffect(() => { 
  fetchDatos();
  const datosInterval = setInterval(fetchActividad, 60000);
  return () => clearInterval(datosInterval);
}, []);

/* ── LOADING ──────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-slate-300" size={36} />
        <p className="text-slate-400 text-sm font-medium">Cargando perfil...</p>
      </div>
    </div>
  );

  const { usuario, stats } = datos;
  const cursosPendientes = cursos.filter(c => !c.completado);
  const cursosTerminados = cursos.filter(c => c.completado);

  return (
    <div className="bg-white min-h-screen pb-32">

      {/* ── HERO SECTION ───────────────────────────────────── */}
      <div className="relative">
        {/* Franja decorativa superior */}
        <div className="h-32 md:h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(59,130,246,0.4) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, rgba(139,92,246,0.3) 0%, transparent 50%)`
            }}
          />
          {/* Patrón de puntos */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* AVATAR sobre la franja */}
          <div className="relative -mt-16 md:-mt-20 mb-4 flex items-end justify-between">
            <div className="relative group">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-white ring-4 ring-white shadow-xl flex items-center justify-center text-slate-300">
                {usuario.pfp
                  ? <img src={usuario.pfp} className="w-full h-full object-cover" alt="pfp" />
                  : <User size={56} strokeWidth={1.2} />
                }
              </div>
              {/* Badge de rol */}
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md uppercase tracking-wide">
                {usuario.nombre_rol?.split(' ')[0] || 'Usuario'}
              </div>
            </div>

          </div>

          {/* INFO DEL USUARIO */}
          <div className="mb-6">
            
              <h1 className="text-xl md:text-2xl font-black text-slate-900 mb-0.5 tracking-tight">
                {usuario.alias || usuario.nombre}
              </h1>
            
            {usuario.alias && (
              <p className="text-slate-400 text-sm font-medium mb-1">{usuario.nombre}</p>
            )}
            <a
              href={`mailto:${usuario.email}`}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              {usuario.email}
            </a>

            {/* STATS EN LÍNEA */}
<div className="flex flex-wrap gap-6 mt-4">
  <StatChip icon={BookCheck} value={cursosTerminados.length} label="cursos terminados" />
  <StatChip icon={BookOpen} value={cursosPendientes.length} label="en progreso" />
  <StatChip icon={Grid} value={posts.length} label="publicaciones" />
  <StatChip icon={Gem} value={gemas.length} label="gemas" />
</div>

{/* RACHA Y ACTIVIDAD */}
{(() => {
 const formatearActividad = (minutos) => {
  if (minutos === null || minutos === undefined) return { 
    texto: 'Sin actividad reciente', 
    color: 'text-slate-300', 
    bg: 'bg-slate-50 border-slate-200', 
    dot: false 
  };
  const min = Number(minutos);
  if (min < 3) return { texto: 'Activo ahora', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', dot: true };
  if (min < 60) return { texto: `Activo hace ${min} min`, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', dot: false };
  const horas = Math.floor(min / 60);
  if (horas < 24) return { texto: `Activo hace ${horas}h`, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', dot: false };
  const dias = Math.floor(horas / 24);
  if (dias < 7) return { texto: `Activo hace ${dias}d`, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', dot: false };
  return { texto: 'Hace más de una semana', color: 'text-slate-300', bg: 'bg-slate-50 border-slate-200', dot: false };
};
  const actividad = formatearActividad(usuario.minutos_inactivo);
  return (
    <div className="flex flex-wrap gap-3 mt-4">
      {usuario.racha_actual > 0 && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border ${
          usuario.racha_actual >= 7 
            ? 'bg-orange-50 border-orange-200 text-orange-600' 
            : usuario.racha_actual >= 3 
              ? 'bg-amber-50 border-amber-200 text-amber-600'
              : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          🔥 {usuario.racha_actual} día{usuario.racha_actual !== 1 ? 's' : ''} activo{usuario.racha_actual !== 1 ? 's' : ''}
          {usuario.mejor_racha > usuario.racha_actual && (
            <span className="text-slate-300 font-medium ml-1">· mejor: {usuario.mejor_racha}</span>
          )}
        </div>
      )}
      {actividad && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border ${actividad.bg} ${actividad.color}`}>
          {actividad.dot && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
          {!actividad.dot && '🕐'} {actividad.texto}
        </div>
      )}
    </div>
  );
})()}
          </div>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex justify-center md:gap-16 border-t border-b border-slate-200 mb-8 relative -top-[1px]">
          <TabButton
            active={activeTab === 'publicaciones'}
            onClick={() => setActiveTab('publicaciones')}
            icon={Grid}
            label="Publicaciones"
            count={posts.length}
          />
          <TabButton
            active={activeTab === 'cursos'}
            onClick={() => setActiveTab('cursos')}
            icon={PlayCircle}
            label="Cursos"
            count={cursos.length}
          />
          <TabButton
            active={activeTab === 'gemas'}
            onClick={() => setActiveTab('gemas')}
            icon={Gem}
            label="Gemas"
            count={gemas.length}
          />
        </div>

        {/* ── TAB: PUBLICACIONES ─────────────────────────── */}
        {activeTab === 'publicaciones' && (
          <div className="animate-in fade-in duration-300">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <div className="w-20 h-20 rounded-full border-2 border-slate-200 flex items-center justify-center mb-4">
                  <Grid size={30} strokeWidth={1.2} />
                </div>
                <p className="text-slate-500 font-bold text-sm mb-1">Sin publicaciones</p>
                <p className="text-slate-300 text-xs">Comparte algo en la comunidad</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 md:gap-1">
                {posts.map((post, i) => (
                  <button
                    key={post.publicacion_id}
                    onClick={() => setViewingPost(post)}
                    className="aspect-square bg-slate-100 relative group overflow-hidden"
                  >
                    {post.imagenes?.length > 0 ? (
                      <img
                        src={post.imagenes[0].url_imagen}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt=""
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-white">
                        {post.gema ? (
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${COLORES_GEMA[i % COLORES_GEMA.length]} flex items-center justify-center mb-2`}>
                            <Gem size={14} className="text-white" />
                          </div>
                        ) : null}
                        <p className="text-slate-700 text-[10px] font-medium line-clamp-4 text-center leading-relaxed">
                          {post.titulo || post.contenido}
                        </p>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5">
                      <div className="flex items-center gap-1.5 text-white font-black text-sm">
                        <Heart size={18} fill="white" /> {post.totalLikes || 0}
                      </div>
                      <div className="flex items-center gap-1.5 text-white font-black text-sm">
                        <MessageSquare size={18} fill="white" /> {post.comentarios?.length || 0}
                      </div>
                    </div>

                    {/* Badge si tiene gema */}
                    {post.gema && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow">
                        <Gem size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CURSOS ────────────────────────────────── */}
        {activeTab === 'cursos' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

              {/* En progreso */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BookOpen size={14} className="text-blue-600" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">En progreso</h2>
                  <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">{cursosPendientes.length}</span>
                </div>
                {cursosPendientes.length === 0 ? (
                  <p className="text-slate-300 text-sm font-medium py-10 text-center border border-dashed border-slate-200 rounded-2xl">¡Sin cursos pendientes!</p>
                ) : (
                  <div className="space-y-3">
                    {cursosPendientes.map(curso => (
                      <a
                        key={curso.curso_id}
                        href={`/cursos/${curso.curso_id}`}
                        className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all group"
                      >
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          <img src={curso.imagenSrc || '/fallback.jpg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">{curso.titulo}</p>
                          <p className="text-slate-400 text-[10px] font-medium truncate mt-0.5">{curso.descripcionCorta}</p>
                          <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-700"
                              style={{ width: `${curso.porcentaje || 0}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-blue-600 font-black text-xs shrink-0">{curso.porcentaje || 0}%</p>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Completados */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <BookCheck size={14} className="text-emerald-600" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Completados</h2>
                  <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full">{cursosTerminados.length}</span>
                </div>
                {cursosTerminados.length === 0 ? (
                  <p className="text-slate-300 text-sm font-medium py-10 text-center border border-dashed border-slate-200 rounded-2xl">Aún no termina ningún curso ¡Animale a continuar!</p>
                ) : (
                  <div className="space-y-3">
                    {cursosTerminados.map(curso => (
                    <a
                      key={curso.curso_id}
                      href={`/cursos/${curso.curso_id}`}
                      className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl hover:border-emerald-200 hover:shadow-sm transition-all group"
                    >
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img src={curso.imagenSrc || '/fallback.jpg'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 text-xs truncate">{curso.titulo}</p>
                        <p className="text-slate-400 text-[10px] font-medium truncate mt-0.5">{curso.descripcionCorta}</p>
                      </div>
                      <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle size={15} className="text-emerald-600" />
                      </div>
                    </a>
                  ))}
                </div>
                )}
              </div>

            </div>{/* end grid */}
          </div>
        )}

        {/* ── POST VIEWER ────────────────────────────────────── */}
      {viewingPost && (
        <PostViewer
          post={viewingPost}
          currentUserId={currentUserId}
          onClose={() => setViewingPost(null)}
        />
      )}

        {/* ── TAB: GEMAS ─────────────────────────────────── */}
        {activeTab === 'gemas' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs text-slate-400 font-medium">
                {gemas.length}/10 gemas creadas
              </p>
            </div>

            {gemas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
                  <Gem size={28} strokeWidth={1.2} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-bold text-sm mb-1">Sin gemas aún</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gemas.map((gema, i) => (
                  <div
                    key={gema.gema_id}
                    className="group relative bg-white border border-slate-100 rounded-[1.5rem] overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all"
                  >
                    {/* Franja de color */}
                    <div className={`h-2 bg-gradient-to-r ${COLORES_GEMA[i % COLORES_GEMA.length]}`} />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORES_GEMA[i % COLORES_GEMA.length]} flex items-center justify-center shrink-0 shadow-md`}>
                          <Gem size={18} className="text-white" />
                        </div>
                      </div>

                      <h3 className="font-black text-slate-900 text-sm mb-1.5 leading-tight">{gema.titulo}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{gema.descripcion}</p>

                      {gema.categorias?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {gema.categorias.map(cat => (
                            <span key={cat.categoria_id} className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-black rounded-full uppercase tracking-wide border border-slate-100">
                              <Tag size={8} /> {cat.nombre}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-slate-300 font-medium mt-3">
                        {new Date(gema.fecha_creacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

  
    </div>
  );
}