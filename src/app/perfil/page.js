"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Calendar, BookOpen, CheckCircle, LogOut, Save, X, 
  Camera, Loader2, Gem, Plus, Trash2, Pencil, MessageSquare, Heart, Grid, PlayCircle, Edit3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Componentes importados
import { Button } from '@/components/Button';
import CursoCard from '@/components/CursoCard';
import { ResourceItem } from '@/components/ResourceItem';
import { SectionCard } from '@/components/SectionCard';
import { Title, Text } from '@/components/Typography';

// Subcomponente para los Tabs (creado aquí para mantener el archivo limpio)
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-1 md:flex-none items-center justify-center gap-2 py-4 text-[12px] font-bold tracking-widest uppercase transition-colors relative ${active ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {active && <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-900"></div>}
    <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
  </button>
);

export default function PerfilPage() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('cursos');

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [previewPfp, setPreviewPfp] = useState(null);
  const [filePfp, setFilePfp] = useState(null);
  
  const [gemas, setGemas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showGemaForm, setShowGemaForm] = useState(false);
  const [editandoGema, setEditandoGema] = useState(null);
  const [nuevaGema, setNuevaGema] = useState({ titulo: '', descripcion: '', categorias: [] });
  const [savingGema, setSavingGema] = useState(false);

  const [posts, setPosts] = useState([]);
  const [editandoPost, setEditandoPost] = useState(null);
  const [savingPost, setSavingPost] = useState(false);

  const [cursos, setCursos] = useState([]);

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
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) { router.push('/login'); return; }
    try {
      const res = await fetch(`/api/perfil?id=${usuarioId}`);
      const data = await res.json();
      setDatos(data);
      setNuevoNombre(data.usuario.alias || '');
      setLoading(false);
      fetchGemas(usuarioId);
      fetchPosts(usuarioId);
      fetchCursos(usuarioId);
      fetchCategorias();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchDatos(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setFilePfp(file); setPreviewPfp(URL.createObjectURL(file)); }
  };

  const uploadPfp = async (file, userId) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('pfps').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('pfps').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    const userId = localStorage.getItem('usuario_id');
    try {
      let pfpUrl = datos.usuario.pfp;
      if (filePfp) pfpUrl = await uploadPfp(filePfp, userId);
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: userId, alias: nuevoNombre, pfp: pfpUrl }),
      });
      if (res.ok) { setEditMode(false); setFilePfp(null); await fetchDatos(); }
    } catch (error) { alert("Error al actualizar perfil"); }
    finally { setSaving(false); }
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

  const handleCrearGema = async () => {
    if (!nuevaGema.titulo.trim() || !nuevaGema.descripcion.trim()) return;
    setSavingGema(true);
    const userId = localStorage.getItem('usuario_id');
    const res = await fetch('/api/gemas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: userId, ...nuevaGema }),
    });
    if (res.ok) {
      setNuevaGema({ titulo: '', descripcion: '', categorias: [] });
      setShowGemaForm(false);
      fetchGemas(userId);
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

  const handleEditarPost = async () => {
    if (!editandoPost?.contenido.trim()) return;
    setSavingPost(true);
    const userId = localStorage.getItem('usuario_id');
    try {
      const res = await fetch('/api/comunidad', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicacion_id: editandoPost.publicacion_id, usuario_id: userId, titulo: editandoPost.titulo, contenido: editandoPost.contenido }),
      });
      if (res.ok) { setEditandoPost(null); fetchPosts(userId); }
    } catch (e) { console.error(e); }
    finally { setSavingPost(false); }
  };

  const handleEliminarPost = async (id) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    const userId = localStorage.getItem('usuario_id');
    const res = await fetch(`/api/comunidad?id=${id}&uid=${userId}`, { method: 'DELETE' });
    if (res.ok) fetchPosts(userId);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-slate-300" size={40} />
    </div>
  );

  const { usuario } = datos;
  const cursosPendientes = cursos.filter(c => !c.completado);
  const cursosTerminados = cursos.filter(c => c.completado);

  // Selector de categorías reutilizable
  const SelectorCategorias = ({ seleccionadas, onToggle }) => (
    <div className="mb-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Categorías</p>
      <div className="flex flex-wrap gap-2">
        {categorias.map(cat => {
          const ids = seleccionadas.map(c => c.categoria_id || c);
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
    <div className="bg-white min-h-screen pt-10 pb-32">
      <div className="max-w-[935px] mx-auto px-4 sm:px-6">
        
        {/* CABECERA */}
        <header className="flex flex-col md:flex-row items-center md:items-start md:gap-20 mb-10 pb-10 border-b border-slate-200">
          <div className="shrink-0 mb-6 md:mb-0 relative group">
            <div className="w-36 h-36 md:w-40 md:h-40 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden ring-1 ring-slate-200">
              {previewPfp || usuario.pfp ? (
                <img src={previewPfp || usuario.pfp} className="w-full h-full object-cover" alt="Foto de perfil" />
              ) : (
                <User size={64} strokeWidth={1.5} />
              )}
            </div>
            {editMode && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={28} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="flex flex-col items-center md:items-start flex-1 w-full">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-5 w-full md:w-auto">
              {editMode ? (
                <input
                  className="text-xl text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none px-3 py-1.5 w-full md:w-auto focus:border-slate-400 transition-colors"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Tu alias"
                  autoFocus
                />
              ) : (
                <h1 className="text-xl text-slate-900 font-medium">{usuario.alias || usuario.nombre}</h1>
              )}
              <div className="flex gap-2 w-full md:w-auto justify-center">
                {editMode ? (
                  <>
                    <Button onClick={handleSave} loading={saving} variant="primary" className="py-1.5 px-4 text-xs font-semibold rounded-lg">Guardar</Button>
                    <Button onClick={() => { setEditMode(false); setPreviewPfp(null); }} variant="ghost" className="py-1.5 px-4 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">Cancelar</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setEditMode(true)} variant="ghost" className="py-1.5 px-4 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors w-full md:w-auto">Editar perfil</Button>
                    <Button onClick={() => { localStorage.clear(); router.push('/login'); }} variant="ghost" className="py-1.5 px-4 text-sm font-semibold rounded-lg hover:bg-slate-200 hover:text-red-600 transition-colors w-full md:w-auto">Salir</Button>
                  </>
                )}
              </div>
            </div>

            <div className="hidden md:flex gap-10 mb-5 text-base">
              <div><span className="font-semibold text-slate-900">{posts.length}</span> publicaciones</div>
              <div><span className="font-semibold text-slate-900">{cursosTerminados.length}</span> cursos terminados</div>
              <div><span className="font-semibold text-slate-900">{gemas.length}</span> gemas creadas</div>
            </div>

            <div className="text-sm text-center md:text-left w-full space-y-1">
              <p className="font-semibold text-slate-900">{usuario.nombre}</p>
              <p className="text-slate-600">{usuario.nombre_rol}</p>
              <p className="text-slate-500">Miembro desde {new Date(usuario.fecha_creacion).toLocaleDateString()}</p>
              <a href={`mailto:${usuario.email}`} className="text-blue-900 font-semibold hover:underline block pt-1">{usuario.email}</a>
            </div>
            
            <div className="flex md:hidden justify-between w-full mt-6 pt-4 border-t border-slate-200 text-center text-sm">
              <div className="flex flex-col"><span className="font-semibold text-slate-900">{posts.length}</span><span className="text-slate-500">publicaciones</span></div>
              <div className="flex flex-col"><span className="font-semibold text-slate-900">{cursosTerminados.length}</span><span className="text-slate-500">cursos</span></div>
              <div className="flex flex-col"><span className="font-semibold text-slate-900">{gemas.length}</span><span className="text-slate-500">gemas</span></div>
            </div>
            
          </div>
        </header>

        {/* TABS */}
        <div className="flex justify-center md:gap-16 border-b border-slate-200 mb-8 relative -top-[1px]">
          {[
            { id: 'cursos', icon: <PlayCircle size={14} />, label: 'Cursos' },
            { id: 'gemas', icon: <Gem size={14} />, label: 'Gemas' },
            { id: 'publicaciones', icon: <Grid size={14} />, label: 'Publicaciones' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 md:flex-none items-center justify-center gap-2 py-4 text-[12px] font-bold tracking-widest uppercase transition-colors relative ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
              {activeTab === tab.id && <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-900"></div>}
              {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* PESTAÑA: CURSOS */}
        {activeTab === 'cursos' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <PlayCircle className="text-orange-500" size={20} /> Cursos Pendientes ({cursosPendientes.length})
                </h3>
                <div className="space-y-4">
                  {cursosPendientes.length > 0 ? cursosPendientes.map(curso => (
                    <div key={curso.curso_id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-12 h-12 bg-orange-50 text-orange-500 flex items-center justify-center rounded-lg shrink-0"><BookOpen size={20} /></div>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-slate-900 truncate">{curso.titulo || curso.nombre}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${curso.porcentaje}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{curso.porcentaje}%</span>
                        </div>
                      </div>
                      <button onClick={() => router.push(`/cursos/${curso.curso_id}`)} className="px-3 py-1.5 bg-blue-50 text-blue-600 font-semibold text-xs rounded-lg hover:bg-blue-100 transition-colors shrink-0">Ir</button>
                    </div>
                  )) : <p className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-200 rounded-lg text-center">No tienes cursos en progreso.</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <CheckCircle className="text-emerald-500" size={20} /> Cursos Terminados ({cursosTerminados.length})
                </h3>
                <div className="space-y-4">
                  {cursosTerminados.length > 0 ? cursosTerminados.map(curso => (
                    <div key={curso.curso_id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg opacity-80 hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-full shrink-0"><CheckCircle size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate line-through decoration-slate-300">{curso.titulo || curso.nombre}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Completado</p>
                      </div>
                      <button onClick={() => router.push(`/cursos/${curso.curso_id}`)} className="px-3 py-1.5 bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg hover:bg-slate-100 shrink-0">Repasar</button>
                    </div>
                  )) : <p className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-200 rounded-lg text-center">Aún no has terminado ningún curso.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

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
              <div className="">
                {gemas.map(g => (
                  <div key={g.gema_id} className="border border-slate-200 p-5 rounded-lg hover:shadow-md transition-shadow bg-white flex flex-col group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 shrink-0"><Gem size={18} /></div>
                        <h3 className="font-semibold text-slate-900 line-clamp-1">{g.titulo}</h3>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditandoGema({...g, categorias: g.categorias || []})} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleEliminarGema(g.gema_id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-3 flex-grow">{g.descripcion}</p>
                    {/* Categorías de la gema */}
                    {g.categorias?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-3 border-t border-slate-100">
                        {g.categorias.map(cat => (
                          <span key={cat.categoria_id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                            {cat.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: PUBLICACIONES */}
        {activeTab === 'publicaciones' && (
          <div className="animate-in fade-in duration-300">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-20 h-20 rounded-full border-2 border-slate-300 flex items-center justify-center mb-4"><Camera size={32} strokeWidth={1.5} /></div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">Aún no hay publicaciones</h3>
                <p>Sube tu primera publicación en la pestaña de Comunidad.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {posts.map(post => (
                  <div key={post.publicacion_id} className="aspect-square bg-slate-100 relative group overflow-hidden cursor-pointer border border-slate-200/50 flex flex-col items-center justify-center text-center">
                    {post.imagenes?.length > 0 ? (
                      <img src={post.imagenes[0].url_imagen} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Post" />
                    ) : (
                      <div className="absolute inset-0 p-4 flex flex-col justify-center items-center bg-white">
                        <Text className="text-[10px] md:text-sm font-medium text-slate-700 line-clamp-4 md:line-clamp-6">{post.contenido}</Text>
                        {post.gema && <Gem size={14} className="text-slate-400 mt-2" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 z-10">
                      <div className="flex items-center gap-6 text-white font-bold text-sm md:text-lg">
                        <div className="flex items-center gap-2"><Heart className={post.iLiked ? "fill-red-500 text-red-500" : "fill-white"} size={20} /> {post.totalLikes || 0}</div>
                        <div className="flex items-center gap-2"><MessageSquare className="fill-white" size={20} /> {post.comentarios?.length || 0}</div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={(e) => { e.stopPropagation(); setEditandoPost(post); }} className="p-2 bg-white rounded-full text-slate-700 hover:text-blue-600 shadow transition-colors"><Pencil size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleEliminarPost(post.publicacion_id); }} className="p-2 bg-white rounded-full text-slate-700 hover:text-red-600 shadow transition-colors"><Trash2 size={14} /></button>
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

      {/* MODAL: EDITAR POST */}
      {editandoPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Edit3 className="text-blue-500"/> Editar Publicación</h3>
              <button onClick={() => setEditandoPost(null)} className="text-slate-400 hover:text-slate-900 p-1.5 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            <input className="w-full p-3.5 border border-slate-200 rounded-lg text-sm mb-4 bg-slate-50 outline-none focus:border-slate-400 transition-colors" value={editandoPost.titulo || ""} onChange={e => setEditandoPost({...editandoPost, titulo: e.target.value})} placeholder="Título (Opcional)" />
            <textarea className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 text-sm min-h-[150px] resize-none mb-6 transition-colors" value={editandoPost.contenido} onChange={(e) => setEditandoPost({...editandoPost, contenido: e.target.value})} placeholder="Escribe tu contenido aquí..." />
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-200 transition-colors" onClick={() => setEditandoPost(null)}>Cancelar</button>
              <button disabled={savingPost} className="flex-1 py-3 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition-colors flex justify-center items-center" onClick={handleEditarPost}>
                {savingPost ? <Loader2 size={18} className="animate-spin" /> : "Actualizar"}
              </button>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}