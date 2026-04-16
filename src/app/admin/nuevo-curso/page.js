"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Loader2, Image as ImageIcon, Search, FileText, HelpCircle, ChevronUp, ChevronDown, Upload, Tag, Check } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; 

const DEFAULT_COURSE_IMAGE = "https://erarmlxcjcwpkxazijam.supabase.co/storage/v1/object/public/portadas/Curso%20sin%20portada.png";

export default function NuevoCurso() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archivosDisponibles, setArchivosDisponibles] = useState([]);
  const [quizzesDisponibles, setQuizzesDisponibles] = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  
  const [filtroBiblioteca, setFiltroBiblioteca] = useState('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [filtroAlumnos, setFiltroAlumnos] = useState('');
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_COURSE_IMAGE);

  // Estados para nueva categoría
  const [creandoNuevaCat, setCreandoNuevaCat] = useState(false);
  const [nombreNuevaCat, setNombreNuevaCat] = useState('');

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    descripcionCorta: '',
    imagenSrc: '',
    archivosSeleccionados: [],
    quizzesSeleccionados: [],
    imagenFile: null
  });

  useEffect(() => {
    if (localStorage.getItem('rol_id') !== '1' && localStorage.getItem('rol_id') !== '30001') return router.push('/');

    const fetchInitialData = async () => {
        try {
            const [resArchivos, resQuizzes, resUsuarios, resCats] = await Promise.all([
                fetch('/api/admin/archivos'),
                fetch('/api/admin/quizzes'),
                fetch('/api/admin/usuarios'),
                fetch('/api/admin/categorias')
            ]);
            
            setArchivosDisponibles(await resArchivos.json());
            setQuizzesDisponibles(await resQuizzes.json());
            setAlumnosDisponibles(await resUsuarios.json());
            setCategoriasDisponibles(await resCats.json());
        } catch (e) { console.error("Error al cargar datos", e); }
    };

    fetchInitialData();
  }, [router]);

  const handleCrearCategoria = async () => {
    if (!nombreNuevaCat.trim()) return;
    try {
      const res = await fetch('/api/admin/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreNuevaCat })
      });
      const nuevaCat = await res.json();
      
      if (res.ok) {
        setCategoriasDisponibles([...categoriasDisponibles, nuevaCat]);
        setCategoriasSeleccionadas([...categoriasSeleccionadas, nuevaCat.categoria_id]);
        setNombreNuevaCat('');
        setCreandoNuevaCat(false);
      }
    } catch (e) {
      console.error("Error creando categoría:", e);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imagenFile: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('portadas').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('portadas').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const toggleCategoria = (id) => {
    setCategoriasSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

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

  const moverItem = (index, direccion, tipo) => {
    const key = tipo === 'archivo' ? 'archivosSeleccionados' : 'quizzesSeleccionados';
    const nuevaLista = [...formData[key]];
    const nuevaPos = index + direccion;
    if (nuevaPos < 0 || nuevaPos >= nuevaLista.length) return;
    [nuevaLista[index], nuevaLista[nuevaPos]] = [nuevaLista[nuevaPos], nuevaLista[index]];
    setFormData({ ...formData, [key]: nuevaLista });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const usuario_id = localStorage.getItem('usuario_id');

    if (formData.archivosSeleccionados.length === 0 && formData.quizzesSeleccionados.length === 0) {
      setLoading(false);
      return alert("Error: El curso debe tener al menos un archivo o un quiz.");
    }

    try {
      let finalImageUrl = DEFAULT_COURSE_IMAGE;
      if (formData.imagenFile) {
        finalImageUrl = await uploadImage(formData.imagenFile);
      }

      const res = await fetch('/api/admin/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          imagenSrc: finalImageUrl, 
          creado_por: usuario_id,
          alumnosSeleccionados,
          categoriasSeleccionadas
        }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "No se pudo crear el curso"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un problema al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const archivosFiltrados = archivosDisponibles.filter(a => 
    a.nombre_archivo.toLowerCase().includes(filtroBiblioteca.toLowerCase()) &&
    !formData.archivosSeleccionados.includes(a.archivo_id)
  );

  return (
    <div className="w-full min-h-screen font-sans p-6 lg:p-8 bg-slate-50/30">
      
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
        
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Título del Curso</label>
            <input 
              required
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold mb-5"
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              placeholder="Ej: Introducción a IA"
            />

            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tags / Categorías</label>
            <div className="flex flex-wrap gap-2 mb-5">
                {categoriasDisponibles.map(cat => (
                    <button
                        key={cat.categoria_id}
                        type="button"
                        onClick={() => toggleCategoria(cat.categoria_id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                            categoriasSeleccionadas.includes(cat.categoria_id)
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
                        }`}
                    >
                        <Tag size={10} className="inline mr-1" />
                        {cat.nombre}
                    </button>
                ))}

                {/* BOTÓN / FORMULARIO NUEVA CATEGORÍA */}
                {creandoNuevaCat ? (
                  <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                    <input 
                      autoFocus
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-blue-500 outline-none w-28"
                      value={nombreNuevaCat}
                      onChange={(e) => setNombreNuevaCat(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCrearCategoria())}
                      placeholder="Nombre..."
                    />
                    <button type="button" onClick={handleCrearCategoria} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Check size={12} />
                    </button>
                    <button type="button" onClick={() => setCreandoNuevaCat(false)} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreandoNuevaCat(true)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Nueva
                  </button>
                )}
            </div>

            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Descripción Corta</label>
            <input 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold mb-5 text-sm"
              value={formData.descripcionCorta}
              onChange={(e) => setFormData({...formData, descripcionCorta: e.target.value})}
              placeholder="Resumen de 1 frase"
              maxLength={100}
            />

            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Descripción Completa</label>
            <textarea 
              rows="5"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="¿Qué aprenderá el alumno?"
            />
          </div>

          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4">Portada</h3>
            <div className="aspect-[16/10] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden mb-4 relative group">
              <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              <label className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer font-bold text-xs gap-2">
                <Upload size={24} />
                <span>Cambiar Imagen</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL: ESTRUCTURA */}
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
                    <p className="text-slate-400 font-bold max-w-xs mx-auto">Tu curso está vacío.</p>
                </div>
              )}

              {formData.archivosSeleccionados.map((id, index) => {
                const archivo = archivosDisponibles.find(a => a.archivo_id === id);
                return (
                  <div key={`sel-${id}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-100 group">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => moverItem(index, -1, 'archivo')} disabled={index === 0} className="text-slate-300 hover:text-blue-600">
                          <ChevronUp size={16} />
                        </button>
                        <button type="button" onClick={() => moverItem(index, 1, 'archivo')} disabled={index === formData.archivosSeleccionados.length - 1} className="text-slate-300 hover:text-blue-600">
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      <span className="text-xs font-black text-blue-300">#{index+1}</span>
                      <FileText size={18} className="text-blue-500" />
                      <p className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{archivo?.nombre_archivo}</p>
                    </div>
                    <button type="button" onClick={() => quitarItem(id, 'archivo')} className="p-2 text-slate-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                );
              })}
              
              {formData.quizzesSeleccionados.map((id, index) => {
                const quiz = quizzesDisponibles.find(q => q.quiz_id === id);
                return (
                  <div key={`quiz-${id}`} className="flex items-center justify-between p-4 bg-purple-50 text-purple-900 border border-purple-100 rounded-2xl group">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => moverItem(index, -1, 'quiz')} disabled={index === 0} className="text-purple-300 hover:text-purple-600"><ChevronUp size={16} /></button>
                        <button type="button" onClick={() => moverItem(index, 1, 'quiz')} disabled={index === formData.quizzesSeleccionados.length - 1} className="text-purple-300 hover:text-purple-600"><ChevronDown size={16} /></button>
                      </div>
                      <HelpCircle size={18} className="text-purple-600" />
                      <p className="font-bold text-sm truncate max-w-[200px]">{quiz?.titulo}</p>
                    </div>
                    <button type="button" onClick={() => quitarItem(id, 'quiz')} className="p-2 text-purple-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-5">Biblioteca Global</h2>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar archivos..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                onChange={(e) => setFiltroBiblioteca(e.target.value)}
              />
            </div>

            <div className="max-h-[30vh] overflow-y-auto pr-2 space-y-2.5 mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Archivos</p>
              {archivosFiltrados.map(archivo => (
                <button
                  key={archivo.archivo_id}
                  type="button"
                  onClick={() => agregarItem(archivo.archivo_id, 'archivo')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all group text-left"
                >
                  <span className="text-xs font-bold truncate pr-4">{archivo.nombre_archivo}</span>
                  <Plus size={16} className="text-slate-300 group-hover:text-white shrink-0" />
                </button>
              ))}
            </div>

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
                      <span className="text-xs font-bold truncate pr-4">{quiz.titulo}</span>
                      <Plus size={16} className="group-hover:text-white shrink-0" />
                    </button>
                  ))}
              </div>
            </div>

            <div className="mb-8 pt-6 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Inscribir Alumnos</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Buscar alumno..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setFiltroAlumnos(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3 pr-1">
                {alumnosDisponibles
                  .filter(a => !alumnosSeleccionados.includes(a.value) && a.label.toLowerCase().includes(filtroAlumnos.toLowerCase()))
                  .map(alumno => (
                    <button
                      key={alumno.value}
                      type="button"
                      onClick={() => setAlumnosSeleccionados([...alumnosSeleccionados, alumno.value])}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all group"
                    >
                      <span className="text-xs font-bold">{alumno.label}</span>
                      <Plus size={14} className="text-slate-300 group-hover:text-white" />
                    </button>
                  ))}
              </div>
              
              {alumnosSeleccionados.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Seleccionados ({alumnosSeleccionados.length})</p>
                    <div className="flex flex-wrap gap-2">
                        {alumnosSeleccionados.map(id => {
                            const alumno = alumnosDisponibles.find(a => a.value === id);
                            return (
                                <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-[10px] font-bold">
                                    {alumno?.label}
                                    <button type="button" onClick={() => setAlumnosSeleccionados(alumnosSeleccionados.filter(a => a !== id))}><X size={12}/></button>
                                </div>
                            );
                        })}
                    </div>
                </div>
              )}
            </div>

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