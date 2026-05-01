"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Loader2, BookOpen, FileText, HelpCircle, Plus, X, Pencil, Layers, Tag, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/Button';

export default function EditarCurso({ params }) {
  const resolvedParams = use(params);
  const cursoId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [descripcionCorta, setDescripcionCorta] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [categorias, setCategorias] = useState([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);

  const [secciones, setSecciones] = useState([]);
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [editandoSeccion, setEditandoSeccion] = useState(null);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState(null);

  const [materiales, setMateriales] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [materialesOriginales, setMaterialesOriginales] = useState([]);
  const [examenesOriginales, setExamenesOriginales] = useState([]);
  const [todosMateriales, setTodosMateriales] = useState([]);
  const [todosExamenes, setTodosExamenes] = useState([]);
  const [showAddContenido, setShowAddContenido] = useState(false);
  const [filtroAdd, setFiltroAdd] = useState('');

  const cargarDatos = async () => {
    try {
      const [resCursos, resMateriales, resExamenes, resTodosMat, resTodosEx, resSecciones, resCategorias] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch(`/api/admin/cursos/${cursoId}/materiales`),
        fetch(`/api/admin/cursos/${cursoId}/examenes`),
        fetch('/api/admin/archivos'),
        fetch('/api/admin/quizzes'),
        fetch(`/api/admin/cursos/${cursoId}/secciones`),
        fetch('/api/admin/categorias'),
      ]);

      const cursos = await resCursos.json();
      const todasCats = await resCategorias.json();
      const cursoActual = cursos.find(c => String(c.curso_id) === String(cursoId));

      if (cursoActual) {
        setTitulo(cursoActual.titulo || '');
        setDescripcionCorta(cursoActual.descripcionCorta || '');
        setDescripcion(cursoActual.descripcion || '');
        if (cursoActual.categorias) {
          const catNombres = cursoActual.categorias.split(', ');
          const seleccionadas = todasCats.filter(c => catNombres.includes(c.nombre)).map(c => c.categoria_id);
          setCategoriasSeleccionadas(seleccionadas);
        }
      }

      setCategorias(todasCats);

      const matsData = await resMateriales.json();
      const exsData = await resExamenes.json();
      const seccionesData = await resSecciones.json();

      setMateriales(matsData);
      setMaterialesOriginales(matsData);
      setExamenes(exsData);
      setExamenesOriginales(exsData);
      setSecciones(seccionesData);
      setTodosMateriales(await resTodosMat.json());
      setTodosExamenes(await resTodosEx.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [cursoId]);

  const handleCrearSeccion = async () => {
    if (!nuevaSeccion.trim()) return;
    const res = await fetch(`/api/admin/cursos/${cursoId}/secciones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: nuevaSeccion }),
    });
    if (res.ok) {
      const data = await res.json();
      setSecciones([...secciones, { seccion_id: data.seccion_id, titulo: nuevaSeccion, orden: data.orden }]);
      setNuevaSeccion('');
    }
  };

  const handleEditarSeccion = async (seccion_id, titulo) => {
    await fetch(`/api/admin/cursos/${cursoId}/secciones`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seccion_id, titulo }),
    });
    setSecciones(secciones.map(s => s.seccion_id === seccion_id ? { ...s, titulo } : s));
    setEditandoSeccion(null);
  };

  const handleEliminarSeccion = async (seccion_id) => {
    if (!window.confirm('¿Eliminar esta sección?')) return;
    await fetch(`/api/admin/cursos/${cursoId}/secciones?seccion_id=${seccion_id}`, { method: 'DELETE' });
    setSecciones(secciones.filter(s => s.seccion_id !== seccion_id));
    setMateriales(materiales.map(m => m.seccion_id === seccion_id ? { ...m, seccion_id: null } : m));
    setExamenes(examenes.map(ex => ex.seccion_id === seccion_id ? { ...ex, seccion_id: null } : ex));
    if (seccionSeleccionada === seccion_id) setSeccionSeleccionada(null);
  };

  const todosLosItems = [
    ...materiales.map((m, i) => ({ ...m, _tipo: 'material', _globalIndex: i })),
    ...examenes.map((ex, i) => ({ ...ex, _tipo: 'examen', _globalIndex: i })),
  ].sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const itemsFiltrados = seccionSeleccionada === 'sin_seccion'
    ? todosLosItems.filter(i => !i.seccion_id)
    : seccionSeleccionada
      ? todosLosItems.filter(i => i.seccion_id === seccionSeleccionada)
      : todosLosItems;

  const agregarMaterial = (archivo_id) => {
    const archivo = todosMateriales.find(m => m.archivo_id === archivo_id);
    if (!archivo) return;
    setMateriales([...materiales, { ...archivo, relacion_id: null, orden: todosLosItems.length + 1, seccion_id: seccionSeleccionada === 'sin_seccion' ? null : seccionSeleccionada }]);
    setShowAddContenido(false); setFiltroAdd('');
  };

  const agregarExamen = (quiz_id) => {
    const examen = todosExamenes.find(ex => ex.quiz_id === quiz_id);
    if (!examen) return;
    setExamenes([...examenes, { ...examen, quiz_curso_id: null, orden: todosLosItems.length + 1, seccion_id: seccionSeleccionada === 'sin_seccion' ? null : seccionSeleccionada }]);
    setShowAddContenido(false); setFiltroAdd('');
  };

  const eliminarItem = (item) => {
    if (item._tipo === 'material') setMateriales(materiales.filter((_, i) => i !== item._globalIndex));
    else setExamenes(examenes.filter((_, i) => i !== item._globalIndex));
  };

  const moverItem = (item, dir) => {
    // Trabajamos sobre la lista combinada ordenada
    const lista = [
      ...materiales.map((m, i) => ({ ...m, _tipo: 'material', _globalIndex: i })),
      ...examenes.map((ex, i) => ({ ...ex, _tipo: 'examen', _globalIndex: i })),
    ].sort((a, b) => (a.orden || 0) - (b.orden || 0));

    const idx = lista.findIndex(
      i => i._tipo === item._tipo && i._globalIndex === item._globalIndex
    );
    const swap = idx + dir;
    if (swap < 0 || swap >= lista.length) return;

    // Intercambiar órdenes
    const ordenA = lista[idx].orden ?? idx + 1;
    const ordenB = lista[swap].orden ?? swap + 1;
    lista[idx] = { ...lista[idx], orden: ordenB };
    lista[swap] = { ...lista[swap], orden: ordenA };

    // Redistribuir de vuelta a materiales y examenes
    const nuevosMateriales = [...materiales];
    const nuevosExamenes = [...examenes];
    lista.forEach(i => {
      if (i._tipo === 'material') nuevosMateriales[i._globalIndex] = { ...nuevosMateriales[i._globalIndex], orden: i.orden };
      else nuevosExamenes[i._globalIndex] = { ...nuevosExamenes[i._globalIndex], orden: i.orden };
    });
    setMateriales(nuevosMateriales);
    setExamenes(nuevosExamenes);
  };

  const cambiarSeccionItem = (item, seccion_id) => {
    if (item._tipo === 'material') {
      const nuevos = [...materiales];
      nuevos[item._globalIndex] = { ...nuevos[item._globalIndex], seccion_id: seccion_id || null };
      setMateriales(nuevos);
    } else {
      const nuevos = [...examenes];
      nuevos[item._globalIndex] = { ...nuevos[item._globalIndex], seccion_id: seccion_id || null };
      setExamenes(nuevos);
    }
  };

  const disponiblesParaAgregar = [
    ...todosMateriales
      .filter(m => !materiales.find(mc => mc.archivo_id === m.archivo_id))
      .filter(m => !filtroAdd || m.nombre_archivo.toLowerCase().includes(filtroAdd.toLowerCase()))
      .map(m => ({ ...m, _tipo: 'material', nombre: m.nombre_archivo, subtipo: m.tipo_archivo })),
    ...todosExamenes
      .filter(ex => !examenes.find(ec => ec.quiz_id === ex.quiz_id))
      .filter(ex => !filtroAdd || ex.titulo.toLowerCase().includes(filtroAdd.toLowerCase()))
      .map(ex => ({ ...ex, _tipo: 'examen', nombre: ex.titulo, subtipo: `${ex.total_preguntas} preguntas` })),
  ];

  const handleSave = async () => {
    if (!titulo.trim()) return alert('El título no puede estar vacío');
    if (!window.confirm('¿Guardar todos los cambios del curso?')) return;

    setSaving(true);
    try {
      // Info básica
      await fetch(`/api/admin/cursos/${cursoId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descripcion, descripcionCorta }),
      });

      // Categorías
      await fetch(`/api/admin/cursos/${cursoId}/categorias`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorias: categoriasSeleccionadas }),
      });

      // Sincronizar materiales
      const idsOriginales = materialesOriginales.map(m => m.relacion_id);
      const idsActuales = materiales.filter(m => m.relacion_id).map(m => m.relacion_id);
      for (const relacion_id of idsOriginales) {
        if (!idsActuales.includes(relacion_id)) {
          await fetch(`/api/admin/cursos/${cursoId}/materiales?relacion_id=${relacion_id}`, { method: 'DELETE' });
        }
      }
      for (const m of materiales) {
        if (!m.relacion_id) {
          await fetch(`/api/admin/cursos/${cursoId}/materiales`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivo_id: m.archivo_id, seccion_id: m.seccion_id || null }),
          });
        }
      }
      const materialesConId = materiales
        .filter(m => m.relacion_id)
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        if (materialesConId.length > 0) {
          await fetch(`/api/admin/cursos/${cursoId}/materiales`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ materiales: materialesConId.map((m, i) => ({ relacion_id: m.relacion_id, orden: i + 1, seccion_id: m.seccion_id || null })) }),
          });
      }

      // Sincronizar exámenes
      const exIdsOriginales = examenesOriginales.map(ex => ex.quiz_curso_id);
      const exIdsActuales = examenes.filter(ex => ex.quiz_curso_id).map(ex => ex.quiz_curso_id);
      for (const quiz_curso_id of exIdsOriginales) {
        if (!exIdsActuales.includes(quiz_curso_id)) {
          await fetch(`/api/admin/cursos/${cursoId}/examenes?quiz_curso_id=${quiz_curso_id}`, { method: 'DELETE' });
        }
      }
      for (const ex of examenes) {
        if (!ex.quiz_curso_id) {
          await fetch(`/api/admin/cursos/${cursoId}/examenes`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quiz_id: ex.quiz_id, seccion_id: ex.seccion_id || null }),
          });
        }
      }
      const examenesConId = examenes
        .filter(ex => ex.quiz_curso_id)
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      if (examenesConId.length > 0) {
        await fetch(`/api/admin/cursos/${cursoId}/examenes`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examenes: examenesConId.map((ex, i) => ({ quiz_curso_id: ex.quiz_curso_id, orden: i + 1, seccion_id: ex.seccion_id || null })) }),
        });
      }

      alert('Curso actualizado correctamente');
      await cargarDatos();
    } catch (err) {
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar "${titulo}"? Esta acción NO se puede deshacer.`)) return;
    if (!window.confirm(`⚠️ Última confirmación — ¿Eliminar permanentemente "${titulo}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cursos/${cursoId}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin');
      else alert('Error al eliminar el curso');
    } catch { alert('Error al conectar con el servidor'); }
    finally { setDeleting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="w-full p-4 lg:p-10 font-sans bg-slate-50/30 pb-32">
      <div className="grid grid-cols-3 items-center mb-10 pb-4 border-b border-slate-100">
        <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-bold text-xs uppercase tracking-widest group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Panel
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black text-slate-900">Editar Curso</h1>
          <p className="text-slate-400 text-xs font-medium mt-0.5">ID: #{cursoId}</p>
        </div>
        <div className="flex justify-end">
          <Loader2 className={`animate-spin text-blue-300 ${saving ? 'opacity-100' : 'opacity-0'}`} size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* COLUMNA 1: INFO + CATEGORÍAS + SECCIONES (3/12) */}
        <div className="lg:col-span-3 space-y-6">

          {/* Info básica */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600" /> Información
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Título</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                  value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descripción Corta</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                  value={descripcionCorta} onChange={(e) => setDescripcionCorta(e.target.value)} maxLength={255} />
                <p className="text-[10px] text-slate-300 font-bold mt-1">{descripcionCorta.length}/255</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descripción</label>
                <textarea className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium resize-none"
                  rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Categorías */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Tag size={16} className="text-blue-600" /> Categorías
            </h2>
            {categorias.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">No hay categorías disponibles</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categorias.map(cat => {
                  const activa = categoriasSeleccionadas.includes(cat.categoria_id);
                  return (
                    <button key={cat.categoria_id} type="button"
                      onClick={() => setCategoriasSeleccionadas(prev =>
                        activa ? prev.filter(id => id !== cat.categoria_id) : [...prev, cat.categoria_id]
                      )}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border flex items-center gap-1 ${
                        activa ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600'
                      }`}>
                      <Tag size={9} /> {cat.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secciones */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-blue-600" /> Secciones
              <span className="bg-blue-100 text-blue-600 text-xs font-black px-2 py-0.5 rounded-full">{secciones.length}</span>
            </h2>
            <div className="space-y-2 mb-4">
              {secciones.map((s) => (
                <div key={s.seccion_id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <Layers size={14} className="text-blue-400 shrink-0" />
                  {editandoSeccion === s.seccion_id ? (
                    <input autoFocus className="flex-1 text-sm font-bold bg-white border border-blue-300 rounded-lg px-2 py-1 outline-none"
                      defaultValue={s.titulo}
                      onBlur={(e) => handleEditarSeccion(s.seccion_id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditarSeccion(s.seccion_id, e.target.value)} />
                  ) : (
                    <span className="flex-1 text-sm font-bold text-slate-800">{s.titulo}</span>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditandoSeccion(s.seccion_id)} className="p-1 text-slate-400 hover:text-blue-500"><Pencil size={12} /></button>
                    <button onClick={() => handleEliminarSeccion(s.seccion_id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nueva sección..." value={nuevaSeccion}
                onChange={(e) => setNuevaSeccion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCrearSeccion())} />
              <button onClick={handleCrearSeccion} disabled={!nuevaSeccion.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-all">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: CONTENIDO (6/12) */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Contenido
                <span className="bg-blue-100 text-blue-600 text-xs font-black px-2 py-0.5 rounded-full">{todosLosItems.length}</span>
              </h2>
            </div>

            {/* Filtros de sección */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setSeccionSeleccionada(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${!seccionSeleccionada ? 'bg-blue-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-400 hover:border-blue-300'}`}>
                Todas
              </button>
              {secciones.map(s => (
                <button key={s.seccion_id}
                  onClick={() => setSeccionSeleccionada(seccionSeleccionada === s.seccion_id ? null : s.seccion_id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${seccionSeleccionada === s.seccion_id ? 'bg-blue-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-400 hover:border-blue-300'}`}>
                  {s.titulo}
                </button>
              ))}
              <button onClick={() => setSeccionSeleccionada('sin_seccion')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${seccionSeleccionada === 'sin_seccion' ? 'bg-slate-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-400'}`}>
                Sin sección
              </button>
            </div>

            {/* Hint */}
            {seccionSeleccionada && seccionSeleccionada !== 'sin_seccion' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
                <Layers size={13} className="text-blue-500 shrink-0" />
                <p className="text-xs font-black text-blue-600">
                  Agregando a: <span className="underline">{secciones.find(s => s.seccion_id === seccionSeleccionada)?.titulo}</span>
                </p>
              </div>
            )}

            {/* Botón agregar */}
            {!showAddContenido ? (
              <button onClick={() => setShowAddContenido(true)}
                className="flex items-center gap-2 bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-blue-700 transition-all mb-4">
                <Plus size={14} /> Agregar{seccionSeleccionada && seccionSeleccionada !== 'sin_seccion' ? ` a "${secciones.find(s => s.seccion_id === seccionSeleccionada)?.titulo}"` : ' contenido'}
              </button>
            ) : (
              <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Selecciona material o examen
                  {seccionSeleccionada && seccionSeleccionada !== 'sin_seccion' && (
                    <span className="text-blue-500 ml-2">→ {secciones.find(s => s.seccion_id === seccionSeleccionada)?.titulo}</span>
                  )}
                </p>
                <input className="w-full p-3 bg-white border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  placeholder="Buscar..." value={filtroAdd} onChange={(e) => setFiltroAdd(e.target.value)} autoFocus />
                {disponiblesParaAgregar.length === 0 ? (
                  <p className="text-slate-400 text-sm font-medium text-center py-4">No hay contenido disponible</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {disponiblesParaAgregar.map(item => (
                      <button key={`${item._tipo}-${item.archivo_id || item.quiz_id}`}
                        onClick={() => item._tipo === 'material' ? agregarMaterial(item.archivo_id) : agregarExamen(item.quiz_id)}
                        className={`w-full flex items-center gap-3 p-3 bg-white rounded-xl border transition-all text-left ${
                          item._tipo === 'material' ? 'border-slate-100 hover:border-blue-300 hover:bg-blue-50' : 'border-purple-100 hover:border-purple-300 hover:bg-purple-50'
                        }`}>
                        {item._tipo === 'material' ? <FileText size={15} className="text-blue-500 shrink-0" /> : <HelpCircle size={15} className="text-purple-500 shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{item.nombre}</p>
                          <p className="text-slate-400 text-xs">{item.subtipo}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${item._tipo === 'material' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                          {item._tipo === 'material' ? 'Material' : 'Examen'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => { setShowAddContenido(false); setFiltroAdd(''); }} className="mt-3 text-xs text-slate-400 hover:text-slate-600 font-bold">Cancelar</button>
              </div>
            )}

            {/* Lista de contenido */}
            {itemsFiltrados.length === 0 ? (
              <div className="text-center py-12 text-slate-300">
                <FileText size={36} strokeWidth={1} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold text-slate-400">{seccionSeleccionada ? 'No hay contenido en esta sección' : 'No hay contenido aún'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {itemsFiltrados.map((item, filtIndex) => {
                  const isMaterial = item._tipo === 'material';
                  const totalFiltrados = itemsFiltrados.length;
                  return (
                    <div key={`${item._tipo}-${item._globalIndex}`}
                      className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      
                      {/* Flechitas */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button type="button" onClick={() => moverItem(item, -1)} disabled={filtIndex === 0}
                          className="p-1 text-slate-200 hover:text-blue-500 disabled:opacity-0 transition-colors">
                          <ChevronUp size={14} />
                        </button>
                        <button type="button" onClick={() => moverItem(item, 1)} disabled={filtIndex === totalFiltrados - 1}
                          className="p-1 text-slate-200 hover:text-blue-500 disabled:opacity-0 transition-colors">
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      <div className={`p-2 rounded-xl shrink-0 ${isMaterial ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                        {isMaterial ? <FileText size={15} /> : <HelpCircle size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{isMaterial ? item.nombre_archivo : item.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isMaterial ? 'bg-blue-50 text-blue-400' : 'bg-purple-50 text-purple-400'}`}>
                            {isMaterial ? 'Material' : 'Examen'}
                          </span>
                          {secciones.length > 0 && (
                            <select value={item.seccion_id || ''}
                              onChange={(e) => cambiarSeccionItem(item, e.target.value ? parseInt(e.target.value) : null)}
                              className="text-[10px] font-bold text-slate-400 bg-transparent border-none outline-none cursor-pointer hover:text-blue-600 transition-colors">
                              <option value="">Sin sección</option>
                              {secciones.map(s => <option key={s.seccion_id} value={s.seccion_id}>{s.titulo}</option>)}
                            </select>
                          )}
                        </div>
                      </div>
                      {(!item.relacion_id && !item.quiz_curso_id) && (
                        <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">Nuevo</span>
                      )}
                      <button onClick={() => eliminarItem(item)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: ACCIONES (3/12) */}
        <div className="lg:col-span-3 space-y-4 lg:sticky lg:top-10">

          {/* Guardar */}
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100">
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          {/* Gestión alumnos */}
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 p-2.5 rounded-xl"><BookOpen size={18} className="text-blue-600" /></div>
              <div>
                <p className="font-black text-slate-900 text-sm">Alumnos</p>
                <p className="text-slate-400 text-xs">Inscribir o dar de baja</p>
              </div>
            </div>
            <Link href={`/admin/gestionar/${cursoId}`}
              className="flex items-center justify-center gap-2 bg-slate-900 text-white font-black text-xs px-5 py-3 rounded-xl hover:bg-blue-600 transition-all w-full">
              Gestionar Alumnos
            </Link>
          </div>

          {/* Eliminar */}
          <button onClick={handleDelete} disabled={deleting}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 font-black px-6 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            Eliminar Curso
          </button>
        </div>

      </div>
    </div>
  );
}