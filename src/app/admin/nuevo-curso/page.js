"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Plus, X, Loader2, Search, 
  FileText, HelpCircle, ChevronUp, ChevronDown, Upload, Tag, Check, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; 

import { Button } from '@/components/Button';
import { SectionCard } from '@/components/SectionCard';
import { ResourceItem } from '@/components/ResourceItem';
import { PageHeader, Text } from '@/components/Typography';

const DEFAULT_COURSE_IMAGE = "https://erarmlxcjcwpkxazijam.supabase.co/storage/v1/object/public/portadas/Curso%20sin%20portada.png";

export default function NuevoCurso() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archivosDisponibles, setArchivosDisponibles] = useState([]);
  const [quizzesDisponibles, setQuizzesDisponibles] = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState([]);
  
  const [filtroMateriales, setFiltroMateriales] = useState('');
  const [filtroExamenes, setFiltroExamenes] = useState('');
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [filtroAlumnos, setFiltroAlumnos] = useState('');
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_COURSE_IMAGE);

  const [alumnosOpen, setAlumnosOpen] = useState(false);
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
    const rol = localStorage.getItem('rol_id');
    if (rol !== '1' && rol !== '30001') return router.push('/');

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

  // --- LÓGICA DE IMAGEN ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imagenFile: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file) => {
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('portadas').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('portadas').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- LÓGICA DE CATEGORÍAS ---
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
    } catch (e) { console.error(e); }
  };

  const toggleCategoria = (id) => {
    setCategoriasSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // --- LÓGICA DE ITEMS ---
  const agregarItem = (id, tipo) => {
    const key = tipo === 'archivo' ? 'archivosSeleccionados' : 'quizzesSeleccionados';
    if (!formData[key].includes(id)) {
      setFormData(prev => ({ ...prev, [key]: [...prev[key], id] }));
    }
  };

  const quitarItem = (id, tipo) => {
    const key = tipo === 'archivo' ? 'archivosSeleccionados' : 'quizzesSeleccionados';
    setFormData(prev => ({ ...prev, [key]: prev[key].filter(itemId => itemId !== id) }));
  };

  const moverItem = (index, direccion, tipo) => {
    const key = tipo === 'archivo' ? 'archivosSeleccionados' : 'quizzesSeleccionados';
    const nuevaLista = [...formData[key]];
    const nuevaPos = index + direccion;
    if (nuevaPos < 0 || nuevaPos >= nuevaLista.length) return;
    [nuevaLista[index], nuevaLista[nuevaPos]] = [nuevaLista[nuevaPos], nuevaLista[index]];
    setFormData(prev => ({ ...prev, [key]: nuevaLista }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const usuario_id = localStorage.getItem('usuario_id');
    
    try {
      let finalImageUrl = previewUrl;
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

      if (res.ok) router.push('/admin');
      else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const archivosFiltrados = archivosDisponibles.filter(a => 
    a.nombre_archivo.toLowerCase().includes(filtroMateriales.toLowerCase()) &&
    !formData.archivosSeleccionados.includes(a.archivo_id)
  );

  const quizzesFiltrados = quizzesDisponibles.filter(q => 
    q.titulo.toLowerCase().includes(filtroExamenes.toLowerCase()) &&
    !formData.quizzesSeleccionados.includes(q.quiz_id)
  );

  return (
    <div className="w-full p-4 lg:p-10 font-sans bg-slate-50/30">
      
      <div className="grid grid-cols-3 items-center mb-10 pb-4 border-b border-slate-100">
        <div className="flex justify-start">
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-bold text-xs uppercase tracking-widest group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Panel
          </Link>
        </div>
        <div className="flex flex-col items-center">
            <PageHeader title="Crear Nuevo Módulo" />
        </div>
        <div className="flex justify-end items-center">
          <Loader2 className={`animate-spin text-blue-300 ${loading ? 'opacity-100' : 'opacity-0'}`} size={24} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA 1: INFO Y CATEGORÍAS (25%) */}
        <div className="lg:col-span-3 space-y-6">
          <SectionCard title="Información General">
            <div className="p-4 space-y-6">
              <div>
                <Text variant="muted" className="mb-2">Título</Text>
                <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} placeholder="Ej: Seguridad Industrial" />
              </div>

              <div>
                <Text variant="muted" className="mb-2">Categorías</Text>
                <div className="flex flex-wrap gap-2 mb-4">
                  {categoriasDisponibles.map(cat => (
                    <button key={cat.categoria_id} type="button" onClick={() => toggleCategoria(cat.categoria_id)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all border ${categoriasSeleccionadas.includes(cat.categoria_id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                      <Tag size={10} className="inline mr-1" /> {cat.nombre}
                    </button>
                  ))}
                  {creandoNuevaCat ? (
                    <div className="flex items-center gap-1">
                      <input autoFocus className="px-2 py-1.5 rounded-xl text-[10px] font-bold border border-blue-500 outline-none w-20"
                        value={nombreNuevaCat} onChange={(e) => setNombreNuevaCat(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCrearCategoria())} />
                      <button type="button" onClick={handleCrearCategoria} className="text-blue-600"><Check size={14}/></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setCreandoNuevaCat(true)} className="px-3 py-1.5 rounded-xl text-[9px] font-black border border-dashed border-slate-300 text-slate-400 hover:text-blue-600">
                      <Plus size={12} /> Nueva
                    </button>
                  )}
                </div>
              </div>

              <div>
                <Text variant="muted" className="mb-2">Resumen Corto (Cards)</Text>
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                  value={formData.descripcionCorta} onChange={(e) => setFormData({...formData, descripcionCorta: e.target.value})} placeholder="Breve introducción..." />
              </div>

              <div>
                <Text variant="muted" className="mb-2">Descripción Detallada</Text>
                <textarea rows="6" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm resize-none"
                  value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} placeholder="Objetivos del curso..." />
              </div>
            </div>
          </SectionCard>
          
          <SectionCard title="Portada">
            <div className="p-4">
              <div className="aspect-video bg-slate-50 rounded-[1.4rem] overflow-hidden border border-slate-100 shadow-inner relative group">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer font-black text-[10px] uppercase gap-2">
                  <Upload size={20} />
                  <span>Cambiar Portada</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* COLUMNA 2: ESTRUCTURA (50%) */}
        <div className="lg:col-span-6 space-y-6">
          <SectionCard title="Estructura del Contenido" count={formData.archivosSeleccionados.length + formData.quizzesSeleccionados.length}>
            <div className="p-6 space-y-4 min-h-[750px] bg-slate-50/50 rounded-b-[0.8rem]">
              {formData.archivosSeleccionados.length === 0 && formData.quizzesSeleccionados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                  <FileText size={64} strokeWidth={1} className="mb-4 opacity-10" />
                  <Text variant="muted" className="text-center">Añade recursos desde la derecha.</Text>
                </div>
              ) : (
                <>
                  {formData.archivosSeleccionados.map((id, index) => {
                    const archivo = archivosDisponibles.find(a => a.archivo_id === id);
                    return (
                      <ResourceItem key={`sel-file-${id}`} title={archivo?.nombre_archivo} subtitle={`Lección #${index + 1}`} icon={FileText}
                        action={
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <button type="button" onClick={() => moverItem(index, -1, 'archivo')} disabled={index === 0} className="text-slate-300 hover:text-blue-500 disabled:opacity-0"><ChevronUp size={16}/></button>
                              <button type="button" onClick={() => moverItem(index, 1, 'archivo')} disabled={index === formData.archivosSeleccionados.length - 1} className="text-slate-300 hover:text-blue-500 disabled:opacity-0"><ChevronDown size={16}/></button>
                            </div>
                            <button type="button" onClick={() => quitarItem(id, 'archivo')} className="p-2 bg-red-50 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={18} /></button>
                          </div>
                        }
                      />
                    );
                  })}
                  {formData.quizzesSeleccionados.map((id) => {
                    const quiz = quizzesDisponibles.find(q => q.quiz_id === id);
                    return (
                      <ResourceItem key={`sel-quiz-${id}`} variant="yellow" title={quiz?.titulo} subtitle="Evaluación" icon={HelpCircle}
                        action={<button type="button" onClick={() => quitarItem(id, 'quiz')} className="p-2 bg-amber-100 text-amber-600 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={18} /></button>} />
                    );
                  })}
                </>
              )}
            </div>
          </SectionCard>
        </div>

        {/* COLUMNA 3: RECURSOS E INSCRIPCIÓN (25%) */}
        <div className="lg:col-span-3 space-y-6">
          <SectionCard title="Materiales" count={archivosFiltrados.length}>
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input type="text" placeholder="Buscar material..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none"
                  onChange={(e) => setFiltroMateriales(e.target.value)} />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {archivosFiltrados.map(archivo => (
                  <button key={archivo.archivo_id} type="button" onClick={() => agregarItem(archivo.archivo_id, 'archivo')}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-slate-100">
                    <span className="text-[10px] font-bold truncate">{archivo.nombre_archivo}</span>
                    <Plus size={14} />
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Exámenes" count={quizzesFiltrados.length}>
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input type="text" placeholder="Buscar quiz..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none"
                  onChange={(e) => setFiltroExamenes(e.target.value)} />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {quizzesFiltrados.map(quiz => (
                  <button key={quiz.quiz_id} type="button" onClick={() => agregarItem(quiz.quiz_id, 'quiz')}
                    className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-xl transition-all text-purple-700 hover:text-white border border-purple-100">
                    <span className="text-[10px] font-bold truncate">{quiz.titulo}</span>
                    <Plus size={14} />
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Inscripción" action={<button type="button" onClick={() => setAlumnosOpen(!alumnosOpen)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight className={`transition-transform duration-300 ${alumnosOpen ? 'rotate-90' : ''}`} size={18} /></button>}>
            {alumnosOpen && (
              <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input type="text" placeholder="Alumno..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs" onChange={(e) => setFiltroAlumnos(e.target.value)} /></div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {alumnosDisponibles.filter(a => !alumnosSeleccionados.includes(a.value) && a.label.toLowerCase().includes(filtroAlumnos.toLowerCase())).map(alumno => (
                    <button key={alumno.value} type="button" onClick={() => setAlumnosSeleccionados([...alumnosSeleccionados, alumno.value])} className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"><span className="text-[10px] font-bold">{alumno.label}</span><Plus size={12} /></button>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <Button className="w-full py-6 text-base rounded-[1.5rem]" loading={loading} icon={Save} onClick={handleSubmit}>Publicar Módulo</Button>
        </div>
      </form>
    </div>
  );
}