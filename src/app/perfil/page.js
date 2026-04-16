"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Calendar, BookOpen, CheckCircle, LogOut, Edit3, Save, X, 
  Camera, Loader2, Gem, Plus, Trash2, Pencil, MessageSquare, Heart 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Importación de componentes refactorizados
import { Button } from '@/components/Button';
import { Title, Text, PageHeader } from '@/components/Typography';
import { SectionCard } from '@/components/SectionCard';

export default function PerfilPage() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [previewPfp, setPreviewPfp] = useState(null);
  const [filePfp, setFilePfp] = useState(null);
  
  const [gemas, setGemas] = useState([]);
  const [showGemaForm, setShowGemaForm] = useState(false);
  const [editandoGema, setEditandoGema] = useState(null);
  const [nuevaGema, setNuevaGema] = useState({ titulo: '', descripcion: '' });
  const [savingGema, setSavingGema] = useState(false);

  const [posts, setPosts] = useState([]);
  const [editandoPost, setEditandoPost] = useState(null);
  const [savingPost, setSavingPost] = useState(false);

  const fetchGemas = async (uid) => {
    try {
      const res = await fetch(`/api/gemas?usuario_id=${uid}`);
      const data = await res.json();
      setGemas(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchPosts = async (uid) => {
    try {
      const res = await fetch(`/api/comunidad?usuario_id=${uid}`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
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
    if (!window.confirm('¿Eliminar esta publicación?')) return;
    const userId = localStorage.getItem('usuario_id');
    const res = await fetch(`/api/comunidad?id=${id}&uid=${userId}`, { method: 'DELETE' });
    if (res.ok) fetchPosts(userId);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  const { usuario, stats } = datos;

  return (
    // Contenedor principal con altura fija para evitar el scroll del body
    <div className="max-w-full mx-auto px-4 md:px-8 h-screen overflow-hidden bg-slate-50/30">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full py-6 lg:py-10">
        
        {/* COLUMNA IZQUIERDA: PERFIL, STATS Y CUENTA (Scroll Independiente) */}
        <div className="lg:col-span-5 h-full overflow-y-auto pr-2 custom-scrollbar space-y-6">
          
          {/* Tarjeta de Identidad */}
          <SectionCard className="relative overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative group mb-4">
                <div className="w-32 h-32 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl overflow-hidden border-4 border-white transition-transform duration-500">
                  {previewPfp || usuario.pfp ? (
                    <img src={previewPfp || usuario.pfp} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <User size={60} />
                  )}
                </div>
                {editMode && (
                  <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 text-white rounded-3xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              {editMode ? (
                <div className="space-y-2 w-full">
                  <input
                    className="text-lg font-bold text-slate-700 bg-slate-50 border-b-2 border-blue-500 outline-none w-full px-2 py-1 text-center"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    autoFocus
                  />
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">{usuario.alias || usuario.nombre}</h1>
                  {usuario.alias && <p className="text-slate-400 text-xs font-bold uppercase mt-1">{usuario.nombre}</p>}
                </div>
              )}

              <div className="flex flex-col items-center gap-3 mt-4 w-full">
                <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-md">
                  {usuario.nombre_rol}
                </span>
                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <Button onClick={handleSave} loading={saving} variant="primary" icon={Save} className="py-2 px-4 text-xs" />
                      <Button onClick={() => { setEditMode(false); setPreviewPfp(null); }} variant="ghost" icon={X} className="py-2 px-4 text-xs" />
                    </>
                  ) : (
                    <Button onClick={() => setEditMode(true)} variant="ghost" icon={Edit3} className="py-2 px-4 text-[9px] uppercase">Editar Perfil</Button>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Estadísticas */}
          <SectionCard title="Estadísticas">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="bg-orange-100 text-orange-600 p-3 rounded-xl"><BookOpen size={20} /></div>
                <div>
                  <p className="text-xl font-black text-slate-900">{stats.total_inscritos - stats.total_completados}</p>
                  <Text variant="muted">Pendientes</Text>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><CheckCircle size={20} /></div>
                <div>
                  <p className="text-xl font-black text-slate-900">{stats.total_completados}</p>
                  <Text variant="muted">Finalizados</Text>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Mis Gemas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Title><Gem size={18} className="text-blue-600" /> Mis Gemas</Title>
              {!showGemaForm && <Button onClick={() => setShowGemaForm(true)} variant="pill" icon={Plus}>Añadir</Button>}
            </div>
            <div className="space-y-3">
              {gemas.map((gema) => (
                <div key={`gema-${gema.gema_id}`} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-start gap-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Gem size={16}/></div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-xs">{gema.titulo}</h3>
                    <p className="text-slate-500 text-[10px] line-clamp-2 mt-0.5">{gema.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SectionCard title="Cuenta">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-slate-600 text-xs font-bold truncate">
                <Mail size={14} className="text-blue-500" /> {usuario.email}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-2">
                <Calendar size={14} /> Desde {new Date(usuario.fecha_creacion).toLocaleDateString()}
              </div>
              <Button onClick={() => { localStorage.clear(); router.push('/login'); }} variant="danger" icon={LogOut} className="w-full py-3 mt-2 text-[10px] uppercase">Cerrar Sesión</Button>
            </div>
          </SectionCard>
        </div>

        {/* COLUMNA DERECHA: PUBLICACIONES (Scroll Independiente) */}
        <div className="lg:col-span-7 h-full overflow-y-auto pr-2 custom-scrollbar space-y-8">
          <Title className="mb-6 sticky top-0 bg-slate-50/30 backdrop-blur-sm py-2 z-10">
            <MessageSquare className="text-blue-600" /> Historial de Actividad
          </Title>
          
          <div className="space-y-6 pb-20">
            {posts.length > 0 ? posts.map(post => (
              <SectionCard 
                key={`post-${post.publicacion_id}`} 
                title={
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800">{post.titulo || "Sin título"}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(post.fecha_publicacion).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditandoPost(post)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Pencil size={14}/></button>
                      <button onClick={() => handleEliminarPost(post.publicacion_id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                }
              >
                <div className="p-4 pt-2">
                  {editandoPost?.publicacion_id === post.publicacion_id ? (
                    <div className="space-y-3">
                      <input className="w-full p-3 border rounded-xl font-bold text-sm" value={editandoPost.titulo || ""} onChange={e => setEditandoPost({...editandoPost, titulo: e.target.value})} />
                      <textarea 
                        className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[120px]"
                        value={editandoPost.contenido}
                        onChange={(e) => setEditandoPost({...editandoPost, contenido: e.target.value})}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" className="px-4 py-2" onClick={() => setEditandoPost(null)}>Cancelar</Button>
                        <Button loading={savingPost} className="px-4 py-2" onClick={handleEditarPost}>Actualizar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-700 text-sm font-medium leading-relaxed mb-6 whitespace-pre-wrap">{post.contenido}</p>
                      
                      {/* IMÁGENES ADJUNTAS */}
                      {post.imagenes?.length > 0 && (
                        <div className={`grid gap-3 mb-6 ${post.imagenes.length === 1 ? 'grid-cols-1' : post.imagenes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {post.imagenes.map((img) => (
                            <div key={img.imagen_id} className="rounded-2xl overflow-hidden border border-slate-100 h-64 shadow-sm bg-slate-50">
                              <img 
                                src={img.url_imagen} 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" 
                                alt="Publicación"
                                onClick={() => window.open(img.url_imagen, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-6 border-t pt-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
                          <Heart size={16} className={post.iLiked ? "text-red-500 fill-current" : ""} /> {post.totalLikes || 0} Likes
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400">
                          <MessageSquare size={16} /> {post.comentarios?.length || 0} Comentarios
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </SectionCard>
            )) : (
              <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold italic">No hay publicaciones recientes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}