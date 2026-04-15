"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Loader2, Image as ImageIcon, Search, FileText, HelpCircle, ChevronUp, ChevronDown, Upload } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; 

// URL por defecto definida fuera del componente
const DEFAULT_COURSE_IMAGE = "https://erarmlxcjcwpkxazijam.supabase.co/storage/v1/object/public/portadas/Curso%20sin%20portada.png";

export default function NuevoCurso() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archivosDisponibles, setArchivosDisponibles] = useState([]);
  const [quizzesDisponibles, setQuizzesDisponibles] = useState([]);
  const [filtroBiblioteca, setFiltroBiblioteca] = useState('');
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
const [filtroAlumnos, setFiltroAlumnos] = useState('');
  
  // Inicializamos previewUrl con la imagen default
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_COURSE_IMAGE);

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

    fetch('/api/admin/archivos')
      .then(res => res.json())
      .then(data => setArchivosDisponibles(Array.isArray(data) ? data : []))
      .catch(() => setArchivosDisponibles([]));

    fetch('/api/admin/quizzes')
      .then(res => res.json())
      .then(data => setQuizzesDisponibles(Array.isArray(data) ? data : []))
      .catch(() => setQuizzesDisponibles([]));

    fetch('/api/admin/usuarios')
      .then(res => res.json())
      .then(data => setAlumnosDisponibles(Array.isArray(data) ? data : []))
      .catch(() => setAlumnosDisponibles([]));
  }, [router]);

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
    const filePath = fileName; 

    const { error: uploadError } = await supabase.storage
      .from('portadas')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('portadas')
      .getPublicUrl(filePath);

    return data.publicUrl;
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
      // Lógica de imagen: Si hay archivo se sube, si no se usa la default
      let finalImageUrl = DEFAULT_COURSE_IMAGE;

      if (formData.imagenFile) {
        finalImageUrl = await uploadImage(formData.imagenFile);
      } else if (formData.imagenSrc) {
        finalImageUrl = formData.imagenSrc;
      }

      const res = await fetch('/api/admin/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          imagenSrc: finalImageUrl, 
          creado_por: usuario_id ,
          alumnosSeleccionados
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/admin');
      } else {
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
    <div className="w-full min-h-screen font-sans p-6 lg:p-8">
      
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

            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Descripción Corta (Cards)</label>
            <input 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold mb-5 text-sm"
              value={formData.descripcionCorta}
              onChange={(e) => setFormData({...formData, descripcionCorta: e.target.value})}
              placeholder="Resumen de 1 frase para la tarjeta"
              maxLength={100}
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

          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-4">Portada</h3>
            <div className="aspect-[16/10] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden mb-4 relative group">
              {/* Siempre habrá una previewUrl porque se inicializa con la default */}
              <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              
              <label className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer font-bold text-xs gap-2">
                <Upload size={24} />
                <span>Cambiar Imagen</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 font-bold text-center italic">Si no seleccionas ninguna, se usará la imagen por defecto.</p>
          </div>
        </div>

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
                      <p className="font-bold text-slate-800 text-sm">{archivo?.nombre_archivo}</p>
                    </div>
                    <button type="button" onClick={() => quitarItem(id, 'archivo')} className="p-2 text-slate-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
              
              {formData.quizzesSeleccionados.map((id, index) => {
                const quiz = quizzesDisponibles.find(q => q.quiz_id === id);
                return (
                  <div key={`quiz-${id}`} className="flex items-center justify-between p-4 bg-purple-50 text-purple-900 border border-purple-100 rounded-2xl group">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => moverItem(index, -1, 'quiz')} disabled={index === 0} className="text-purple-300 hover:text-purple-600">
                          <ChevronUp size={16} />
                        </button>
                        <button type="button" onClick={() => moverItem(index, 1, 'quiz')} disabled={index === formData.quizzesSeleccionados.length - 1} className="text-purple-300 hover:text-purple-600">
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      <HelpCircle size={18} className="text-purple-600" />
                      <p className="font-bold text-sm">{quiz?.titulo}</p>
                    </div>
                    <button type="button" onClick={() => quitarItem(id, 'quiz')} className="p-2 text-purple-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm sticky top-8">
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

            <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-2.5 mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Archivos</p>
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
                <p className="text-xs text-slate-400 font-medium text-center py-6">No hay archivos</p>
              )}
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
                      <span className="text-xs font-bold">{quiz.titulo}</span>
                      <Plus size={16} className="group-hover:text-white shrink-0" />
                    </button>
                  ))}
              </div>
            </div>
            {/* ALUMNOS */}
<div className="mb-8">
  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
    Alumnos a inscribir
  </p>
  
  {/* Buscador */}
  <div className="relative mb-3">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
    <input
      type="text"
      placeholder="Buscar alumno..."
      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
      onChange={(e) => setFiltroAlumnos(e.target.value)}
    />
  </div>

  {/* Lista de alumnos disponibles */}
  <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
    {alumnosDisponibles
      .filter(a => 
        !alumnosSeleccionados.includes(a.value) &&
        a.label.toLowerCase().includes(filtroAlumnos.toLowerCase())
      )
      .map(alumno => (
        <button
          key={alumno.value}
          type="button"
          onClick={() => setAlumnosSeleccionados([...alumnosSeleccionados, alumno.value])}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all group text-left"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 group-hover:bg-white/20 rounded-lg flex items-center justify-center font-black text-emerald-600 group-hover:text-white text-xs shrink-0">
              {alumno.label?.[0]}
            </div>
            <span className="text-xs font-bold truncate">{alumno.label}</span>
          </div>
          <Plus size={14} className="text-slate-300 group-hover:text-white shrink-0" />
        </button>
      ))}
  </div>

  {/* Alumnos seleccionados */}
  {alumnosSeleccionados.length > 0 && (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">
        Seleccionados ({alumnosSeleccionados.length})
      </p>
      {alumnosSeleccionados.map(id => {
        const alumno = alumnosDisponibles.find(a => a.value === id);
        return (
          <div key={id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-200 rounded-lg flex items-center justify-center font-black text-emerald-700 text-xs shrink-0">
                {alumno?.label?.[0]}
              </div>
              <span className="text-xs font-bold text-emerald-800 truncate">{alumno?.label}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlumnosSeleccionados(alumnosSeleccionados.filter(a => a !== id))}
              className="p-1 text-emerald-400 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
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