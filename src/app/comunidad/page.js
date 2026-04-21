"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageSquare, Loader2, Users, ChevronLeft, ChevronRight,
  X, Heart, Gem, Search, Tag, Plus
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/Typography';
import { SectionCard } from '@/components/SectionCard';
import PostForm from '@/components/PostForm';
import PostViewer from '@/components/PostViewer';

const COLORES_GEMA = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600',
];

function GemaCardInline({ gema, colorIndex = 0 }) {
  const color = COLORES_GEMA[colorIndex % COLORES_GEMA.length];
  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-slate-100">
      <div className={`bg-gradient-to-br ${color} px-4 py-2 flex items-center gap-2`}>
        <Gem size={14} className="text-white opacity-90" />
        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Gema compartida</span>
      </div>
      <div className="px-4 py-3 bg-white">
        <p className="text-xs font-black text-slate-800 mb-0.5">{gema.titulo}</p>
        {gema.descripcion && (
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{gema.descripcion}</p>
        )}
        {gema.categorias?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {gema.categorias.map(cat => (
              <span key={cat.categoria_id}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase tracking-wide border border-blue-100/50">
                <Tag size={8} /> {cat.nombre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostImageCarousel({ imagenes, onOpenViewer }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  return (
    <div className="relative group">
      <img src={imagenes[activeImageIndex].url_imagen}
        className="w-full object-cover cursor-pointer max-h-[500px]"
        onClick={onOpenViewer} alt="" />
      {imagenes.length > 1 && (
        <>
          {activeImageIndex > 0 && (
            <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full"
              onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => i - 1); }}>
              <ChevronLeft size={18} />
            </button>
          )}
          {activeImageIndex < imagenes.length - 1 && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full"
              onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => i + 1); }}>
              <ChevronRight size={18} />
            </button>
          )}
          <div className="absolute bottom-3 w-full flex gap-1.5 items-center justify-center">
            {imagenes.map((_, i) => (
              <button key={i} onClick={() => setActiveImageIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PostCard({ post, currentUserId, onLike, onOpenViewer }) {
  const primerComentario = post.comentarios?.[0];
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <Link href={String(post.usuario_id) === String(currentUserId) ? '/perfil' : `/perfil/${post.usuario_id}`}
          className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center font-bold text-blue-600 text-sm">
          {post.pfp ? <img src={post.pfp} className="w-full h-full object-cover" alt="" /> : post.nombre?.[0]}
        </Link>
        <Link href={String(post.usuario_id) === String(currentUserId) ? '/perfil' : `/perfil/${post.usuario_id}`}
          className="font-semibold text-sm hover:text-blue-600 transition-colors">
          {post.nombre}
        </Link>
      </div>

      {post.imagenes?.length > 0 && (
        <PostImageCarousel imagenes={post.imagenes} onOpenViewer={() => onOpenViewer(post)} />
      )}

      <div className="p-3">
        {(post.titulo || post.contenido) && (
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {post.titulo && <span className="font-semibold">{post.titulo} </span>}
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {post.contenido}
            </p>

          </div>
        )}

        {post.gema && <GemaCardInline gema={post.gema} colorIndex={post.publicacion_id % COLORES_GEMA.length} />}

        <div className="flex items-center pt-2">
          <button onClick={() => onLike(post.publicacion_id, 'post')} className="transition-transform active:scale-90">
            <Heart size={22}
              className={post.iLiked ? 'text-red-500' : 'text-slate-600 hover:text-red-400 transition-colors'}
              fill={post.iLiked ? 'currentColor' : 'none'} />
          </button>
          <p className="text-sm font-semibold pl-1 pr-4">{post.totalLikes || 0}</p>

          <button onClick={() => onOpenViewer(post)}>
            <MessageSquare size={22} className="text-slate-600 hover:text-blue-500 transition-colors" />
          </button>
        </div>

        {primerComentario && (
          <p className="text-sm text-slate-600">
            <span className="font-semibold">{primerComentario.nombre}</span>{' '}
            {primerComentario.contenido}
          </p>
        )}
        
        {post.comentarios?.length > 1 && (
          <button onClick={() => onOpenViewer(post)} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Ver los {post.comentarios.length} comentarios
          </button>
        )}

        <button onClick={() => onOpenViewer(post)} className="text-sm text-slate-300 hover:text-slate-500 transition-colors">
          Agrega un comentario...
        </button>

      </div>
    </div>
  );
}

function NuevaPublicacionModal({ currentUserId, onSuccess, onClose }) {
  const campos = [
    { name: 'titulo', label: 'Título del tema', placeholder: 'Título...', required: false },
    { name: 'contenido', label: 'Contenido', placeholder: '¿Qué quieres compartir?', type: 'textarea', required: true }
  ];
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-900 text-lg">Nueva Publicación</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all">
            <X size={18} />
          </button>
        </div>
        <PostForm fields={campos} apiUrl="/api/comunidad" buttonText="Publicar Ahora"
          extraData={{ usuario_id: currentUserId }}
          onSuccess={() => { onSuccess(); onClose(); }} />
      </div>
    </div>
  );
}

function SearchResults({ usuarios, posts, onSelectUser, onSelectPost, query }) {
  if (!query || query.trim().length < 2) return null;
  const hasResults = usuarios.length > 0 || posts.length > 0;
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-30 overflow-hidden max-h-80 overflow-y-auto">
      {!hasResults ? (
        <div className="p-6 text-center text-slate-400 text-sm font-medium">Sin resultados para "{query}"</div>
      ) : (
        <>
          {usuarios.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[9px] font-black text-slate-300 uppercase tracking-widest">Usuarios</p>
              {usuarios.slice(0, 3).map(u => (
                <button key={u.usuario_id} onClick={() => onSelectUser(u)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
                    {u.pfp ? <img src={u.pfp} className="w-full h-full object-cover" alt="" /> : u.nombre?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{u.alias || u.nombre}</p>
                    {u.alias && <p className="text-[10px] text-slate-400">{u.nombre}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {posts.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[9px] font-black text-slate-300 uppercase tracking-widest">Publicaciones</p>
              {posts.slice(0, 4).map(p => (
                <button key={p.publicacion_id} onClick={() => onSelectPost(p)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                    {p.imagenes?.[0]
                      ? <img src={p.imagenes[0].url_imagen} className="w-full h-full object-cover" alt="" />
                      : <MessageSquare size={14} className="text-slate-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{p.titulo || p.contenido}</p>
                    <p className="text-[10px] text-slate-400">{p.nombre}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ComunidadPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 5;

  const isFetching = useRef(false);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchUsuarios, setSearchUsuarios] = useState([]);
  const [searchPosts, setSearchPosts] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [viewerPost, setViewerPost] = useState(null);
  const [showNuevaPublicacion, setShowNuevaPublicacion] = useState(false);

  const [filtroGemas, setFiltroGemas] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('reciente');

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
        offsetRef.current = newData.length;
      } else {
        if (!newData || newData.length === 0) {
          hasMoreRef.current = false;
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
    finally { setLoading(false); setLoadingMore(false); isFetching.current = false; }
  }, [limit]);

  useEffect(() => {
    const uid = localStorage.getItem('usuario_id');
    if (uid) setCurrentUserId(uid);
    fetchPosts(true);
  }, [fetchPosts]);

  useEffect(() => {
    const handleScroll = () => {
      if (document.documentElement.scrollHeight - window.innerHeight - window.scrollY < 400) {
        if (!isFetching.current && hasMoreRef.current) fetchPosts();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchPosts]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Búsqueda unificada
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchUsuarios([]); setSearchPosts([]); setShowSearchResults(false); return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      setShowSearchResults(true);
      try {
        const res = await fetch(`/api/usuario/buscar?q=${encodeURIComponent(searchQuery)}`);
        const usuarios = await res.json();
        setSearchUsuarios(Array.isArray(usuarios) ? usuarios : []);
        const q = searchQuery.toLowerCase();
        setSearchPosts(posts.filter(p =>
          p.nombre?.toLowerCase().includes(q) ||
          p.contenido?.toLowerCase().includes(q) ||
          p.titulo?.toLowerCase().includes(q) ||
          p.gema?.titulo?.toLowerCase().includes(q)
        ));
      } catch (e) { console.error(e); }
      finally { setBuscando(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, posts]);

  const handleLike = useCallback(async (id, tipo) => {
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
    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: currentUserId, id, tipo }),
    });
  }, [currentUserId]);

  const postsMostrados = posts
    .filter(post => filtroGemas ? !!post.gema : true)
    .sort((a, b) =>
      filtroFecha === 'reciente'
        ? new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion)
        : new Date(a.fecha_publicacion) - new Date(b.fecha_publicacion)
    );

  const comunidadFields = [
    { name: 'titulo', label: 'Título del tema', placeholder: 'Título...', required: false },
    { name: 'contenido', label: 'Contenido', placeholder: '¿Qué quieres compartir?', type: 'textarea', required: true }
  ];

  return (
    <div className="mx-auto p-4 lg:p-10 max-w-[1800px]">
      <PageHeader title="Comunidad Whirlpool" subtitle="Comparte tus dudas y avances con el equipo" icon={Users} />

      {/* Buscador unificado */}
      <div className="relative mb-4" ref={searchRef}>
        <div className="bg-white rounded-[2rem] p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input type="text"
              placeholder="Buscar usuarios, publicaciones o gemas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
              className="w-full pl-9 pr-9 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
            {buscando && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 animate-spin" size={14} />}
            {searchQuery && !buscando && (
              <button onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={() => setFiltroGemas(!filtroGemas)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
              filtroGemas ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-blue-200 hover:text-blue-600'
            }`}>
            <Gem size={14} /> Con gema
          </button>
          <select value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-500 outline-none cursor-pointer shrink-0">
            <option value="reciente">Más reciente</option>
            <option value="antiguo">Más antiguo</option>
          </select>
        </div>

        {showSearchResults && (
          <SearchResults usuarios={searchUsuarios} posts={searchPosts} query={searchQuery}
            onSelectUser={(u) => {
              setShowSearchResults(false); setSearchQuery('');
              window.location.href = String(u.usuario_id) === String(currentUserId) ? '/perfil' : `/perfil/${u.usuario_id}`;
            }}
            onSelectPost={(p) => { setViewerPost(p); setShowSearchResults(false); setSearchQuery(''); }} />
        )}
      </div>

      {/* Botón nueva publicación — solo móvil */}
      <div className="lg:hidden mb-4">
        <button onClick={() => setShowNuevaPublicacion(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
          <Plus size={18} /> Nueva Publicación
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
        <div className="w-full lg:max-w-[600px] lg:w-2/3 space-y-4">
          {loading ? (
            <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></div>
          ) : postsMostrados.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-slate-100">
              <MessageSquare size={36} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-bold text-sm">No hay publicaciones</p>
              {filtroGemas && (
                <button onClick={() => setFiltroGemas(false)} className="mt-3 text-blue-600 text-xs font-black hover:text-blue-700">Quitar filtro</button>
              )}
            </div>
          ) : (
            postsMostrados.map(post => (
              <PostCard key={post.publicacion_id} post={post} currentUserId={currentUserId}
                onLike={handleLike} onOpenViewer={setViewerPost} />
            ))
          )}
          {loadingMore && (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={24} /></div>
          )}
        </div>

        <aside className="hidden lg:block lg:w-1/3 lg:sticky lg:top-10 space-y-6">
          <SectionCard title="Nueva Publicación">
            <PostForm fields={comunidadFields} apiUrl="/api/comunidad" buttonText="Publicar Ahora"
              extraData={{ usuario_id: currentUserId }}
              onSuccess={() => { hasMoreRef.current = true; fetchPosts(true); }} />
          </SectionCard>
        </aside>
      </div>

      {showNuevaPublicacion && (
        <NuevaPublicacionModal currentUserId={currentUserId}
          onSuccess={() => { hasMoreRef.current = true; fetchPosts(true); }}
          onClose={() => setShowNuevaPublicacion(false)} />
      )}

      {viewerPost && (
        <PostViewer post={viewerPost} currentUserId={currentUserId}
          onClose={() => setViewerPost(null)}
          onPostUpdated={(updated) => {
            setPosts(prev => prev.map(p => p.publicacion_id === updated.publicacion_id ? updated : p));
            setViewerPost(updated);
          }}
          onPostDeleted={(id) => {
            setPosts(prev => prev.filter(p => p.publicacion_id !== id));
            setViewerPost(null);
          }} />
      )}
    </div>
  );
}