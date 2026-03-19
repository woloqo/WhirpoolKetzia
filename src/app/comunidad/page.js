"use client";
import { useState, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';

export default function ComunidadPage() {
  const [posts, setPosts] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const res = await fetch('/api/comunidad');
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = localStorage.getItem('usuario_id');
    if (!contenido.trim() || !uid) return;

    const res = await fetch('/api/comunidad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        usuario_id: uid, 
        titulo: titulo || 'Sin título', 
        contenido: contenido 
      }),
    });

    if (res.ok) {
      setTitulo('');
      setContenido('');
      fetchPosts();
    }
  };

  return (
    <div className="mx-auto p-6 lg:p-10">
      {/* Título de la página */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
           Comunidad Whirlpool
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Comparte tus dudas y avances con el equipo.</p>
      </div>

      {/* CONTENEDOR DE DOS COLUMNAS */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-2/3 space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Publicaciones recientes</h2>
          
          {loading ? (
            <div className="text-center p-20 bg-white rounded-[2rem] border border-slate-100 text-slate-400">
              Cargando feed...
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.publicacion_id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                    {post.nombre ? post.nombre[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-none">{post.nombre}</h3>
                    <span className="text-xs text-slate-400 font-medium">{new Date(post.fecha_publicacion).toLocaleDateString()}</span>
                  </div>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{post.titulo}</h4>
                <p className="text-slate-600 leading-relaxed">{post.contenido}</p>
              </article>
            ))
          )}
        </div>

        <aside className="w-full lg:w-1/3 lg:sticky lg:top-44">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-6">Nueva Publicación</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Título</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Dale un nombre..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Contenido</label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="¿Qué quieres compartir?"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none text-sm"
                />
              </div>

              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                Publicar Ahora <Send size={18} />
              </button>
            </form>
          </div>

          <div className="mt-6 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              Recuerda ser respetuoso y ayudar a tus compañeros de Whirlpool. ¡La comunidad la hacemos todos!
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}