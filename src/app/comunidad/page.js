"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Loader2, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Plus, X, Send, Heart, Gem, Pencil, Trash2, Check, Search
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { PageHeader, Title, Text } from '@/components/Typography';
import { SectionCard } from '@/components/SectionCard';
import PostForm from '@/components/PostForm';
import PostViewer from '@/components/PostViewer';

export default function ComunidadPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 5;
  
  const isFetching = useRef(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);

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

  const [viewerPost, setViewerPost] = useState(null);

  const fetchPosts = useCallback(async (isInitial = false) => {
    if (isFetching.current || (!isInitial && !hasMoreRef.current)) return;
    isFetching.current = true;
    const uid = localStorage.getItem('usuario_id') || 0;
    const currentOffset = isInitial ? 0 : offsetRef.current;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/comunidad?limit=${limit}&offset=${currentOffset}&myId=${uid}`);
      const newData = await res.json();

      if (isInitial) {
        setPosts(newData);
        hasMoreRef.current = newData.length === limit;
        setHasMore(newData.length === limit);
        offsetRef.current = newData.length;
      } else {
        if (!newData || newData.length === 0) {
          hasMoreRef.current = false;
          setHasMore(false);
        } else {
          setPosts(prev => {
            const ids = new Set(prev.map(p => String(p.publicacion_id)));
            return [...prev, ...newData.filter(p => !ids.has(String(p.publicacion_id)))];
          });
          offsetRef.current += newData.length;
          hasMoreRef.current = newData.length === limit;
        }
      }
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      setLoadingMore(false);
      isFetching.current = false;
    }
  }, [limit]);

  useEffect(() => {
    const uid = localStorage.getItem('usuario_id');
    if (uid) setCurrentUserId(uid);
    fetchPosts(true);
  }, [fetchPosts]);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      if (document.documentElement.scrollHeight - window.innerHeight - window.scrollY < 400) {
        if (!isFetching.current && hasMoreRef.current) fetchPosts();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchPosts]);

  useEffect(() => {
    if (busquedaUsuario.trim().length < 2) { setResultadosBusqueda([]); return; }
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/usuarios/buscar?q=${busquedaUsuario}`);
        const data = await res.json();
        setResultadosBusqueda(data);
      } catch (e) { console.error(e); }
      finally { setBuscando(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [busquedaUsuario]);

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
    .sort((a, b) => filtroFecha === 'reciente'
      ? new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
      : new Date(a.fecha_publicacion) - new Date(b.fecha_publicacion)
    );

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

const PostImageCarousel = ({ imagenes, onOpenViewer }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  return (
    <div className="relative group">
      <img
        src={imagenes[activeImageIndex].url_imagen}
        className="w-full h-full object-cover cursor-pointer"
        onClick={onOpenViewer}
      />

      {imagenes.length > 1 && (
        <>
          {activeImageIndex > 0 && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => i - 1); }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {activeImageIndex < imagenes.length - 1 && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
              onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => i + 1); }}
            >
              <ChevronRight size={20} />
            </button>
          )}

          <div className="absolute bottom-3 w-full flex gap-1.5 items-center justify-center">
            {imagenes.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

  const comunidadFields = [
    { name: 'titulo', label: 'Título del tema', placeholder: 'Título...', required: false },
    { name: 'contenido', label: 'Contenido', placeholder: '¿Qué quieres compartir?', type: 'textarea', required: true }
  ];

  return (
    <div className="mx-auto p-6 lg:p-10 max-w-[1800px]">
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

      <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">

        {/* COLUMNA PRINCIPAL */}
        <div className="max-w-[600px] lg:w-2/3 space-y-8">
          {loading ? (
        <div className="text-center py-20">
          <Loader2 className="animate-spin mx-auto text-blue-600" />
        </div>
      ) : (
        posts.map(post => {
          const primerComentario = post.comentarios?.[0];

          return (
            <div key={post.publicacion_id} className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">

              {/* HEADER */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                  {post.pfp && <img src={post.pfp} className="w-full h-full object-cover" />}
                </div>
                <Link href={`/perfil/${post.usuario_id}`} className="font-semibold text-sm">
                  {post.nombre}
                </Link>
              </div>

              {/* IMAGEN */}
              {post.imagenes?.length > 0 && (
                <div>
                  <PostImageCarousel 
                    imagenes={post.imagenes} 
                    onOpenViewer={() => setViewerPost(post)} 
                  />

                  <div className="p-3 space-y-2">

                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(post.publicacion_id)}>
                        <Heart
                          size={22}
                          className={post.iLiked ? "text-red-500" : "text-slate-600"}
                          fill={post.iLiked ? "currentColor" : "none"}
                        />
                      </button>
                      <button onClick={() => setViewerPost(post)}>
                        <MessageSquare size={22} className="text-slate-600" />
                      </button>
                    </div>

                    <p className="text-sm font-semibold">
                      {post.totalLikes} me gusta
                    </p>

                    <p className="text-sm">
                      <span className="font-semibold">{post.nombre}</span>{" "}
                      {post.contenido}
                    </p>

                    {post.gema && (
                      <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <Gem size={14} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase text-blue-400 leading-none mb-0.5">Gema compartida</p>
                          <p className="text-xs font-bold text-slate-800 truncate">{post.gema.titulo}</p>
                          {post.gema.descripcion && (
                            <p className="text-[10px] text-slate-400 truncate">{post.gema.descripcion}</p>
                          )}
                        </div>
                      </div>
                  )}

                    {/* SOLO 1 COMENTARIO */}
                    {primerComentario && (
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">{primerComentario.nombre}</span>{" "}
                        {primerComentario.contenido}
                      </p>
                    )}

                    {/* VER MÁS → abre modal */}
                    {post.comentarios?.length > 1 && (
                      <button
                        onClick={() => setViewerPost(post)}
                        className="text-sm text-slate-400"
                      >
                        Ver los {post.comentarios.length} comentarios
                      </button>
                    )}
                  </div>
                </div>
              )}

              {post.imagenes?.length == 0 && (
                <div className="p-3 space-y-3">

                  <p className="text-sm">
                    {post.contenido}
                  </p>

                  {post.gema && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Gem size={14} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase text-blue-400 leading-none mb-0.5">Gema compartida</p>
                        <p className="text-xs font-bold text-slate-800 truncate">{post.gema.titulo}</p>
                        {post.gema.descripcion && (
                          <p className="text-[10px] text-slate-400 truncate">{post.gema.descripcion}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <button onClick={() => handleLike(post.publicacion_id)}>
                      <Heart
                        size={22}
                        className={post.iLiked ? "text-red-500" : "text-slate-600"}
                        fill={post.iLiked ? "currentColor" : "none"}
                      />
                    </button>
                    <button onClick={() => setViewerPost(post)}>
                      <MessageSquare size={22} className="text-slate-600" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold">
                    {post.totalLikes} me gusta
                  </p>

                  {/* SOLO 1 COMENTARIO */}
                  {primerComentario && (
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">{primerComentario.nombre}</span>{" "}
                      {primerComentario.contenido}
                    </p>
                  )}

                  {/* VER MÁS → abre modal */}
                  {post.comentarios?.length > 1 && (
                    <button
                      onClick={() => setViewerPost(post)}
                      className="text-sm text-slate-400"
                    >
                      Ver los {post.comentarios.length} comentarios
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })
      )}

      {loadingMore && (
        <div className="py-10 flex justify-center">
          <Loader2 className="animate-spin text-blue-600" />
        </div>
      )}

      {/* MODAL */}
      {viewerPost && (
        <PostViewer
          post={viewerPost}
          currentUserId={currentUserId}
          onClose={() => setViewerPost(null)}
          onPostUpdated={(updated) => {
            setPosts(prev =>
              prev.map(p =>
                p.publicacion_id === updated.publicacion_id ? updated : p
              )
            );
            setViewerPost(updated);
          }}
          onPostDeleted={(id) => {
            setPosts(prev => prev.filter(p => p.publicacion_id !== id));
            setViewerPost(null);
          }}
        />
      )}
        </div>

        {/* ASIDE DERECHO */}
        <aside className="hidden justify-right lg:block lg:w-1/3 lg:sticky lg:top-10 space-y-6">
          <SectionCard title="Nueva Publicación">
            <PostForm fields={comunidadFields} apiUrl="/api/comunidad" buttonText="Publicar Ahora" extraData={{ usuario_id: currentUserId }} onSuccess={() => { hasMoreRef.current = true; fetchPosts(true); }} />
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}