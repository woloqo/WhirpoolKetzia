"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Calendar, BookOpen, CheckCircle, LogOut, Save, X, 
  Camera, Loader2, Gem, Plus, Trash2, Pencil, MessageSquare, Heart, Grid, PlayCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PerfilPage() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Estado de las pestañas ('cursos', 'gemas', 'publicaciones')
  const [activeTab, setActiveTab] = useState('cursos');

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [previewPfp, setPreviewPfp] = useState(null);
  const [filePfp, setFilePfp] = useState(null);
  
  const [gemas, setGemas] = useState([]);
  const [showGemaForm, setShowGemaForm] = useState(false);
  const [nuevaGema, setNuevaGema] = useState({ titulo: '', descripcion: '' });
  const [savingGema, setSavingGema] = useState(false);

  const [posts, setPosts] = useState([]);
  const [editandoPost, setEditandoPost] = useState(null);
  const [savingPost, setSavingPost] = useState(false);

  // NUEVO: Estado para los cursos reales
  const [cursos, setCursos] = useState([]);

  const fetchGemas = async (uid) => {
    try {
      const res = await fetch(`/api/gemas?usuario_id=${uid}`);
      const data = await res.json();
      setGemas(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchPosts = async (uid) => {
    try {
      const res = await fetch(`/api/comunidad?usuario_id=${uid}&myId=${uid}&limit=50`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  // NUEVO: Función para obtener los cursos de la API
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
      
      // Llamadas en paralelo a las demás APIs
      fetchGemas(usuarioId);
      fetchPosts(usuarioId);
      fetchCursos(usuarioId);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchDatos(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFilePfp(file);
      setPreviewPfp(URL.createObjectURL(file));
    }
  };

  const uploadPfp = async (file, userId) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('pfps').upload(fileName, file);
    if (uploadError) throw uploadError;
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
      if (res.ok) {
        setEditMode(false);
        setFilePfp(null);
        await fetchDatos();
      }
    } catch (error) {
      alert("Error al actualizar perfil");
    } finally {
      setSaving(false);
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
      setNuevaGema({ titulo: '', descripcion: '' });
      setShowGemaForm(false);
      fetchGemas(userId);
    }
    setSavingGema(false);
  };

  const handleEditarPost = async () => {
    if (!editandoPost?.contenido.trim()) return;
    setSavingPost(true);
    const userId = localStorage.getItem('usuario_id');
    try {
      const res = await fetch('/api/comunidad', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          publicacion_id: editandoPost.publicacion_id, 
          usuario_id: userId, 
          titulo: editandoPost.titulo, 
          contenido: editandoPost.contenido 
        }),
      });
      if (res.ok) {
        setEditandoPost(null);
        fetchPosts(userId);
      }
    } catch (e) { console.error(e); }
    finally { setSavingPost(false); }
  };

  const handleEliminarPost = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta publicación?')) return;
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

  // NUEVO: Filtramos los cursos
  const cursosPendientes = cursos.filter(c => !c.completado);
  const cursosTerminados = cursos.filter(c => c.completado);

  return (
    <div className="bg-white min-h-screen pt-10 pb-32">
      <div className="max-w-[935px] mx-auto px-4 sm:px-6">
        
        {/* --- 1. CABECERA ESTILO INSTAGRAM --- */}
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
                  className="text-xl md:text-xl text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none px-3 py-1.5 w-full md:w-auto focus:border-slate-400 transition-colors"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Tu alias"
                  autoFocus
                />
              ) : (
                <h1 className="text-xl md:text-xl text-slate-900 font-medium">{usuario.alias || usuario.nombre}</h1>
              )}
              
              <div className="flex gap-2 w-full md:w-auto justify-center">
                {editMode ? (
                  <>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition-colors">Guardar</button>
                    <button onClick={() => { setEditMode(false); setPreviewPfp(null); }} className="px-4 py-1.5 bg-slate-100 text-slate-900 font-semibold text-sm rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditMode(true)} className="px-4 py-1.5 bg-slate-100 text-slate-900 font-semibold text-sm rounded-lg hover:bg-slate-200 transition-colors w-full md:w-auto">Editar perfil</button>
                    <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="px-4 py-1.5 bg-slate-100 text-slate-900 font-semibold text-sm rounded-lg hover:bg-slate-200 hover:text-red-600 transition-colors w-full md:w-auto">Salir</button>
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
              <a href={`mailto:${usuario.email}`} className="text-blue-900 font-semibold hover:underline block pt-1">
                {usuario.email}
              </a>
            </div>
            
            <div className="flex md:hidden justify-between w-full mt-6 pt-4 border-t border-slate-200 text-center text-sm">
              <div className="flex flex-col"><span className="font-semibold text-slate-900">{posts.length}</span> <span className="text-slate-500">publicaciones</span></div>
              <div className="flex flex-col"><span className="font-semibold text-slate-900">{cursosTerminados.length}</span> <span className="text-slate-500">cursos</span></div>
              <div className="flex flex-col"><span className="font-semibold text-slate-900">{gemas.length}</span> <span className="text-slate-500">gemas</span></div>
            </div>
          </div>
        </header>

        {/* --- 2. NAVEGACIÓN POR PESTAÑAS (TABS) --- */}
        <div className="flex justify-center md:gap-16 border-b border-slate-200 mb-8 relative -top-[1px]">
          <button 
            onClick={() => setActiveTab('cursos')}
            className={`flex flex-1 md:flex-none items-center justify-center gap-2 py-4 text-[12px] font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'cursos' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {activeTab === 'cursos' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-900"></div>}
            <PlayCircle size={14} /> <span className="hidden sm:inline">Cursos</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('gemas')}
            className={`flex flex-1 md:flex-none items-center justify-center gap-2 py-4 text-[12px] font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'gemas' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {activeTab === 'gemas' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-900"></div>}
            <Gem size={14} /> <span className="hidden sm:inline">Gemas</span>
          </button>

          <button 
            onClick={() => setActiveTab('publicaciones')}
            className={`flex flex-1 md:flex-none items-center justify-center gap-2 py-4 text-[12px] font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'publicaciones' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {activeTab === 'publicaciones' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-900"></div>}
            <Grid size={14} /> <span className="hidden sm:inline">Publicaciones</span>
          </button>
        </div>

        {/* --- 3. CONTENIDO DE LAS PESTAÑAS --- */}
        
        {/* PESTAÑA: MIS CURSOS CON DATA REAL */}
        {activeTab === 'cursos' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Columna: En Progreso */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <PlayCircle className="text-orange-500" size={20} /> Cursos Pendientes ({cursosPendientes.length})
                </h3>
                <div className="space-y-4">
                  {cursosPendientes.length > 0 ? (
                    cursosPendientes.map(curso => (
                      <div key={curso.curso_id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 flex items-center justify-center rounded-lg shrink-0">
                          <BookOpen size={20} />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-medium text-slate-900 truncate" title={curso.titulo || curso.nombre}>{curso.titulo || curso.nombre}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${curso.porcentaje}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{curso.porcentaje}%</span>
                          </div>
                        </div>
                        <button onClick={() => router.push(`/cursos/${curso.curso_id}`)} className="px-3 py-1.5 bg-blue-50 text-blue-600 font-semibold text-xs rounded-lg hover:bg-blue-100 transition-colors shrink-0">
                          Ir
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-200 rounded-lg text-center">
                      No tienes cursos en progreso.
                    </p>
                  )}
                </div>
              </div>

              {/* Columna: Completados */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <CheckCircle className="text-emerald-500" size={20} /> Cursos Terminados ({cursosTerminados.length})
                </h3>
                <div className="space-y-4">
                  {cursosTerminados.length > 0 ? (
                    cursosTerminados.map(curso => (
                      <div key={curso.curso_id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg opacity-80 hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-full shrink-0">
                          <CheckCircle size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate line-through decoration-slate-300" title={curso.titulo || curso.nombre}>{curso.titulo || curso.nombre}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Completado</p>
                        </div>
                        <button onClick={() => router.push(`/cursos/${curso.curso_id}`)} className="px-3 py-1.5 bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                          Repasar
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-200 rounded-lg text-center">
                      Aún no has terminado ningún curso.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PESTAÑA: GEMAS */}
        {activeTab === 'gemas' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => setShowGemaForm(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold text-sm rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus size={16} /> Crear Gema
              </button>
            </div>
            
            {gemas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-20 h-20 rounded-full border-2 border-slate-300 flex items-center justify-center mb-4">
                  <Gem size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">No hay gemas</h3>
                <p className="text-sm">Comparte tu primer recurso con la comunidad.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {gemas.map(g => (
                  <div key={g.gema_id} className="border border-slate-200 p-5 rounded-lg hover:shadow-md transition-shadow bg-white flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 shrink-0">
                        <Gem size={18} />
                      </div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{g.titulo}</h3>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-grow">{g.descripcion}</p>
                    <button className="text-xs font-semibold text-blue-500 hover:text-blue-700 uppercase tracking-widest text-left w-full mt-auto pt-3 border-t border-slate-100">
                      Ver detalle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: PUBLICACIONES (GRID IG) */}
        {activeTab === 'publicaciones' && (
          <div className="animate-in fade-in duration-300">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-20 h-20 rounded-full border-2 border-slate-300 flex items-center justify-center mb-4">
                  <Camera size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-slate-900 mb-2">Aún no hay publicaciones</h3>
                <p>Sube tu primera publicación en la pestaña de Comunidad.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {posts.map(post => (
                  <div key={post.publicacion_id} className="aspect-square bg-slate-100 relative group overflow-hidden cursor-pointer border border-slate-200/50 flex flex-col items-center justify-center text-center">
                    
                    {/* Render Condicional: Imagen vs Texto */}
                    {post.imagenes?.length > 0 ? (
                      <img src={post.imagenes[0].url_imagen} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Post" />
                    ) : (
                      <div className="absolute inset-0 p-4 flex flex-col justify-center items-center bg-white">
                        <p className="text-xs md:text-sm font-medium text-slate-700 line-clamp-4 md:line-clamp-6">{post.contenido}</p>
                        {post.gema && <Gem size={14} className="text-slate-400 mt-2" />}
                      </div>
                    )}

                    {/* OVERLAY TIPO INSTAGRAM (Likes y Comentarios en Hover) */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 z-10">
                      <div className="flex items-center gap-6 text-white font-bold text-sm md:text-lg">
                        <div className="flex items-center gap-2">
                          <Heart className={post.iLiked ? "fill-red-500 text-red-500" : "fill-white"} size={20} /> {post.totalLikes || 0}
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="fill-white" size={20} /> {post.comentarios?.length || 0}
                        </div>
                      </div>
                    </div>

                    {/* Botones Flotantes de Edición (Esquina superior derecha) */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={(e) => { e.stopPropagation(); setEditandoPost(post); }} className="p-2 bg-white rounded-full text-slate-700 hover:text-blue-600 shadow transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleEliminarPost(post.publicacion_id); }} className="p-2 bg-white rounded-full text-slate-700 hover:text-red-600 shadow transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- MODALES FLOTANTES --- */}

      {/* Modal Añadir Gema */}
      {showGemaForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Gem className="text-blue-500"/> Nueva Gema</h3>
              <button onClick={() => setShowGemaForm(false)} className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            <input 
              className="w-full p-3.5 rounded-lg mb-4 border border-slate-200 font-medium text-sm outline-none focus:border-slate-400 bg-slate-50 transition-colors" 
              placeholder="Título de la Gema" 
              value={nuevaGema.titulo} 
              onChange={e => setNuevaGema({...nuevaGema, titulo: e.target.value})} 
              autoFocus
            />
            <textarea 
              className="w-full p-3.5 rounded-lg mb-6 border border-slate-200 text-sm min-h-[120px] outline-none focus:border-slate-400 bg-slate-50 resize-none transition-colors" 
              placeholder="Descripción del recurso..." 
              value={nuevaGema.descripcion} 
              onChange={e => setNuevaGema({...nuevaGema, descripcion: e.target.value})} 
            />
            <button 
              disabled={savingGema} 
              className="w-full py-3 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition-colors flex justify-center items-center" 
              onClick={handleCrearGema}
            >
              {savingGema ? <Loader2 size={18} className="animate-spin" /> : "Guardar Gema"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Editar Post */}
      {editandoPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Edit3 className="text-blue-500"/> Editar Publicación</h3>
              <button onClick={() => setEditandoPost(null)} className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 bg-slate-100 rounded-full"><X size={18} /></button>
            </div>
            <input 
              className="w-full p-3.5 border border-slate-200 rounded-lg text-sm mb-4 bg-slate-50 outline-none focus:border-slate-400 transition-colors" 
              value={editandoPost.titulo || ""} 
              onChange={e => setEditandoPost({...editandoPost, titulo: e.target.value})} 
              placeholder="Título (Opcional)"
            />
            <textarea 
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 text-sm min-h-[150px] resize-none mb-6 transition-colors"
              value={editandoPost.contenido}
              onChange={(e) => setEditandoPost({...editandoPost, contenido: e.target.value})}
              placeholder="Escribe tu contenido aquí..."
            />
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-200 transition-colors" onClick={() => setEditandoPost(null)}>Cancelar</button>
              <button 
                disabled={savingPost} 
                className="flex-1 py-3 bg-blue-500 text-white font-semibold text-sm rounded-lg hover:bg-blue-600 transition-colors flex justify-center items-center" 
                onClick={handleEditarPost}
              >
                {savingPost ? <Loader2 size={18} className="animate-spin" /> : "Actualizar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}