"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Loader2, Users, ChevronDown, ChevronUp, 
  Plus, X, Send, Heart, Gem, Pencil, Trash2, Check, Search
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { PageHeader, Title, Text } from '@/components/Typography';
import { SectionCard } from '@/components/SectionCard';
import PostForm from '@/components/PostForm';

export default function ComunidadPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 5;
  const isFetching = useRef(false);

  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [comentandoId, setComentandoId] = useState(null);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [comentariosVisibles, setComentariosVisibles] = useState({});
  const [editandoPost, setEditandoPost] = useState(null);
  const [editandoComentario, setEditandoComentario] = useState(null);

  const [busquedaPosts, setBusquedaPosts] = useState('');
  const [filtroGemas, setFiltroGemas] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('reciente');

  useEffect(() => {
    const uid = localStorage.getItem('usuario_id');
    if (uid) setCurrentUserId(uid);
    fetchPosts(true, uid);
  }, []);

  const fetchPosts = useCallback(async (isInitial = false, uidOverride = null) => {
    if (isFetching.current || (!isInitial && !hasMore)) return;
    const uid = uidOverride || currentUserId;
    isFetching.current = true;
    const currentOffset = isInitial ? 0 : offset;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(`/api/comunidad?limit=${limit}&offset=${currentOffset}&myId=${uid || 0}`);
      const newData = await res.json();
      if (newData.length < limit) setHasMore(false);
      if (isInitial) {
        setPosts(newData);
        setOffset(limit);
        setHasMore(newData.length === limit);
      } else {
        setPosts(prev => {
          const ids = new Set(prev.map(p => p.publicacion_id));
          return [...prev, ...newData.filter(p => !ids.has(p.publicacion_id))];
        });
        setOffset(prev => prev + limit);
      }
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      setLoadingMore(false);
      isFetching.current = false;
    }
  }, [offset, hasMore, currentUserId]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
        fetchPosts();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchPosts]);

  useEffect(() => {
    if (busquedaUsuario.trim().length < 2) {
      setResultadosBusqueda([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/usuarios/buscar?q=${busquedaUsuario}`);
        const data = await res.json();
        const Fuse = (await import('fuse.js')).default;
        const fuse = new Fuse(data, { keys: ['nombre', 'alias'], threshold: 0.4, ignoreLocation: true });
        const resultados = fuse.search(busquedaUsuario).map(r => r.item);
        setResultadosBusqueda(resultados.length > 0 ? resultados : data);
      } catch (e) { console.error(e); }
      finally { setBuscando(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [busquedaUsuario]);

  // Filtrado de posts
  const postsFiltrados = posts
    .filter(post => {
      if (filtroGemas && !post.gema) return false;
      if (busquedaPosts.trim().length >= 2) {
        const query = busquedaPosts.toLowerCase();
        return (
          post.nombre?.toLowerCase().includes(query) ||
          post.contenido?.toLowerCase().includes(query) ||
          post.titulo?.toLowerCase().includes(query) ||
          post.gema?.titulo?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (filtroFecha === 'reciente') return new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion);
      return new Date(a.fecha_publicacion) - new Date(b.fecha_publicacion);
    });

  const eliminarPost = async (id) => {
    if (!window.confirm("¿Eliminar publicación permanentemente?")) return;
    const res = await fetch(`/api/comunidad?id=${id}&uid=${currentUserId}`, { method: 'DELETE' });
    if (res.ok) setPosts(posts.filter(p => p.publicacion_id !== id));
  };

  const handleUpdatePost = async () => {
    if (!editandoPost.contenido.trim()) return;
    const res = await fetch('/api/comunidad', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicacion_id: editandoPost.publicacion_id, usuario_id: currentUserId, titulo: editandoPost.titulo, contenido: editandoPost.contenido }),
    });
    if (res.ok) {
      setPosts(posts.map(p => p.publicacion_id === editandoPost.publicacion_id ? { ...p, titulo: editandoPost.titulo, contenido: editandoPost.contenido } : p));
      setEditandoPost(null);
    }
  };

  const handleCommentSubmit = async (e, publicId) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !currentUserId) return;
    const uNombre = localStorage.getItem('nombre_usuario') || "Usuario";
    const uPfp = localStorage.getItem('usuario_pfp');
    const res = await fetch('/api/comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: currentUserId, publicacion_id: publicId, contenido: nuevoComentario }),
    });
    if (res.ok) {
      const data = await res.json();
      const nuevo = { comentario_id: data.comentario_id, contenido: nuevoComentario, fecha_comentario: new Date().toISOString(), nombre: uNombre, pfp: uPfp, totalLikes: 0, iLiked: 0, usuario_id: currentUserId };
      setPosts(prev => prev.map(p => p.publicacion_id === publicId ? { ...p, comentarios: [nuevo, ...(p.comentarios || [])] } : p));
      setNuevoComentario('');
      setComentandoId(null);
      setComentariosVisibles(prev => ({ ...prev, [publicId]: (prev[publicId] || 1) + 1 }));
    }
  };

  const eliminarComentario = async (postId, commentId) => {
    if (!window.confirm("¿Eliminar comentario?")) return;
    const res = await fetch(`/api/comentarios?id=${commentId}&uid=${currentUserId}`, { method: 'DELETE' });
    if (res.ok) setPosts(posts.map(p => p.publicacion_id === postId ? { ...p, comentarios: p.comentarios.filter(c => c.comentario_id !== commentId) } : p));
  };

  const handleUpdateComentario = async (postId) => {
    if (!editandoComentario.contenido.trim()) return;
    const res = await fetch('/api/comentarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario_id: editandoComentario.comentario_id, usuario_id: currentUserId, contenido: editandoComentario.contenido }),
    });
    if (res.ok) {
      setPosts(posts.map(p => p.publicacion_id === postId ? { ...p, comentarios: p.comentarios.map(c => c.comentario_id === editandoComentario.comentario_id ? { ...c, contenido: editandoComentario.contenido } : c) } : p));
      setEditandoComentario(null);
    }
  };

  const handleLike = async (id, tipo) => {
    if (!currentUserId) return;
    setPosts(prev => prev.map(post => {
      if (tipo === 'post' && post.publicacion_id === id) {
        const isUnliking = post.iLiked === 1;
        return { ...post, iLiked: isUnliking ? 0 : 1, totalLikes: isUnliking ? post.totalLikes - 1 : post.totalLikes + 1 };
      }
      if (tipo === 'comment') {
        return { ...post, comentarios: post.comentarios.map(c => {
          if (c.comentario_id === id) {
            const isUnliking = c.iLiked === 1;
            return { ...c, iLiked: isUnliking ? 0 : 1, totalLikes: isUnliking ? c.totalLikes - 1 : c.totalLikes + 1 };
          }
          return c;
        })};
      }
      return post;
    }));
    await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario_id: currentUserId, id, tipo }) });
  };

  const toggleMasComentarios = (postId, total) => {
    const actual = comentariosVisibles[postId] || 1;
    setComentariosVisibles({ ...comentariosVisibles, [postId]: actual >= total ? 1 : actual + 5 });
  };

  const comunidadFields = [
    { name: 'titulo', label: 'Título del tema', placeholder: 'Título...', required: false },
    { name: 'contenido', label: 'Contenido', placeholder: '¿Qué quieres compartir?', type: 'textarea', required: true }
  ];

  return (
    <div className="mx-auto p-6 lg:p-10 max-w-[1400px]">
      <PageHeader title="Comunidad Whirlpool" subtitle="Comparte tus dudas y avances con el equipo" icon={Users} />

      {/* BUSCADOR DE POSTS */}
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            type="text"
            placeholder="Buscar por usuario, contenido o gema..."
            value={busquedaPosts}
            onChange={(e) => setBusquedaPosts(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
          {busquedaPosts && (
            <button onClick={() => setBusquedaPosts('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setFiltroGemas(!filtroGemas)}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            filtroGemas ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-blue-200 hover:text-blue-600'
          }`}
        >
          <Gem size={14} /> Con gema
        </button>
        <select
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-500 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
        >
          <option value="reciente">Más reciente</option>
          <option value="antiguo">Más antiguo</option>
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* COLUMNA PRINCIPAL */}
        <div className="w-full lg:w-2/3 space-y-8">
          {loading ? (
            <div className="text-center p-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></div>
          ) : postsFiltrados.length === 0 && (busquedaPosts || filtroGemas) ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
              <Search size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-bold">No se encontraron publicaciones</p>
              <button onClick={() => { setBusquedaPosts(''); setFiltroGemas(false); }} className="mt-3 text-blue-600 text-xs font-black hover:text-blue-700">
                Limpiar filtros
              </button>
            </div>
          ) : postsFiltrados.map((post) => {
            const esMio = String(post.usuario_id) === String(currentUserId);
            const limite = comentariosVisibles[post.publicacion_id] || 1;
            const comentariosAMostrar = post.comentarios?.slice(0, limite) || [];

            return (
              <SectionCard key={post.publicacion_id} title={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4 py-1">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold overflow-hidden border border-slate-100 shrink-0">
                      {post.pfp ? <img src={post.pfp} className="w-full h-full object-cover" alt="" /> : <span>{post.nombre?.[0]}</span>}
                    </div>
                    <div className="flex flex-col">
                      <Link href={`/perfil/${post.usuario_id}`} className="text-sm font-black text-slate-900 hover:text-blue-600 transition-colors leading-tight">{post.nombre}</Link>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(post.fecha_publicacion).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {esMio && !editandoPost && (
                    <div className="flex gap-1">
                      <button onClick={() => setEditandoPost({...post})} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Pencil size={14}/></button>
                      <button onClick={() => eliminarPost(post.publicacion_id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
              }>
                <div className="p-4 pt-2">
                  {editandoPost?.publicacion_id === post.publicacion_id ? (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl mb-6 border-2 border-blue-100 animate-in fade-in slide-in-from-top-1">
                      <input className="w-full p-3 font-black text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500" value={editandoPost.titulo} onChange={e => setEditandoPost({...editandoPost, titulo: e.target.value})} />
                      <textarea className="w-full p-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500 min-h-[120px] resize-none" value={editandoPost.contenido} onChange={e => setEditandoPost({...editandoPost, contenido: e.target.value})} />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setEditandoPost(null)} icon={X}>Cancelar</Button>
                        <Button onClick={handleUpdatePost} icon={Check}>Guardar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-xl font-black text-slate-900 mb-3">{post.titulo}</h4>
<p className="text-slate-600 leading-relaxed mb-6 font-medium whitespace-pre-wrap">{post.contenido}</p>

{/* Imágenes del post */}
{post.imagenes?.length > 0 && !editandoPost && (
  <div className={`grid gap-2 mb-6 ${
    post.imagenes.length === 1 ? 'grid-cols-1' : 
    post.imagenes.length === 2 ? 'grid-cols-2' : 
    'grid-cols-3'
  }`}>
    {post.imagenes.map((img) => (
      <div key={img.imagen_id} className="rounded-2xl overflow-hidden border border-slate-100">
        <img 
          src={img.url_imagen} 
          className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" 
          alt=""
          onClick={() => window.open(img.url_imagen, '_blank')}
        />
      </div>
    ))}
  </div>
)}
                    </>
                  )}

                  {post.gema && !editandoPost && (
                    <Link href={`/perfil/${post.usuario_id}`} className="block mb-6 group transition-all hover:scale-[1.01]">
                      <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Gem size={22} /></div>
                        <div className="flex-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Gema Compartida</span>
                          <h5 className="text-sm font-black text-slate-900">{post.gema.titulo}</h5>
                          <p className="text-xs text-slate-500 line-clamp-1">{post.gema.descripcion}</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  <div className="border-t border-slate-50 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button onClick={() => handleLike(post.publicacion_id, 'post')} className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${post.iLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
                          <Heart size={18} fill={post.iLiked ? "currentColor" : "none"} /> {post.totalLikes}
                        </button>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest"><MessageSquare size={18} /> {post.comentarios?.length || 0}</div>
                      </div>
                      <Button variant={comentandoId === post.publicacion_id ? "danger" : "pill"} onClick={() => setComentandoId(comentandoId === post.publicacion_id ? null : post.publicacion_id)}>{comentandoId === post.publicacion_id ? 'Cancelar' : 'Responder'}</Button>
                    </div>

                    {comentandoId === post.publicacion_id && (
                      <form onSubmit={(e) => handleCommentSubmit(e, post.publicacion_id)} className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <input className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Responder..." value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} autoFocus />
                        <Button className="px-4" icon={Send}>Enviar</Button>
                      </form>
                    )}

                    <div className="space-y-3">
                      {comentariosAMostrar.map((c) => {
                        const comentarioMio = String(c.usuario_id) === String(currentUserId);
                        const editandoEsteComm = editandoComentario?.comentario_id === c.comentario_id;
                        return (
                          <div key={c.comentario_id} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group/comm">
                            {editandoEsteComm ? (
                              <div className="space-y-2">
                                <input className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 ring-blue-500" value={editandoComentario.contenido} onChange={e => setEditandoComentario({...editandoComentario, contenido: e.target.value})} autoFocus />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditandoComentario(null)} className="text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                                  <button onClick={() => handleUpdateComentario(post.publicacion_id)} className="text-[10px] font-black uppercase text-blue-600">Guardar</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex gap-3 mb-2">
                                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200 flex items-center justify-center font-bold text-blue-600 text-[10px]">
                                    {c.pfp ? <img src={c.pfp} className="w-full h-full object-cover" alt="" /> : <span>{c.nombre?.[0]}</span>}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <Text className="text-xs">{c.nombre}</Text>
                                      {comentarioMio && (
                                        <div className="flex gap-2 opacity-0 group-hover/comm:opacity-100 transition-opacity">
                                          <button onClick={() => setEditandoComentario({...c})} className="text-slate-300 hover:text-blue-500"><Pencil size={12}/></button>
                                          <button onClick={() => eliminarComentario(post.publicacion_id, c.comentario_id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-500 leading-snug">{c.contenido}</p>
                                  </div>
                                </div>
                                <button onClick={() => handleLike(c.comentario_id, 'comment')} className={`flex items-center gap-1 ml-11 text-[9px] font-black uppercase transition-colors ${c.iLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
                                  <Heart size={14} fill={c.iLiked ? "currentColor" : "none"} /> {c.totalLikes}
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {post.comentarios?.length > 1 && (
                      <Button variant="pill" className="w-full" onClick={() => toggleMasComentarios(post.publicacion_id, post.comentarios.length)} icon={limite >= post.comentarios.length ? ChevronUp : ChevronDown}>
                        {limite >= post.comentarios.length ? "Mostrar menos" : `Cargar más (${post.comentarios.length - limite})`}
                      </Button>
                    )}
                  </div>
                </div>
              </SectionCard>
            );
          })}
          {loadingMore && <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}
        </div>

        {/* ASIDE DERECHO */}
        <aside className="hidden lg:block lg:w-1/3 lg:sticky lg:top-10 space-y-6">
          <SectionCard title="Nueva Publicación">
            <PostForm fields={comunidadFields} apiUrl="/api/comunidad" buttonText="Publicar Ahora" extraData={{ usuario_id: currentUserId }} onSuccess={() => { setHasMore(true); fetchPosts(true); }} />
          </SectionCard>

          <SectionCard title="Buscar Usuarios">
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o alias..."
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
                {buscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 animate-spin" size={14} />}
              </div>

              {resultadosBusqueda.length > 0 && (
                <div className="space-y-2">
                  {resultadosBusqueda.map(u => (
                    <Link
                      key={u.usuario_id}
                      href={String(u.usuario_id) === String(currentUserId) ? '/perfil' : `/perfil/${u.usuario_id}`}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-2xl transition-all group"
                    >
                      <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden shrink-0">
                        {u.pfp ? <img src={u.pfp} className="w-full h-full object-cover" alt="" /> : u.nombre?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                          {u.alias || u.nombre}
                        </p>
                        {u.alias && <p className="text-[10px] text-slate-400 font-medium truncate">{u.nombre}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {busquedaUsuario.trim().length >= 2 && !buscando && resultadosBusqueda.length === 0 && (
                <p className="text-slate-400 text-xs font-bold text-center py-4">No se encontraron usuarios</p>
              )}
              {busquedaUsuario.trim().length < 2 && busquedaUsuario.trim().length > 0 && (
                <p className="text-slate-300 text-xs font-bold text-center py-2">Escribe al menos 2 caracteres</p>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}