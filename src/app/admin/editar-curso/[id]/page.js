"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Loader2, BookOpen, FileText, HelpCircle, Plus, X, ChevronUp, ChevronDown, Pencil, Layers } from 'lucide-react';
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
      const [resCursos, resMateriales, resExamenes, resTodosMat, resTodosEx, resSecciones] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch(`/api/admin/cursos/${cursoId}/materiales`),
        fetch(`/api/admin/cursos/${cursoId}/examenes`),
        fetch('/api/admin/archivos'),
        fetch('/api/admin/quizzes'),
        fetch(`/api/admin/cursos/${cursoId}/secciones`),
      ]);

      const cursos = await resCursos.json();
      const cursoActual = cursos.find(c => String(c.curso_id) === String(cursoId));
      if (cursoActual) {
        setTitulo(cursoActual.titulo || '');
        setDescripcionCorta(cursoActual.descripcionCorta || '');
        setDescripcion(cursoActual.descripcion || '');
      }

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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seccion_id, titulo }),
    });
    setSecciones(secciones.map(s => s.seccion_id === seccion_id ? { ...s, titulo } : s));
    setEditandoSeccion(null);
  };

  const handleEliminarSeccion = async (seccion_id) => {
    if (!window.confirm('¿Eliminar esta sección? Los materiales y exámenes quedarán sin sección asignada.')) return;
    await fetch(`/api/admin/cursos/${cursoId}/secciones?seccion_id=${seccion_id}`, { method: 'DELETE' });
    setSecciones(secciones.filter(s => s.seccion_id !== seccion_id));
    setMateriales(materiales.map(m => m.seccion_id === seccion_id ? { ...m, seccion_id: null } : m));
    setExamenes(examenes.map(ex => ex.seccion_id === seccion_id ? { ...ex, seccion_id: null } : ex));
    if (seccionSeleccionada === seccion_id) setSeccionSeleccionada(null);
  };

  // Todo el contenido unificado con orden global
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
    setShowAddContenido(false);
    setFiltroAdd('');
  };

  const agregarExamen = (quiz_id) => {
    const examen = todosExamenes.find(ex => ex.quiz_id === quiz_id);
    if (!examen) return;
    setExamenes([...examenes, { ...examen, quiz_curso_id: null, orden: todosLosItems.length + 1, seccion_id: seccionSeleccionada === 'sin_seccion' ? null : seccionSeleccionada }]);
    setShowAddContenido(false);
    setFiltroAdd('');
  };

  const eliminarItem = (item) => {
    if (item._tipo === 'material') {
      setMateriales(materiales.filter((_, i) => i !== item._globalIndex));
    } else {
      setExamenes(examenes.filter((_, i) => i !== item._globalIndex));
    }
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
    const confirmar = window.confirm('¿Guardar todos los cambios del curso?');
    if (!confirmar) return;

    setSaving(true);
    try {
      await fetch(`/api/admin/cursos/${cursoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descripcion, descripcionCorta }),
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivo_id: m.archivo_id, seccion_id: m.seccion_id || null }),
          });
        }
      }
      const materialesConId = materiales.filter(m => m.relacion_id);
      if (materialesConId.length > 0) {
        await fetch(`/api/admin/cursos/${cursoId}/materiales`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quiz_id: ex.quiz_id, seccion_id: ex.seccion_id || null }),
          });
        }
      }
      const examenesConId = examenes.filter(ex => ex.quiz_curso_id);
      if (examenesConId.length > 0) {
        await fetch(`/api/admin/cursos/${cursoId}/examenes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
    const c1 = window.confirm(`¿Eliminar "${titulo}"? Esta acción NO se puede deshacer.`);
    if (!c1) return;
    const c2 = window.confirm(`⚠️ Última confirmación — ¿Eliminar permanentemente "${titulo}"?`);
    if (!c2) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cursos/${cursoId}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin');
      else alert('Error al eliminar el curso');
    } catch (err) {
      alert('Error al conectar con el servidor');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="mx-auto p-6 lg:p-10 font-sans pb-32">
      <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 font-bold transition-colors">
        <ArrowLeft size={18} /> Volver al Panel
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">Editar Curso</h1>
        <p className="text-slate-400 font-medium mt-1">ID: #{cursoId}</p>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-3 space-y-6">
          {/* Info básica */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" /> Información del Curso
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                  value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción Corta</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
                  value={descripcionCorta} onChange={(e) => setDescripcionCorta(e.target.value)} maxLength={255} />
                <p className="text-[10px] text-slate-300 font-bold mt-1 ml-1">{descripcionCorta.length}/255</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
                <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium resize-none"
                  rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Secciones */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-4">
            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <Layers size={20} className="text-blue-600" /> Secciones
              <span className="bg-blue-100 text-blue-600 text-xs font-black px-2 py-0.5 rounded-full">{secciones.length}</span>
            </h2>

            <div className="space-y-2 mb-4">
              {secciones.map((s) => (
                <div key={s.seccion_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <Layers size={16} className="text-blue-400 shrink-0" />
                  {editandoSeccion === s.seccion_id ? (
                    <input autoFocus
                      className="flex-1 text-sm font-bold bg-white border border-blue-300 rounded-xl px-3 py-1.5 outline-none"
                      defaultValue={s.titulo}
                      onBlur={(e) => handleEditarSeccion(s.seccion_id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditarSeccion(s.seccion_id, e.target.value)}
                    />
                  ) : (
                    <span className="flex-1 text-sm font-bold text-slate-800">{s.titulo}</span>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditandoSeccion(s.seccion_id)} className="p-1.5 text-slate-400 hover:text-blue-500"><Pencil size={13} /></button>
                    <button onClick={() => handleEliminarSeccion(s.seccion_id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="Nueva sección..."
                value={nuevaSeccion}
                onChange={(e) => setNuevaSeccion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCrearSeccion())}
              />
              <button onClick={handleCrearSeccion} disabled={!nuevaSeccion.trim()}
                className="flex items-center gap-2 bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40">
                <Plus size={14} /> Agregar
              </button>
            </div>
          </div>

        </div>


        <div className="lg:col-span-6 space-y-4">

        {/* Contenido unificado */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Contenido
              <span className="bg-blue-100 text-blue-600 text-xs font-black px-2 py-0.5 rounded-full">{todosLosItems.length}</span>
            </h2>
          </div>

          {/* Filtros de sección — seleccionar aquí determina a qué sección se agrega el contenido */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button onClick={() => setSeccionSeleccionada(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${!seccionSeleccionada ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600'}`}>
              Todas
            </button>
            {secciones.map(s => (
              <button key={s.seccion_id}
                onClick={() => setSeccionSeleccionada(seccionSeleccionada === s.seccion_id ? null : s.seccion_id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${seccionSeleccionada === s.seccion_id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600'}`}>
                {s.titulo}
              </button>
            ))}
            <button onClick={() => setSeccionSeleccionada('sin_seccion')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${seccionSeleccionada === 'sin_seccion' ? 'bg-slate-700 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-400 hover:border-slate-400'}`}>
              Sin sección
            </button>
          </div>

          {/* Hint de sección seleccionada */}
          {seccionSeleccionada && seccionSeleccionada !== 'sin_seccion' && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
              <Layers size={14} className="text-blue-500" />
              <p className="text-xs font-black text-blue-600">
                El contenido que agregues irá a: <span className="underline">{secciones.find(s => s.seccion_id === seccionSeleccionada)?.titulo}</span>
              </p>
            </div>
          )}

          {/* Lista de contenido */}
          {itemsFiltrados.length === 0 ? (
            <div className="text-center py-10 text-slate-300">
              <FileText size={40} strokeWidth={1} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold text-slate-400">
                {seccionSeleccionada ? 'No hay contenido en esta sección' : 'No hay contenido en este curso'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {itemsFiltrados.map((item, filtIndex) => {
                const isMaterial = item._tipo === 'material';
                return (
                  <div key={`${item._tipo}-${item._globalIndex}`}
                    className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className={`p-2 rounded-xl shrink-0 ${isMaterial ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                      {isMaterial ? <FileText size={16} /> : <HelpCircle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {isMaterial ? item.nombre_archivo : item.titulo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isMaterial ? 'bg-blue-50 text-blue-400' : 'bg-purple-50 text-purple-400'}`}>
                          {isMaterial ? 'Material' : 'Examen'}
                        </span>
                        {secciones.length > 0 && (
                          <select
                            value={item.seccion_id || ''}
                            onChange={(e) => cambiarSeccionItem(item, e.target.value ? parseInt(e.target.value) : null)}
                            className="text-[10px] font-bold text-slate-400 bg-transparent border-none outline-none cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            <option value="">Sin sección</option>
                            {secciones.map(s => <option key={s.seccion_id} value={s.seccion_id}>{s.titulo}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    {(!item.relacion_id && !item.quiz_curso_id) && (
                      <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">Nuevo</span>
                    )}
                    <button onClick={() => eliminarItem(item)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          </div>

          <div className="lg:col-span-3 space-y-6">

            {/* Selector de agregar contenido */}
            {showAddContenido ? (
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Selecciona material o examen
                  {seccionSeleccionada && seccionSeleccionada !== 'sin_seccion' && (
                    <span className="text-blue-500 ml-2">→ {secciones.find(s => s.seccion_id === seccionSeleccionada)?.titulo}</span>
                  )}
                </p>
                <input
                  className="w-full p-3 bg-white border border-slate-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  placeholder="Buscar..."
                  value={filtroAdd}
                  onChange={(e) => setFiltroAdd(e.target.value)}
                  autoFocus
                />
                {disponiblesParaAgregar.length === 0 ? (
                  <p className="text-slate-400 text-sm font-medium text-center py-4">No hay contenido disponible</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {disponiblesParaAgregar.map(item => (
                      <button
                        key={`${item._tipo}-${item.archivo_id || item.quiz_id}`}
                        onClick={() => item._tipo === 'material' ? agregarMaterial(item.archivo_id) : agregarExamen(item.quiz_id)}
                        className={`w-full flex items-center gap-3 p-3 bg-white rounded-xl border transition-all text-left ${
                          item._tipo === 'material'
                            ? 'border-slate-100 hover:border-blue-300 hover:bg-blue-50'
                            : 'border-purple-100 hover:border-purple-300 hover:bg-purple-50'
                        }`}>
                        {item._tipo === 'material'
                          ? <FileText size={16} className="text-blue-500 shrink-0" />
                          : <HelpCircle size={16} className="text-purple-500 shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{item.nombre}</p>
                          <p className="text-slate-400 text-xs">{item.subtipo}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          item._tipo === 'material' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                        }`}>
                          {item._tipo === 'material' ? 'Material' : 'Examen'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => { setShowAddContenido(false); setFiltroAdd(''); }}
                  className="mt-3 text-xs text-slate-400 hover:text-slate-600 font-bold">Cancelar</button>
              </div>
            ) : (
              <button onClick={() => setShowAddContenido(true)}
                className="flex items-center gap-2 bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-blue-700 transition-all mb-4">
                <Plus size={14} /> Agregar contenido{seccionSeleccionada && seccionSeleccionada !== 'sin_seccion' ? ` a "${secciones.find(s => s.seccion_id === seccionSeleccionada)?.titulo}"` : ''}
              </button>
            )}
            </div>

        </div>

        <div className="lg:col-span-3 space-y-6">
          
          {/* Gestión de alumnos */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-2xl"><BookOpen size={20} className="text-blue-600" /></div>
              <div>
                <p className="font-black text-slate-900 text-sm">Gestión del curso</p>
              </div>
            </div>
            <Link href={`/admin/gestionar/${cursoId}`}
              className="flex items-center mt-4 bg-slate-900 text-white font-black text-xs px-5 py-3 rounded-xl hover:bg-blue-600 transition-all">
              Gestionar Alumnos
            </Link>

            {/* Acciones */}
            <Button className="w-full mt-4 text-base rounded-[1.5rem]" loading={loading} icon={Save} onClick={handleSave}>
              Guardar cambios
            </Button>

          </div>

        </div>

      </div>
    </div>
  );
}