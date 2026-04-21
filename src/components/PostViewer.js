"use client";
import { useState, useEffect, useRef } from 'react';
import {
  X, Heart, MessageSquare, Send, ChevronLeft, ChevronRight,
  Trash2, Pencil, Check, MoreHorizontal, Loader2, Gem
} from 'lucide-react';
import Link from 'next/link';

/**
 * PostViewer — Modal estilo Instagram para ver un post completo.
 *
 * Props:
 *   post           {object}   El objeto post a mostrar (de /api/comunidad)
 *   currentUserId  {string}   ID del usuario autenticado
 *   onClose        {fn}       Llamado al cerrar el modal
 *   onPostUpdated  {fn}       Llamado con el post actualizado
 *   onPostDeleted  {fn}       Llamado con el publicacion_id eliminado
 */
export default function PostViewer({
  post: initialPost,
  currentUserId: currentUserIdProp,
  onClose,
  onPostUpdated,
  onPostDeleted,
}) {
  const [post, setPost] = useState(initialPost);
  const [activeImg, setActiveImg] = useState(0);

  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [editandoComentario, setEditandoComentario] = useState(null);
  const commEndRef = useRef(null);

  const [editandoPost, setEditandoPost] = useState(false);
  const [editTitulo, setEditTitulo] = useState(post.titulo || '');
  const [editContenido, setEditContenido] = useState(post.contenido || '');
  const [savingPost, setSavingPost] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Leer currentUserId de la prop o del localStorage directamente como fallback
  const currentUserId = String(
    currentUserIdProp ||
    (typeof window !== 'undefined' ? localStorage.getItem('usuario_id') : '') ||
    ''
  );

  // Comparar siempre como strings para evitar 1 !== "1"
  const esMio = Boolean(currentUserId && String(post.usuario_id) === currentUserId);

  const imagenes = post.imagenes || [];
  const comentarios = post.comentarios || [];
  const tieneImagenes = imagenes.length > 0;

  useEffect(() => {
    commEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comentarios.length]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── LIKES ──────────────────────────────────────────────── */
  const handleLikePost = async () => {
    const isUnliking = post.iLiked === 1;
    const updated = {
      ...post,
      iLiked: isUnliking ? 0 : 1,
      totalLikes: isUnliking ? post.totalLikes - 1 : post.totalLikes + 1,
    };
    setPost(updated);
    onPostUpdated?.(updated);
    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: currentUserId, id: post.publicacion_id, tipo: 'post' }),
    });
  };

  const handleLikeComentario = async (comentario_id) => {
    const updatedComentarios = post.comentarios.map(c => {
      if (c.comentario_id !== comentario_id) return c;
      const unlike = c.iLiked === 1;
      return { ...c, iLiked: unlike ? 0 : 1, totalLikes: unlike ? c.totalLikes - 1 : c.totalLikes + 1 };
    });
    setPost(p => ({ ...p, comentarios: updatedComentarios }));
    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: currentUserId, id: comentario_id, tipo: 'comment' }),
    });
  };

  /* ── COMENTARIOS ────────────────────────────────────────── */
  const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !currentUserId) return;
    setEnviandoComentario(true);
    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: currentUserId,
          publicacion_id: post.publicacion_id,
          contenido: nuevoComentario,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const nombre = localStorage.getItem('nombre_usuario') || 'Tú';
        const pfp = localStorage.getItem('usuario_pfp') || null;
        const nuevo = {
          comentario_id: data.comentario_id,
          contenido: nuevoComentario,
          fecha_comentario: new Date().toISOString(),
          nombre,
          pfp,
          totalLikes: 0,
          iLiked: 0,
          usuario_id: currentUserId,
        };
        const updated = { ...post, comentarios: [...comentarios, nuevo] };
        setPost(updated);
        onPostUpdated?.(updated);
        setNuevoComentario('');
      }
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleEliminarComentario = async (comentario_id) => {
    if (!window.confirm('¿Eliminar comentario?')) return;
    const res = await fetch(`/api/comentarios?id=${comentario_id}&uid=${currentUserId}`, { method: 'DELETE' });
    if (res.ok) {
      const updated = { ...post, comentarios: comentarios.filter(c => c.comentario_id !== comentario_id) };
      setPost(updated);
      onPostUpdated?.(updated);
    }
  };

  const handleGuardarComentario = async () => {
    if (!editandoComentario?.contenido.trim()) return;
    const res = await fetch('/api/comentarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comentario_id: editandoComentario.comentario_id,
        usuario_id: currentUserId,
        contenido: editandoComentario.contenido,
      }),
    });
    if (res.ok) {
      const updated = {
        ...post,
        comentarios: comentarios.map(c =>
          c.comentario_id === editandoComentario.comentario_id
            ? { ...c, contenido: editandoComentario.contenido }
            : c
        ),
      };
      setPost(updated);
      onPostUpdated?.(updated);
      setEditandoComentario(null);
    }
  };

  /* ── EDITAR / ELIMINAR POST ─────────────────────────────── */
  const handleGuardarPost = async () => {
    setSavingPost(true);
    const res = await fetch('/api/comunidad', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicacion_id: post.publicacion_id,
        usuario_id: currentUserId,
        titulo: editTitulo,
        contenido: editContenido,
      }),
    });
    if (res.ok) {
      const updated = { ...post, titulo: editTitulo, contenido: editContenido };
      setPost(updated);
      onPostUpdated?.(updated);
      setEditandoPost(false);
    }
    setSavingPost(false);
  };

  const handleEliminarPost = async () => {
    if (!window.confirm('¿Eliminar esta publicación permanentemente?')) return;
    const res = await fetch(`/api/comunidad?id=${post.publicacion_id}&uid=${currentUserId}`, { method: 'DELETE' });
    if (res.ok) {
      onPostDeleted?.(post.publicacion_id);
      onClose();
    }
  };

  /* ── HELPERS ────────────────────────────────────────────── */
  const formatFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  const formatHora = (fecha) =>
    new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const miPfp = typeof window !== 'undefined' ? localStorage.getItem('usuario_pfp') : null;
  const miNombre = typeof window !== 'undefined' ? localStorage.getItem('nombre_usuario') : '?';

  /* ── COLUMNA DERECHA ────────────────────────────────────── */
  const RightColumn = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
        <Link
          href={String(post.usuario_id) === currentUserId ? '/perfil' : `/perfil/${post.usuario_id}`}
          onClick={onClose}
          className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center font-bold text-blue-600 text-sm"
        >
          {post.pfp
            ? <img src={post.pfp} className="w-full h-full object-cover" alt="" />
            : post.nombre?.[0]
          }
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={String(post.usuario_id) === currentUserId ? '/perfil' : `/perfil/${post.usuario_id}`}
            onClick={onClose}
            className="text-sm font-black text-slate-900 hover:text-blue-600 transition-colors block truncate"
          >
            {post.nombre}
          </Link>
          <p className="text-[10px] text-slate-400 font-medium">{formatFecha(post.fecha_publicacion)}</p>
        </div>

        {esMio && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 w-40 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => { setEditandoPost(true); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Pencil size={14} /> Editar
                </button>
                <button
                  onClick={() => { handleEliminarPost(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="px-4 py-3 border-b border-slate-100 shrink-0">
        {editandoPost ? (
          <div className="space-y-2">
            <input
              autoFocus
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              value={editTitulo}
              onChange={e => setEditTitulo(e.target.value)}
              placeholder="Título..."
            />
            <textarea
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
              value={editContenido}
              onChange={e => setEditContenido(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditandoPost(false)}
                className="px-3 py-1.5 text-xs font-black text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPost}
                disabled={savingPost}
                className="px-4 py-1.5 text-xs font-black bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingPost ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div>
            {post.titulo && (
              <p className="font-black text-slate-900 text-sm mb-1 leading-tight">{post.titulo}</p>
            )}
            {post.contenido && (
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{post.contenido}</p>
            )}
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
          </div>
        )}
      </div>

      {/* LISTA DE COMENTARIOS */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {comentarios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-300">
            <MessageSquare size={24} strokeWidth={1.5} className="mb-2" />
            <p className="text-xs font-bold text-slate-400">Sin comentarios</p>
            <p className="text-[10px] text-slate-300 mt-0.5">Sé el primero en responder</p>
          </div>
        )}

        {comentarios.map(c => {
          const esMiComentario = String(c.usuario_id) === currentUserId;
          const editandoEste = editandoComentario?.comentario_id === c.comentario_id;
          return (
            <div key={c.comentario_id} className="flex gap-2.5 group/c">
              <Link
                href={String(c.usuario_id) === currentUserId ? '/perfil' : `/perfil/${c.usuario_id}`}
                onClick={onClose}
                className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center font-bold text-blue-600 text-[10px] border border-slate-200 mt-0.5"
              >
                {c.pfp
                  ? <img src={c.pfp} className="w-full h-full object-cover" alt="" />
                  : c.nombre?.[0]
                }
              </Link>
              <div className="flex-1 min-w-0">
                {editandoEste ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      className="flex-1 p-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      value={editandoComentario.contenido}
                      onChange={e => setEditandoComentario({ ...editandoComentario, contenido: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleGuardarComentario()}
                    />
                    <button onClick={handleGuardarComentario} className="text-blue-600 hover:text-blue-700 shrink-0">
                      <Check size={15} />
                    </button>
                    <button onClick={() => setEditandoComentario(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="inline-block bg-slate-50 rounded-2xl rounded-tl-none px-3 py-2 max-w-full">
                      <span className="text-[11px] font-black text-slate-900 block">{c.nombre}</span>
                      <span className="text-sm text-slate-600 leading-snug break-words">{c.contenido}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 ml-1">
                      <span className="text-[10px] text-slate-400">{formatHora(c.fecha_comentario)}</span>
                      <button
                        onClick={() => handleLikeComentario(c.comentario_id)}
                        className={`flex items-center gap-1 text-[10px] font-black transition-colors ${c.iLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                      >
                        <Heart size={11} fill={c.iLiked ? 'currentColor' : 'none'} />
                        {c.totalLikes > 0 && c.totalLikes}
                      </button>
                      {esMiComentario && (
                        <>
                          <button
                            onClick={() => setEditandoComentario({ comentario_id: c.comentario_id, contenido: c.contenido })}
                            className="text-[10px] font-black text-slate-300 hover:text-blue-500 opacity-0 group-hover/c:opacity-100 transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarComentario(c.comentario_id)}
                            className="text-[10px] font-black text-slate-300 hover:text-red-500 opacity-0 group-hover/c:opacity-100 transition-all"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={commEndRef} />
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-50">
          <button
            onClick={handleLikePost}
            className={`flex items-center gap-1.5 font-black transition-all active:scale-90 ${post.iLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
          >
            <Heart size={20} fill={post.iLiked ? 'currentColor' : 'none'} />
            <span className="text-xs">{post.totalLikes || 0}</span>
          </button>
          <div className="flex items-center gap-1.5 text-slate-400">
            <MessageSquare size={18} />
            <span className="text-xs font-black">{comentarios.length}</span>
          </div>
          <p className="ml-auto text-[10px] text-slate-300 font-medium">{formatFecha(post.fecha_publicacion)}</p>
        </div>

        <form onSubmit={handleEnviarComentario} className="flex items-center gap-2 px-4 py-2.5">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center text-blue-600 font-bold text-[10px] border border-slate-200">
            {miPfp
              ? <img src={miPfp} className="w-full h-full object-cover" alt="" />
              : miNombre?.[0] || '?'
            }
          </div>
          <input
            value={nuevoComentario}
            onChange={e => setNuevoComentario(e.target.value)}
            placeholder="Agrega un comentario..."
            disabled={enviandoComentario}
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!nuevoComentario.trim() || enviandoComentario}
            className="text-blue-600 hover:text-blue-700 font-black text-xs disabled:opacity-30 transition-all"
          >
            {enviandoComentario ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </div>
  );

  /* ── RENDER ─────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-white transition-all shadow-md"
      >
        <X size={18} />
      </button>

      {tieneImagenes ? (
        /* ── CON IMAGEN: dos columnas, imagen 3:4 vertical ── */
        <div
          className="flex bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
          style={{ height: '85vh', width: 'min(960px, 95vw)' }}
        >
          {/* Columna imagen: ancho = altura * 3/4 */}
          <div
            className="relative bg-slate-950 shrink-0 flex items-center justify-center overflow-hidden"
            style={{ width: 'calc(85vh * 0.75)' }}
          >
            <img
              src={imagenes[activeImg]?.url_imagen}
              alt=""
              className="w-full h-full object-cover"
            />
            {imagenes.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg(i => Math.max(0, i - 1))}
                  disabled={activeImg === 0}
                  className="absolute left-2 w-8 h-8 bg-black/30 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-0"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setActiveImg(i => Math.min(imagenes.length - 1, i + 1))}
                  disabled={activeImg === imagenes.length - 1}
                  className="absolute right-2 w-8 h-8 bg-black/30 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-0"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 flex gap-1.5">
                  {imagenes.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`h-1.5 rounded-full transition-all ${i === activeImg ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Columna derecha: toma el espacio restante */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <RightColumn />
          </div>
        </div>
      ) : (
        /* ── SIN IMAGEN: una columna, ancho fijo ── */
        <div
          className="flex bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 w-full max-w-md"
          style={{ height: '85vh' }}
        >
          <RightColumn />
        </div>
      )}
    </div>
  );
}