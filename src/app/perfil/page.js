"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Calendar, BookOpen, CheckCircle, LogOut, Save, X, 
  Camera, Loader2, Gem, Plus, Trash2, Pencil, MessageSquare, Heart, Grid, PlayCircle,
  BookCheck
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

  const [activeTab, setActiveTab] = useState('publicaciones');

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

  const cursosPendientes = cursos.filter(c => !c.completado);
  const cursosTerminados = cursos.filter(c => c.completado);

  return (
    <div className="bg-white min-h-screen pt-10 pb-32">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        
        {/* --- 1. CABECERA ESTILO INSTAGRAM --- */}
        <header className="flex flex-col md:flex-row items-center md:items-start md:gap-20 mb-5 ">
          
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
                  className="text-xl md:text-xl text-slate-900 bg-slate-50 rounded-lg outline-none px-3 py-1.5 w-full md:w-auto focus:border-slate-400 transition-colors"
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
              <a href={`mailto:${usuario.email}`} className="text-blue-900 font-semibold hover:underline block pt-1">
                {usuario.email}
              </a>
            </div>
            
            
          </div>
        </header>

            

        {/* --- 2. NAVEGACIÓN POR PESTAÑAS (TABS) --- */}
        <div className="flex justify-center md:gap-16 border-t border-b border-slate-200 mb-8 relative -top-[1px]">
          <TabButton active={activeTab === 'cursos'} onClick={() => setActiveTab('cursos')} icon={PlayCircle} label="Cursos" />
          <TabButton active={activeTab === 'publicaciones'} onClick={() => setActiveTab('publicaciones')} icon={Grid} label="Publicaciones" />
          <TabButton active={activeTab === 'gemas'} onClick={() => setActiveTab('gemas')} icon={Gem} label="Gemas" />
        </div>

        {/* --- 3. CONTENIDO DE LAS PESTAÑAS --- */}
        
        {activeTab === 'cursos' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              
              <SectionCard title="Cursos Pendientes" count={cursosPendientes.length} className="border-none shadow-none bg-transparent">
                {cursosPendientes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {cursosPendientes.map(curso => (
                      <ResourceItem 
                        key={curso.curso_id} 
                        title={curso.titulo || curso.nombre}
                        subtitle={curso.descripcionCorta || "Curso en progreso"}
                        icon={BookOpen}
                        variant="blue"
                        action={<Button variant="pill">Ver detalle</Button>}
                      />
                    ))}
                  </div>
                ) : (
                  <Text variant="muted" className="text-center py-8">No tienes cursos en progreso.</Text>
                )}
              </SectionCard>

              <SectionCard title="Cursos Terminados" count={cursosTerminados.length} className="border-none shadow-none bg-transparent">
                {cursosTerminados.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {cursosTerminados.map(curso => (
                      <ResourceItem 
                        key={curso.curso_id} 
                        title={curso.titulo || curso.nombre}
                        subtitle={curso.descripcionCorta || "Curso en progreso"}
                        icon={BookCheck}
                        variant="blue"
                        action={<Button variant="pill">Ver detalle</Button>}
                      />
                    ))}
                  </div>
                ) : (
                  <Text variant="muted" className="text-center py-8">Aún no has terminado ningún curso.</Text>
                )}
              </SectionCard>

            </div>
          </div>
        )}

        {activeTab === 'gemas' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-end mb-6">
              <Button onClick={() => setShowGemaForm(true)} icon={Plus} variant="dark" className="py-2 text-sm">
                Crear Gema
              </Button>
            </div>
            
            {gemas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-20 h-20 rounded-full border-2 border-slate-300 flex items-center justify-center mb-4">
                  <Gem size={32} strokeWidth={1.5} />
                </div>
                <Title className="mb-2">No hay gemas</Title>
                <Text variant="description">Comparte tu primer recurso con la comunidad.</Text>
              </div>
            ) : (
              <div className="">
                {gemas.map(g => (
                  <ResourceItem 
                    key={g.gema_id}
                    title={g.titulo}
                    subtitle={g.descripcion}
                    icon={Gem}
                    variant="blue"
                    action={<Button variant="pill">Ver detalle</Button>}
                  />
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
                <Title className="mb-2">Aún no hay publicaciones</Title>
                <Text variant="description">Sube tu primera publicación en la pestaña de Comunidad.</Text>
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
                        <Text className="text-[10px] md:text-sm font-medium text-slate-700 line-clamp-4 md:line-clamp-6">{post.contenido}</Text>
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
                      <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setEditandoPost(post); }} className="p-2 bg-white rounded-full border-none shadow-sm transition-colors text-slate-700 hover:text-blue-600">
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleEliminarPost(post.publicacion_id); }} className="p-2 bg-white rounded-full border-none shadow-sm transition-colors text-slate-700 hover:text-red-600">
                        <Trash2 size={14} />
                      </Button>
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
          <SectionCard 
            title="Nueva Gema" 
            action={<Button variant="ghost" onClick={() => setShowGemaForm(false)} className="p-1.5 border-none rounded-full"><X size={18} /></Button>}
            className="w-full max-w-md shadow-2xl"
          >
            <div className="p-4 space-y-4">
              <input 
                className="w-full p-4 rounded-xl border border-slate-200 font-medium text-sm outline-none focus:border-blue-500 bg-slate-50 transition-colors" 
                placeholder="Título de la Gema" 
                value={nuevaGema.titulo} 
                onChange={e => setNuevaGema({...nuevaGema, titulo: e.target.value})} 
                autoFocus
              />
              <textarea 
                className="w-full p-4 rounded-xl border border-slate-200 text-sm min-h-[120px] outline-none focus:border-blue-500 bg-slate-50 resize-none transition-colors" 
                placeholder="Descripción del recurso..." 
                value={nuevaGema.descripcion} 
                onChange={e => setNuevaGema({...nuevaGema, descripcion: e.target.value})} 
              />
              <Button loading={savingGema} onClick={handleCrearGema} className="w-full">
                Guardar Gema
              </Button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Modal Editar Post */}
      {editandoPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <SectionCard 
            title="Editar Publicación" 
            action={<Button variant="ghost" onClick={() => setEditandoPost(null)} className="p-1.5 border-none rounded-full"><X size={18} /></Button>}
            className="w-full max-w-lg shadow-2xl"
          >
            <div className="p-4 space-y-4">
              <input 
                className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:border-blue-500 transition-colors" 
                value={editandoPost.titulo || ""} 
                onChange={e => setEditandoPost({...editandoPost, titulo: e.target.value})} 
                placeholder="Título (Opcional)"
              />
              <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-sm min-h-[150px] resize-none transition-colors"
                value={editandoPost.contenido}
                onChange={(e) => setEditandoPost({...editandoPost, contenido: e.target.value})}
                placeholder="Escribe tu contenido aquí..."
              />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setEditandoPost(null)} className="flex-1">Cancelar</Button>
                <Button loading={savingPost} onClick={handleEditarPost} className="flex-1">Actualizar</Button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

    </div>
  );
}