"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, Loader2, BookOpen, FileText, HelpCircle, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

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

  // Estado local de materiales y exámenes (no se guarda hasta presionar el botón)
  const [materiales, setMateriales] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [materialesOriginales, setMaterialesOriginales] = useState([]);
  const [examenesOriginales, setExamenesOriginales] = useState([]);

  const [todosMateriales, setTodosMateriales] = useState([]);
  const [todosExamenes, setTodosExamenes] = useState([]);

  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddExamen, setShowAddExamen] = useState(false);

  const cargarDatos = async () => {
    try {
      const [resCursos, resMateriales, resExamenes, resTodosMat, resTodosEx] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch(`/api/admin/cursos/${cursoId}/materiales`),
        fetch(`/api/admin/cursos/${cursoId}/examenes`),
        fetch('/api/admin/archivos'),
        fetch('/api/admin/quizzes'),
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

      setMateriales(matsData);
      setMaterialesOriginales(matsData);
      setExamenes(exsData);
      setExamenesOriginales(exsData);
      setTodosMateriales(await resTodosMat.json());
      setTodosExamenes(await resTodosEx.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [cursoId]);

  const handleSave = async () => {
    if (!titulo.trim()) return alert('El título no puede estar vacío');
    
    const confirmar = window.confirm('¿Guardar todos los cambios del curso?');
    if (!confirmar) return;

    setSaving(true);
    try {
      // 1. Guardar info básica
      await fetch(`/api/admin/cursos/${cursoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descripcion, descripcionCorta }),
      });

      // 2. Sincronizar materiales — borrar los que se quitaron, agregar los nuevos
      const idsOriginales = materialesOriginales.map(m => m.relacion_id);
      const idsActuales = materiales.filter(m => m.relacion_id).map(m => m.relacion_id);

      // Eliminar materiales quitados
      for (const relacion_id of idsOriginales) {
        if (!idsActuales.includes(relacion_id)) {
          await fetch(`/api/admin/cursos/${cursoId}/materiales?relacion_id=${relacion_id}`, { method: 'DELETE' });
        }
      }

      // Agregar materiales nuevos
      for (const m of materiales) {
        if (!m.relacion_id) {
          await fetch(`/api/admin/cursos/${cursoId}/materiales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivo_id: m.archivo_id }),
          });
        }
      }

      // Actualizar orden
      const materialesConId = materiales.filter(m => m.relacion_id);
      if (materialesConId.length > 0) {
        await fetch(`/api/admin/cursos/${cursoId}/materiales`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materiales: materialesConId.map((m, i) => ({ relacion_id: m.relacion_id, orden: i + 1 })) }),
        });
      }

      // 3. Sincronizar exámenes
      const exIdsOriginales = examenesOriginales.map(ex => ex.quiz_curso_id);
      const exIdsActuales = examenes.filter(ex => ex.quiz_curso_id).map(ex => ex.quiz_curso_id);

      // Eliminar exámenes quitados
      for (const quiz_curso_id of exIdsOriginales) {
        if (!exIdsActuales.includes(quiz_curso_id)) {
          await fetch(`/api/admin/cursos/${cursoId}/examenes?quiz_curso_id=${quiz_curso_id}`, { method: 'DELETE' });
        }
      }

      // Agregar exámenes nuevos
      for (const ex of examenes) {
        if (!ex.quiz_curso_id) {
          await fetch(`/api/admin/cursos/${cursoId}/examenes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quiz_id: ex.quiz_id }),
          });
        }
      }

      // Actualizar orden exámenes
      const examenesConId = examenes.filter(ex => ex.quiz_curso_id);
      if (examenesConId.length > 0) {
        await fetch(`/api/admin/cursos/${cursoId}/examenes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examenes: examenesConId.map((ex, i) => ({ quiz_curso_id: ex.quiz_curso_id, orden: i + 1 })) }),
        });
      }

      alert('Curso actualizado correctamente');
      await cargarDatos(); // Recargar para sincronizar IDs reales
    } catch (err) {
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const c1 = window.confirm(`¿Estás seguro de eliminar "${titulo}"?\n\nEsta acción eliminará todas las inscripciones y el progreso de los alumnos. NO se puede deshacer.`);
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

  // Agregar material al estado local (sin llamar al API)
  const agregarMaterial = (archivo_id) => {
    const archivo = todosMateriales.find(m => m.archivo_id === archivo_id);
    if (!archivo) return;
    setMateriales([...materiales, { ...archivo, relacion_id: null, orden: materiales.length + 1 }]);
    setShowAddMaterial(false);
  };

  // Quitar material del estado local
  const eliminarMaterial = (index) => {
    setMateriales(materiales.filter((_, i) => i !== index));
  };

  // Mover material en estado local
  const moverMaterial = (index, direccion) => {
    const nuevos = [...materiales];
    const swap = index + direccion;
    if (swap < 0 || swap >= nuevos.length) return;
    [nuevos[index], nuevos[swap]] = [nuevos[swap], nuevos[index]];
    setMateriales(nuevos);
  };

  // Agregar examen al estado local
  const agregarExamen = (quiz_id) => {
    const examen = todosExamenes.find(ex => ex.quiz_id === quiz_id);
    if (!examen) return;
    setExamenes([...examenes, { ...examen, quiz_curso_id: null, orden: examenes.length + 1 }]);
    setShowAddExamen(false);
  };

  // Quitar examen del estado local
  const eliminarExamen = (index) => {
    setExamenes(examenes.filter((_, i) => i !== index));
  };

  // Mover examen en estado local
  const moverExamen = (index, direccion) => {
    const nuevos = [...examenes];
    const swap = index + direccion;
    if (swap < 0 || swap >= nuevos.length) return;
    [nuevos[index], nuevos[swap]] = [nuevos[swap], nuevos[index]];
    setExamenes(nuevos);
  };

  const materialesDisponibles = todosMateriales.filter(m => !materiales.find(mc => mc.archivo_id === m.archivo_id));
  const examenesDisponibles = todosExamenes.filter(ex => !examenes.find(ec => ec.quiz_id === ex.quiz_id));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10 font-sans pb-32">
      <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 font-bold transition-colors">
        <ArrowLeft size={18} /> Volver al Panel
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Editar Curso</h1>
          <p className="text-slate-400 font-medium mt-1">ID: #{cursoId}</p>
        </div>
      </div>

      {/* Info básica */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6">
        <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" /> Información del Curso
        </h2>
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título</label>
            <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
              value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título del curso..." />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción Corta</label>
            <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
              value={descripcionCorta} onChange={(e) => setDescripcionCorta(e.target.value)} placeholder="Descripción corta visible en el catálogo..." maxLength={255} />
            <p className="text-[10px] text-slate-300 font-bold mt-1 ml-1">{descripcionCorta.length}/255</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
            <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium resize-none"
              rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción completa del curso..." />
          </div>
        </div>
      </div>

      {/* Materiales */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" /> Materiales
            <span className="bg-blue-100 text-blue-600 text-xs font-black px-2 py-0.5 rounded-full">{materiales.length}</span>
          </h2>
          {!showAddMaterial && (
            <button onClick={() => setShowAddMaterial(true)}
              className="flex items-center gap-2 bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-blue-700 transition-all">
              <Plus size={14} /> Agregar
            </button>
          )}
        </div>

        {showAddMaterial && (
          <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Selecciona un material</p>
            {materialesDisponibles.length === 0 ? (
              <p className="text-slate-400 text-sm font-medium">No hay materiales disponibles</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {materialesDisponibles.map(m => (
                  <button key={m.archivo_id} onClick={() => agregarMaterial(m.archivo_id)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                    <FileText size={16} className="text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{m.nombre_archivo}</p>
                      <p className="text-slate-400 text-xs">{m.tipo_archivo}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowAddMaterial(false)} className="mt-3 text-xs text-slate-400 hover:text-slate-600 font-bold">Cancelar</button>
          </div>
        )}

        {materiales.length === 0 ? (
          <p className="text-slate-400 text-sm font-medium text-center py-6">No hay materiales en este curso</p>
        ) : (
          <div className="space-y-2">
            {materiales.map((m, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moverMaterial(index, -1)} disabled={index === 0}
                    className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moverMaterial(index, 1)} disabled={index === materiales.length - 1}
                    className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <span className="text-xs font-black text-slate-300 w-5">{index + 1}</span>
                <FileText size={16} className="text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{m.nombre_archivo}</p>
                  <p className="text-slate-400 text-xs">{m.tipo_archivo}</p>
                </div>
                {!m.relacion_id && (
                  <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Nuevo</span>
                )}
                <button onClick={() => eliminarMaterial(index)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exámenes */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <HelpCircle size={20} className="text-purple-600" /> Exámenes
            <span className="bg-purple-100 text-purple-600 text-xs font-black px-2 py-0.5 rounded-full">{examenes.length}</span>
          </h2>
          {!showAddExamen && (
            <button onClick={() => setShowAddExamen(true)}
              className="flex items-center gap-2 bg-purple-600 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-purple-700 transition-all">
              <Plus size={14} /> Agregar
            </button>
          )}
        </div>

        {showAddExamen && (
          <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Selecciona un examen</p>
            {examenesDisponibles.length === 0 ? (
              <p className="text-slate-400 text-sm font-medium">No hay exámenes disponibles</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {examenesDisponibles.map(ex => (
                  <button key={ex.quiz_id} onClick={() => agregarExamen(ex.quiz_id)}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-purple-300 hover:bg-purple-50 transition-all text-left">
                    <HelpCircle size={16} className="text-purple-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{ex.titulo}</p>
                      <p className="text-slate-400 text-xs">{ex.total_preguntas} preguntas</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowAddExamen(false)} className="mt-3 text-xs text-slate-400 hover:text-slate-600 font-bold">Cancelar</button>
          </div>
        )}

        {examenes.length === 0 ? (
          <p className="text-slate-400 text-sm font-medium text-center py-6">No hay exámenes en este curso</p>
        ) : (
          <div className="space-y-2">
            {examenes.map((ex, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moverExamen(index, -1)} disabled={index === 0}
                    className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moverExamen(index, 1)} disabled={index === examenes.length - 1}
                    className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
                    <ChevronDown size={14} />
                  </button>
                </div>
                <span className="text-xs font-black text-slate-300 w-5">{index + 1}</span>
                <HelpCircle size={16} className="text-purple-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{ex.titulo}</p>
                  <p className="text-slate-400 text-xs">{ex.total_preguntas} preguntas</p>
                </div>
                {!ex.quiz_curso_id && (
                  <span className="text-[10px] font-black text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">Nuevo</span>
                )}
                <button onClick={() => eliminarExamen(index)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gestión de alumnos */}
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-3 rounded-2xl">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm">Gestión de Alumnos</p>
            <p className="text-slate-400 text-xs font-medium">Inscribir o dar de baja alumnos del curso</p>
          </div>
        </div>
        <Link href={`/admin/gestionar/${cursoId}`}
          className="flex items-center gap-2 bg-slate-900 text-white font-black text-xs px-5 py-3 rounded-xl hover:bg-blue-600 transition-all">
          Gestionar Alumnos
        </Link>
      </div>

      {/* Acciones */}
      <div className="flex gap-4 mt-6">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100">
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 font-black px-6 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
          {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          Eliminar Curso
        </button>
      </div>
    </div>
  );
}