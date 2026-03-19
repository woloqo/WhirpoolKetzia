"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Loader2, Image as ImageIcon, Search, FileText, HelpCircle, GripVertical } from 'lucide-react';
import Link from 'next/link';

export default function NuevoCurso() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archivosDisponibles, setArchivosDisponibles] = useState([]);
  const [quizzesDisponibles, setQuizzesDisponibles] = useState([]);
  const [filtroBiblioteca, setFiltroBiblioteca] = useState('');
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagenSrc: '',
    archivosSeleccionados: [],
    quizzesSeleccionados: []
  });

  useEffect(() => {
    if (localStorage.getItem('rol_id') !== '1') return router.push('/');

    fetch('/api/admin/archivos')
      .then(res => res.json())
      .then(data => setArchivosDisponibles(Array.isArray(data) ? data : []))
      .catch(() => setArchivosDisponibles([]));

    fetch('/api/admin/quizzes')
      .then(res => res.json())
      .then(data => setQuizzesDisponibles(Array.isArray(data) ? data : []))
      .catch(() => setQuizzesDisponibles([]));
  }, [router]);

  const agregarItem = (id, tipo) => {
    const key = tipo === 'archivo' ? 'archivosSeleccionados' : 'quizzesSeleccionados';
    if (!formData[key].includes(id)) {
      setFormData({ ...formData, [key]: [...formData[key], id] });
    }
  };

  const quitarItem = (id, tipo) => {
    const key = tipo === 'archivo' ? 'archivosSeleccionados' : 'quizzesSeleccionados';
    setFormData({ ...formData, [key]: formData[key].filter(itemId => itemId !== id) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const usuario_id = localStorage.getItem('usuario_id');

    try {
      const res = await fetch('/api/admin/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, creado_por: usuario_id }),
      });

      if (res.ok) router.push('/admin');
    } catch (error) {
      alert("Error al guardar el curso");
    } finally {
      setLoading(false);
    }
  };

  const archivosFiltrados = archivosDisponibles.filter(a => 
    a.nombre_archivo.toLowerCase().includes(filtroBiblioteca.toLowerCase()) &&
    !formData.archivosSeleccionados.includes(a.archivo_id)
  );

  return (
    // CAMBIO: max-w-none y w-full para ocupar toda la pantalla
    <div className="w-full min-h-screen bg-slate-50 font-sans p-6 lg:p-8">
      
      {/* Header un poco más compacto */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Volver
        </Link>
        <div className="flex items-center gap-3">
            <Loader2 className={`animate-spin text-blue-300 ${loading ? 'opacity-100' : 'opacity-0'}`} size={20} />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Crear Nuevo Módulo</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* ==========================================================
           COLUMNA IZQUIERDA: CONFIGURACIÓN BASE (3/12)
           ========================================================== */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Título y Descripción */}
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Título del Curso</label>
            <input 
              required
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold mb-5"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              placeholder="Ej: Introducción a IA"
            />
            
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Descripción</label>
            <textarea 
              rows="5"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="¿Qué aprenderá el alumno?"
            />
          </div>

          {/* Portada */}
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4">Portada</h3>
            <div className="aspect-[16/10] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden mb-4 relative">
              {formData.imagenSrc ? (
                <img src={formData.imagenSrc} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="text-slate-300 flex flex-col items-center p-6 text-center">
                  <ImageIcon size={32} className="mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-tight">Pega una URL válida</p>
                </div>
              )}
            </div>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://images.unsplash.com/..."
              value={formData.imagenSrc}
              onChange={(e) => setFormData({...formData, imagenSrc: e.target.value})}
            />
          </div>
        </div>


        {/* ==========================================================
           COLUMNA CENTRAL: TU CURSO (CONTENIDOS AGREGADOS) (5/12)
           ========================================================== */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-lg shadow-blue-50/20 min-h-[calc(100vh-200px)]">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900">Estructura Final</h2>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {formData.archivosSeleccionados.length + formData.quizzesSeleccionados.length} items
                </span>
            </div>
            
            <div className="space-y-3">
              {formData.archivosSeleccionados.length === 0 && formData.quizzesSeleccionados.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                    <FileText className="mx-auto text-slate-300 mb-4" size={40} />
                    <p className="text-slate-400 font-bold max-w-xs mx-auto">Tu curso está vacío. Añade materiales desde la biblioteca a la derecha.</p>
                </div>
              )}

              {/* Lista Unificada */}
              {formData.archivosSeleccionados.map((id, index) => {
                const archivo = archivosDisponibles.find(a => a.archivo_id === id);
                return (
                  <div key={`sel-${id}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-4">
                      <GripVertical size={20} className="text-slate-300 cursor-move group-hover:text-slate-400" />
                      <span className="text-xs font-black text-blue-300">#{index+1}</span>
                      <FileText size={18} className="text-blue-500" />
                      <p className="font-bold text-slate-800 text-sm">{archivo?.nombre_archivo}</p>
                    </div>
                    <button type="button" onClick={() => quitarItem(id, 'archivo')} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
              
              {formData.quizzesSeleccionados.map((id) => {
                const quiz = quizzesDisponibles.find(q => q.quiz_id === id);
                return (
                  <div key={`quiz-${id}`} className="flex items-center justify-between p-4 bg-purple-50 text-purple-900 border border-purple-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <HelpCircle size={18} className="text-purple-600" />
                      <p className="font-bold text-sm">{quiz?.titulo} (Examen Final)</p>
                    </div>
                    <button type="button" onClick={() => quitarItem(id, 'quiz')} className="p-2 bg-white text-purple-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* ==========================================================
           COLUMNA DERECHA: BIBLIOTECA (DISPONIBLES) (4/12)
           ========================================================== */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm sticky top-8">
            <h2 className="text-xl font-black text-slate-900 mb-5">Biblioteca Global</h2>

            {/* Buscador */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar archivos de Whirlpool..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                onChange={(e) => setFiltroBiblioteca(e.target.value)}
              />
            </div>

            {/* Lista de Archivos Disponibles (con Scroll) */}
            <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-2.5 mb-8 custom-scrollbar">
              {archivosFiltrados.length > 0 ? archivosFiltrados.map(archivo => (
                <button
                  key={archivo.archivo_id}
                  type="button"
                  onClick={() => agregarItem(archivo.archivo_id, 'archivo')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all group text-left"
                >
                  <span className="text-xs font-bold truncate pr-4">{archivo.nombre_archivo}</span>
                  <Plus size={16} className="text-slate-300 group-hover:text-white shrink-0" />
                </button>
              )) : (
                <p className="text-xs text-slate-400 font-medium text-center py-6 italic">No hay archivos coincidentes</p>
              )}
            </div>

            {/* Quizzes Disponibles */}
            <div className="mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Exámenes</p>
              <div className="space-y-2.5">
                {quizzesDisponibles
                  .filter(q => !formData.quizzesSeleccionados.includes(q.quiz_id))
                  .map(quiz => (
                    <button
                      key={quiz.quiz_id}
                      type="button"
                      onClick={() => agregarItem(quiz.quiz_id, 'quiz')}
                      className="w-full flex items-center justify-between p-4 border border-purple-100 bg-purple-50/30 hover:bg-purple-600 hover:text-white rounded-xl transition-all text-purple-700 group text-left"
                    >
                      <span className="text-xs font-bold">{quiz.titulo}</span>
                      <Plus size={16} className="group-hover:text-white shrink-0" />
                    </button>
                  ))}
              </div>
            </div>

            {/* Botón Guardar (Ahora dentro de la tarjeta de biblioteca para que flote) */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Publicar Módulo
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}