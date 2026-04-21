"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Plus, X, Loader2, Search, 
  FileText, HelpCircle, ChevronUp, ChevronDown, Upload, Tag, Check, ChevronRight, Layers, Pencil, Trash2
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

  // Secciones locales (se crean en DB después de crear el curso)
  const [secciones, setSecciones] = useState([]);
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [seccionSeleccionada, setSeccionSeleccionada] = useState(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    descripcionCorta: '',
    imagenSrc: '',
    imagenFile: null
  });

  // Items con sección asignada
  const [itemsSeleccionados, setItemsSeleccionados] = useState([]);

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

  // Secciones locales (temporal, se guardan en DB después de crear el curso)
  const agregarSeccion = () => {
    if (!nuevaSeccion.trim()) return;
    const tempId = `temp_${Date.now()}`;
    setSecciones([...secciones, { seccion_id: tempId, titulo: nuevaSeccion, orden: secciones.length + 1 }]);
    setNuevaSeccion('');
  };

  const eliminarSeccion = (seccion_id) => {
    setSecciones(secciones.filter(s => s.seccion_id !== seccion_id));
    // Desasignar items de esa sección
    setItemsSeleccionados(items => items.map(i => i.seccion_id === seccion_id ? { ...i, seccion_id: null } : i));
    if (seccionSeleccionada === seccion_id) setSeccionSeleccionada(null);
  };

  const agregarItem = (id, tipo) => {
    const yaExiste = itemsSeleccionados.find(i => i.id === id && i.tipo === tipo);
    if (yaExiste) return;
    
    let itemData;
    if (tipo === 'archivo') {
      const archivo = archivosDisponibles.find(a => a.archivo_id === id);
      itemData = { id, tipo, nombre: archivo?.nombre_archivo, subtipo: archivo?.tipo_archivo, seccion_id: seccionSeleccionada };
    } else {
      const quiz = quizzesDisponibles.find(q => q.quiz_id === id);
      itemData = { id, tipo, nombre: quiz?.titulo, subtipo: `${quiz?.total_preguntas} preguntas`, seccion_id: seccionSeleccionada };
    }
    setItemsSeleccionados([...itemsSeleccionados, itemData]);
  };

  const quitarItem = (id, tipo) => {
    setItemsSeleccionados(itemsSeleccionados.filter(i => !(i.id === id && i.tipo === tipo)));
  };

  const moverItem = (index, dir) => {
    const nuevos = [...itemsSeleccionados];
    const swap = index + dir;
    if (swap < 0 || swap >= nuevos.length) return;
    [nuevos[index], nuevos[swap]] = [nuevos[swap], nuevos[index]];
    setItemsSeleccionados(nuevos);
  };

  const cambiarSeccionItem = (index, seccion_id) => {
    const nuevos = [...itemsSeleccionados];
    nuevos[index] = { ...nuevos[index], seccion_id: seccion_id || null };
    setItemsSeleccionados(nuevos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim()) return alert('El título es obligatorio');
    setLoading(true);
    const usuario_id = localStorage.getItem('usuario_id');
    
    try {
      let finalImageUrl = previewUrl;
      if (formData.imagenFile) finalImageUrl = await uploadImage(formData.imagenFile);

      // 1. Crear el curso
      const res = await fetch('/api/admin/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          descripcionCorta: formData.descripcionCorta,
          imagenSrc: finalImageUrl, 
          creado_por: usuario_id,
          alumnosSeleccionados,
          categoriasSeleccionadas
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Error: ${data.error}`);
        return;
      }

      const cursoData = await res.json();
      const curso_id = cursoData.curso_id;

      // 2. Crear secciones y obtener mapa de tempId -> seccion_id real
      const seccionMap = {};
      for (const seccion of secciones) {
        const resSeccion = await fetch(`/api/admin/cursos/${curso_id}/secciones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo: seccion.titulo }),
        });
        const seccionData = await resSeccion.json();
        seccionMap[seccion.seccion_id] = seccionData.seccion_id;
      }

      // 3. Agregar materiales y exámenes con seccion_id real
      for (let i = 0; i < itemsSeleccionados.length; i++) {
        const item = itemsSeleccionados[i];
        const seccion_id_real = item.seccion_id ? (seccionMap[item.seccion_id] || item.seccion_id) : null;

        if (item.tipo === 'archivo') {
          await fetch(`/api/admin/cursos/${curso_id}/materiales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivo_id: item.id, seccion_id: seccion_id_real }),
          });
        } else {
          await fetch(`/api/admin/cursos/${curso_id}/examenes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quiz_id: item.id, seccion_id: seccion_id_real }),
          });
        }
      }

      router.push('/admin');
    } catch (error) { 
      console.error(error);
      alert('Error al crear el curso');
    } finally { 
      setLoading(false); 
    }
  };

  const archivosFiltrados = archivosDisponibles.filter(a => 
    a.nombre_archivo.toLowerCase().includes(filtroMateriales.toLowerCase()) &&
    !itemsSeleccionados.find(i => i.id === a.archivo_id && i.tipo === 'archivo')
  );

  const quizzesFiltrados = quizzesDisponibles.filter(q => 
    q.titulo.toLowerCase().includes(filtroExamenes.toLowerCase()) &&
    !itemsSeleccionados.find(i => i.id === q.quiz_id && i.tipo === 'quiz')
  );

  const itemsFiltrados = seccionSeleccionada === 'sin_seccion'
    ? itemsSeleccionados.filter(i => !i.seccion_id)
    : seccionSeleccionada
      ? itemsSeleccionados.filter(i => i.seccion_id === seccionSeleccionada)
      : itemsSeleccionados;

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
        
        {/* COLUMNA 1: INFO (25%) */}
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
                <Text variant="muted" className="mb-2">Resumen Corto</Text>
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                  value={formData.descripcionCorta} onChange={(e) => setFormData({...formData, descripcionCorta: e.target.value})} placeholder="Breve introducción..." />
              </div>

              <div>
                <Text variant="muted" className="mb-2">Descripción Detallada</Text>
                <textarea rows="5" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm resize-none"
                  value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} placeholder="Objetivos del curso..." />
              </div>
            </div>
          </SectionCard>

          {/* Secciones */}
          <SectionCard title="Secciones">
            <div className="p-4 space-y-3">
              {secciones.map(s => (
                <div key={s.seccion_id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 group">
                  <Layers size={14} className="text-blue-400 shrink-0" />
                  <span className="flex-1 text-xs font-bold text-slate-700 truncate">{s.titulo}</span>
                  <button type="button" onClick={() => eliminarSeccion(s.seccion_id)}
                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nueva sección..."
                  value={nuevaSeccion}
                  onChange={(e) => setNuevaSeccion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarSeccion())}
                />
                <button type="button" onClick={agregarSeccion} disabled={!nuevaSeccion.trim()}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </SectionCard>
          
          <SectionCard title="Portada">
            <div className="p-4">
              <div className="aspect-video bg-slate-50 rounded-[1.4rem] overflow-hidden border border-slate-100 shadow-inner relative group">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer font-black text-[10px] uppercase gap-2">
                  <Upload size={20} /><span>Cambiar Portada</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* COLUMNA 2: ESTRUCTURA (50%) */}
        <div className="lg:col-span-6 space-y-4">

          {/* Filtro por sección */}
          {secciones.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSeccionSeleccionada(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${!seccionSeleccionada ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300'}`}>
                Todos
              </button>
              {secciones.map(s => (
                <button type="button" key={s.seccion_id} onClick={() => setSeccionSeleccionada(seccionSeleccionada === s.seccion_id ? null : s.seccion_id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${seccionSeleccionada === s.seccion_id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300'}`}>
                  {s.titulo}
                </button>
              ))}
              <button type="button" onClick={() => setSeccionSeleccionada('sin_seccion')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${seccionSeleccionada === 'sin_seccion' ? 'bg-slate-600 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
                Sin sección
              </button>
            </div>
          )}

          <SectionCard title="Estructura del Contenido" count={itemsSeleccionados.length}>
            <div className="p-6 space-y-3 min-h-[600px] bg-slate-50/50 rounded-b-[0.8rem]">
              {itemsFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                  <FileText size={56} strokeWidth={1} className="mb-4 opacity-10" />
                  <Text variant="muted" className="text-center text-xs">
                    {seccionSeleccionada ? 'No hay contenido en esta sección.' : 'Añade recursos desde la derecha.'}
                  </Text>
                </div>
              ) : itemsFiltrados.map((item, filtIndex) => {
                const globalIndex = itemsSeleccionados.findIndex(i => i === item);
                const isQuiz = item.tipo === 'quiz';
                return (
                  <div key={`${item.tipo}-${item.id}`} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moverItem(globalIndex, -1)} disabled={globalIndex === 0}
                        className="p-1 text-slate-200 hover:text-blue-500 disabled:opacity-0"><ChevronUp size={14}/></button>
                      <button type="button" onClick={() => moverItem(globalIndex, 1)} disabled={globalIndex === itemsSeleccionados.length - 1}
                        className="p-1 text-slate-200 hover:text-blue-500 disabled:opacity-0"><ChevronDown size={14}/></button>
                    </div>
                    <div className={`p-2 rounded-xl shrink-0 ${isQuiz ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                      {isQuiz ? <HelpCircle size={16} /> : <FileText size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{item.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{item.subtipo}</span>
                        {secciones.length > 0 && (
                          <select
                            value={item.seccion_id || ''}
                            onChange={(e) => cambiarSeccionItem(globalIndex, e.target.value)}
                            className="text-[10px] font-bold text-blue-500 bg-transparent border-none outline-none cursor-pointer"
                          >
                            <option value="">Sin sección</option>
                            {secciones.map(s => <option key={s.seccion_id} value={s.seccion_id}>{s.titulo}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => quitarItem(item.id, item.tipo)}
                      className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
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
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
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
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {quizzesFiltrados.map(quiz => (
                  <button key={quiz.quiz_id} type="button" onClick={() => agregarItem(quiz.quiz_id, 'quiz')}
                    className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-xl transition-all text-purple-700 border border-purple-100">
                    <span className="text-[10px] font-bold truncate">{quiz.titulo}</span>
                    <Plus size={14} />
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Inscripción" action={
            <button type="button" onClick={() => setAlumnosOpen(!alumnosOpen)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className={`transition-transform duration-300 ${alumnosOpen ? 'rotate-90' : ''}`} size={18} />
            </button>
          }>
            {alumnosOpen && (
              <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input type="text" placeholder="Alumno..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs" onChange={(e) => setFiltroAlumnos(e.target.value)} />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {alumnosDisponibles.filter(a => !alumnosSeleccionados.includes(a.value) && a.label.toLowerCase().includes(filtroAlumnos.toLowerCase())).map(alumno => (
                    <button key={alumno.value} type="button" onClick={() => setAlumnosSeleccionados([...alumnosSeleccionados, alumno.value])}
                      className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-all">
                      <span className="text-[10px] font-bold">{alumno.label}</span><Plus size={12} />
                    </button>
                  ))}
                </div>
                {alumnosSeleccionados.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Seleccionados ({alumnosSeleccionados.length})</p>
                    {alumnosSeleccionados.map(id => {
                      const a = alumnosDisponibles.find(al => al.value === id);
                      return (
                        <div key={id} className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl">
                          <span className="text-[10px] font-bold text-emerald-700">{a?.label}</span>
                          <button type="button" onClick={() => setAlumnosSeleccionados(alumnosSeleccionados.filter(x => x !== id))}
                            className="text-emerald-400 hover:text-red-500"><X size={12} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <Button className="w-full py-6 text-base rounded-[1.5rem]" loading={loading} icon={Save} onClick={handleSubmit}>
            Publicar Módulo
          </Button>
        </div>
      </form>
    </div>
  );
}