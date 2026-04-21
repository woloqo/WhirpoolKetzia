"use client";
import { useState, useEffect } from 'react';
import { Gem, Search, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import GemaCard from '@/components/GemaCard';


export default function GemasPage() {
  const [gemas, setGemas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const uid = localStorage.getItem('usuario_id');
    if (uid) setCurrentUserId(uid);

    // Cargar categorías
    fetch('/api/categorias')
      .then(res => res.json())
      .then(data => setCategorias(Array.isArray(data) ? data : []));

    // Cargar todas las gemas
    fetch('/api/gemas/explorar')
      .then(res => res.json())
      .then(data => {
        setGemas(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Búsqueda fonética con debounce
  useEffect(() => {
    if (busqueda.trim().length < 2) return;

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/gemas/buscar?q=${busqueda}`);
        const data = await res.json();

        const Fuse = (await import('fuse.js')).default;
        const fuse = new Fuse(data, {
          keys: ['titulo', 'descripcion', 'nombre', 'alias'],
          threshold: 0.4,
          ignoreLocation: true,
        });
        const resultados = fuse.search(busqueda).map(r => r.item);
        setGemas(resultados.length > 0 ? resultados : data);
      } catch (e) { console.error(e); }
      finally { setBuscando(false); }
    }, 400);

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Si se limpia la búsqueda, recargar todas
  useEffect(() => {
    if (busqueda.trim().length === 0) {
      setLoading(true);
      fetch('/api/gemas/explorar')
        .then(res => res.json())
        .then(data => {
          setGemas(Array.isArray(data) ? data : []);
          setLoading(false);
        });
    }
  }, [busqueda]);

  // Filtrar por categoría y búsqueda
  const gemesFiltradas = gemas.filter(g => {
    if (categoriaActiva && !g.categorias?.some(c => c.categoria_id === categoriaActiva)) return false;
    return true;
  });

  // Agrupar por categoría para el explorador
  const gemasAgrupadas = categorias.map(cat => ({
    ...cat,
    gemas: gemesFiltradas.filter(g => g.categorias?.some(c => c.categoria_id === cat.categoria_id))
  })).filter(cat => cat.gemas.length > 0);

  const gemassinCategoria = gemesFiltradas.filter(g => !g.categorias?.length);

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-10 pb-32">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Gem size={36} className="text-blue-600" /> Explorador de Gemas
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">Descubre los logros y habilidades de tus compañeros</p>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Buscar gemas por título, descripción o autor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
          {buscando && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 animate-spin" size={16} />}
          {busqueda && !buscando && (
            <button onClick={() => setBusqueda('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filtros de categoría */}
      <div className="flex flex-wrap gap-2 mb-10">
        <button
          onClick={() => setCategoriaActiva(null)}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            !categoriaActiva ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-blue-200 hover:text-blue-600'
          }`}
        >
          Todas
        </button>
        {categorias.map(cat => (
          <button
            key={cat.categoria_id}
            onClick={() => setCategoriaActiva(categoriaActiva === cat.categoria_id ? null : cat.categoria_id)}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              categoriaActiva === cat.categoria_id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-slate-300" size={36} />
            <p className="text-slate-400 text-sm font-medium">Yendo al almacen de gemas...</p>
          </div>
        </div>
      ) : gemesFiltradas.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-200">
          <Gem size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold">No se encontraron gemas</p>
          <button onClick={() => { setBusqueda(''); setCategoriaActiva(null); }} className="mt-3 text-blue-600 text-xs font-black hover:text-blue-700">
            Limpiar filtros
          </button>
        </div>
      ) : busqueda.trim().length >= 2 ? (
        // Vista de resultados de búsqueda (sin agrupar)
        <div>
          <p className="text-slate-400 text-sm font-bold mb-6">{gemesFiltradas.length} resultado{gemesFiltradas.length !== 1 ? 's' : ''} para "{busqueda}"</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gemesFiltradas.map((gema, index) => (
              <GemaCard key={gema.gema_id} gema={gema} index={index} currentUserId={currentUserId} />
            ))}
          </div>
        </div>
      ) : (
        // Vista agrupada por categoría
        <div className="space-y-12">
          {gemasAgrupadas.map(cat => (
            <section key={cat.categoria_id}>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-black text-slate-800">{cat.nombre}</h2>
                <span className="bg-blue-100 text-blue-600 text-xs font-black px-2 py-0.5 rounded-full">{cat.gemas.length}</span>
                <button
                  onClick={() => setCategoriaActiva(cat.categoria_id)}
                  className="text-xs font-black text-slate-400 hover:text-blue-600 transition-colors ml-auto"
                >
                  Ver todas →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cat.gemas.slice(0, 4).map((gema, index) => (
                  <GemaCard key={gema.gema_id} gema={gema} index={index} currentUserId={currentUserId} />
                ))}
              </div>
            </section>
          ))}

          {gemassinCategoria.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-black text-slate-800">Sin categoría</h2>
                <span className="bg-slate-100 text-slate-500 text-xs font-black px-2 py-0.5 rounded-full">{gemassinCategoria.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {gemassinCategoria.map((gema, index) => (
                  <GemaCard key={gema.gema_id} gema={gema} index={index} currentUserId={currentUserId} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
