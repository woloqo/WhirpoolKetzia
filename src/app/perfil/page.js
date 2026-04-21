"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, BookOpen, CheckCircle, LogOut, Save, X,
  Camera, Loader2, Gem, Plus, Trash2, Pencil, MessageSquare, Heart, Grid, PlayCircle,
  BookCheck, ChevronRight, Tag, Star
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { signOut } from 'next-auth/react';

import { Button } from '@/components/Button';
import { ResourceItem } from '@/components/ResourceItem';
import { SectionCard } from '@/components/SectionCard';
import PostViewer from '@/components/PostViewer';

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

export default function PerfilPage() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('publicaciones');

  const [nuevoAlias, setNuevoAlias] = useState('');
  const [previewPfp, setPreviewPfp] = useState(null);
  const [filePfp, setFilePfp] = useState(null);

  const [gemas, setGemas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showGemaForm, setShowGemaForm] = useState(false);
  const [nuevaGema, setNuevaGema] = useState({ titulo: '', descripcion: '' });
  const [savingGema, setSavingGema] = useState(false);
  const [editandoGema, setEditandoGema] = useState(null);

  const [posts, setPosts] = useState([]);
  const [cursos, setCursos] = useState([]);

  // PostViewer
  const [viewingPost, setViewingPost] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);

  const handleLogout = async () => {
    localStorage.clear();
    await signOut({ callbackUrl: '/login' });
  };

  /* ── FETCH ────────────────────────────────── */
  const fetchGemas = async (uid) => {
    try {
      const res = await fetch(`/api/gemas?usuario_id=${uid}`);
      const data = await res.json();
      setGemas(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/categorias');
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchPosts = async (uid) => {
    try {
      const res = await fetch(`/api/comunidad?usuario_id=${uid}&myId=${uid}&limit=50`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchCursos = async (uid) => {
    try {
      const res = await fetch(`/api/cursos?usuario_id=${uid}`);
      const data = await res.json();
      setCursos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchDatos = async () => {
    const uid = localStorage.getItem('usuario_id');
    if (!uid) { router.push('/login'); return; }
    setCurrentUserId(uid);
    try {
      const res = await fetch(`/api/perfil?id=${uid}`);
      const data = await res.json();
      setDatos(data);
      setNuevoAlias(data.usuario.alias || '');
      fetchGemas(uid);
      fetchCategorias();
      fetchPosts(uid);
      fetchCursos(uid);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDatos(); }, []);

  /* ── FOTO DE PERFIL ───────────────────────── */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setFilePfp(file); setPreviewPfp(URL.createObjectURL(file)); }
  };

  const uploadPfp = async (file, userId) => {
    const ext = file.name.split('.').pop();
    const name = `avatar_${userId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('pfps').upload(name, file);
    if (error) throw error;
    return supabase.storage.from('pfps').getPublicUrl(name).data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    const uid = localStorage.getItem('usuario_id');
    try {
      let pfpUrl = datos.usuario.pfp;
      if (filePfp) pfpUrl = await uploadPfp(filePfp, uid);
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: uid, alias: nuevoAlias, pfp: pfpUrl }),
      });
      if (res.ok) { setEditMode(false); setFilePfp(null); await fetchDatos(); }
    } catch { alert('Error al actualizar perfil'); }
    finally { setSaving(false); }
  };

  /* ── GEMAS ────────────────────────────────── */
  const handleCrearGema = async () => {
    if (!nuevaGema.titulo.trim() || !nuevaGema.descripcion.trim()) return;
    setSavingGema(true);
    const uid = localStorage.getItem('usuario_id');
    const res = await fetch('/api/gemas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: uid, ...nuevaGema }),
    });
    if (res.ok) {
      setNuevaGema({ titulo: '', descripcion: '' });
      setShowGemaForm(false);
      fetchGemas(uid);
    }
    setSavingGema(false);
  };

  const handleEditarGema = async () => {
    if (!editandoGema.titulo.trim() || !editandoGema.descripcion.trim()) return;
    setSavingGema(true);
    const userId = localStorage.getItem('usuario_id');
    const categoriasIds = editandoGema.categorias.map(c => c.categoria_id || c);
    const res = await fetch('/api/gemas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        gema_id: editandoGema.gema_id, 
        usuario_id: userId, 
        titulo: editandoGema.titulo, 
        descripcion: editandoGema.descripcion,
        categorias: categoriasIds
      }),
    });
    if (res.ok) { setEditandoGema(null); fetchGemas(userId); }
    setSavingGema(false);
  };

  const handleEliminarGema = async (gema_id) => {
    if (!window.confirm('¿Eliminar esta gema?')) return;
    const userId = localStorage.getItem('usuario_id');
    await fetch(`/api/gemas?gema_id=${gema_id}&usuario_id=${userId}`, { method: 'DELETE' });
    fetchGemas(userId);
  };

    const toggleCategoria = (cat_id, esNueva = true) => {
    if (esNueva) {
      setNuevaGema(prev => ({
        ...prev,
        categorias: prev.categorias.includes(cat_id)
          ? prev.categorias.filter(c => c !== cat_id)
          : [...prev.categorias, cat_id]
      }));
    } else {
      setEditandoGema(prev => ({
        ...prev,
        categorias: prev.categorias.map(c => c.categoria_id || c).includes(cat_id)
          ? prev.categorias.filter(c => (c.categoria_id || c) !== cat_id)
          : [...prev.categorias, { categoria_id: cat_id }]
      }));
    }
  };


  /* ── POSTS ────────────────────────────────── */
  const handlePostUpdated = (updated) => {
    setPosts(prev => prev.map(p => p.publicacion_id === updated.publicacion_id ? updated : p));
    if (viewingPost?.publicacion_id === updated.publicacion_id) setViewingPost(updated);
  };

  const handlePostDeleted = (id) => {
    setPosts(prev => prev.filter(p => p.publicacion_id !== id));
    setViewingPost(null);
  };

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

  const SelectorCategorias = ({ seleccionadas = [], onToggle }) => (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Categorías</p>
      <div className="flex flex-wrap gap-2">
        {categorias.map(cat => {
          // Aseguramos que seleccionadas sea un array antes de hacer map
          const ids = (Array.isArray(seleccionadas) ? seleccionadas : []).map(c => c.categoria_id || c);
          const activa = ids.includes(cat.categoria_id);
          return (
            <button
              key={cat.categoria_id}
              type="button"
              onClick={() => onToggle(cat.categoria_id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                activa ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );


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
                {previewPfp || usuario.pfp
                  ? <img src={previewPfp || usuario.pfp} className="w-full h-full object-cover" alt="pfp" />
                  : <User size={56} strokeWidth={1.2} />
                }
              </div>
              {editMode && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
              {/* Badge de rol */}
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md uppercase tracking-wide">
                {usuario.nombre_rol?.split(' ')[0] || 'Usuario'}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 mb-2">
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Guardar
                  </button>
                  <button
                    onClick={() => { setEditMode(false); setPreviewPfp(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-all"
                  >
                    <X size={13} /> Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <Pencil size={13} /> Editar perfil
                  </button>
                  <button
                    onClick={() => handleLogout()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-400 text-xs font-black rounded-xl hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                  >
                    <LogOut size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* INFO DEL USUARIO */}
          <div className="mb-6">
            {editMode ? (
              <div className="flex items-center gap-3 mb-2">
                <input
                  autoFocus
                  className="text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
                  value={nuevoAlias}
                  onChange={(e) => setNuevoAlias(e.target.value)}
                  placeholder="Tu alias público"
                />
                <p className="text-slate-400 text-xs font-medium">← alias visible para otros</p>
              </div>
            ) : (
              <h1 className="text-xl md:text-2xl font-black text-slate-900 mb-0.5 tracking-tight">
                {usuario.alias || usuario.nombre}
              </h1>
            )}
            {usuario.alias && !editMode && (
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
                  <p className="text-slate-300 text-sm font-medium py-10 text-center border border-dashed border-slate-200 rounded-2xl">Aún no terminas ningún curso</p>
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
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
        />
      )}

        {/* ── TAB: GEMAS ─────────────────────────────────── */}
        
        {/* PESTAÑA: GEMAS */}
        {activeTab === 'gemas' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-end mb-6">
              <button onClick={() => setShowGemaForm(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold text-sm rounded-lg hover:bg-slate-800 transition-colors">
                <Plus size={16} /> Crear Gema
              </button>
            </div>
            
            {gemas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-20 h-20 rounded-full border-2 border-slate-300 flex items-center justify-center mb-4"><Gem size={32} strokeWidth={1.5} /></div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">No hay gemas</h3>
                <p className="text-sm">Comparte tu primer recurso con la comunidad.</p>
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
                        {/* Botón eliminar */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditandoGema({...gema, categorias: gema.categorias || []})} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => handleEliminarGema(gema.gema_id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
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
{/* MODAL: CREAR GEMA */}
      {showGemaForm && (

        
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Gem className="text-blue-500"/> Nueva Gema</h3>
              <button onClick={() => { setShowGemaForm(false); setNuevaGema({ titulo: '', descripcion: '', categorias: [] }); }} className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            <input 
              className="w-full p-3.5 rounded-lg mb-4 border border-slate-200 font-medium text-sm outline-none focus:border-slate-400 bg-slate-50 transition-colors" 
              placeholder="Título de la Gema" 
              value={nuevaGema.titulo} 
              onChange={e => setNuevaGema({...nuevaGema, titulo: e.target.value})} 
              autoFocus
            />
            <textarea 
              className="w-full p-3.5 rounded-lg mb-4 border border-slate-200 text-sm min-h-[100px] outline-none focus:border-slate-400 bg-slate-50 resize-none transition-colors" 
              placeholder="Descripción del recurso..." 
              value={nuevaGema.descripcion} 
              onChange={e => setNuevaGema({...nuevaGema, descripcion: e.target.value})} 
            />
            <SelectorCategorias 
              seleccionadas={nuevaGema.categorias} 
              onToggle={(id) => toggleCategoria(id, true)} 
            />
            <button 
              disabled={savingGema} 
              className="w-full py-3 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition-colors flex justify-center items-center mt-2" 
              onClick={handleCrearGema}
            >
              {savingGema ? <Loader2 size={18} className="animate-spin" /> : "Guardar Gema"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR GEMA */}
      {editandoGema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Gem className="text-blue-500"/> Editar Gema</h3>
              <button onClick={() => setEditandoGema(null)} className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            <input 
              className="w-full p-3.5 rounded-lg mb-4 border border-slate-200 font-medium text-sm outline-none focus:border-slate-400 bg-slate-50 transition-colors" 
              placeholder="Título de la Gema" 
              value={editandoGema.titulo} 
              onChange={e => setEditandoGema({...editandoGema, titulo: e.target.value})} 
              autoFocus
            />
            <textarea 
              className="w-full p-3.5 rounded-lg mb-4 border border-slate-200 text-sm min-h-[100px] outline-none focus:border-slate-400 bg-slate-50 resize-none transition-colors" 
              placeholder="Descripción..." 
              value={editandoGema.descripcion} 
              onChange={e => setEditandoGema({...editandoGema, descripcion: e.target.value})} 
            />
            <SelectorCategorias 
              seleccionadas={editandoGema.categorias || []} 
              onToggle={(id) => toggleCategoria(id, false)} 
            />
            <button 
              disabled={savingGema} 
              className="w-full py-3 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition-colors flex justify-center items-center mt-2" 
              onClick={handleEditarGema}
            >
              {savingGema ? <Loader2 size={18} className="animate-spin" /> : "Guardar Cambios"}
            </button>
          </div>
        </div>
      )}

  
    </div>
  );
}