"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, X, Loader2, HelpCircle, Trash2, CheckCircle2, Type, AlignLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditarExamen({ params }) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({ titulo: '', descripcion: '' });
  const [preguntas, setPreguntas] = useState([]);

  useEffect(() => {
    if (localStorage.getItem('rol_id') !== '1') return router.push('/');
    setMounted(true);
  }, [router]);

  useEffect(() => {
    if (!mounted) return;

    const cargarExamen = async () => {
      try {
        const res = await fetch(`/api/admin/quizzes/${quizId}`);
        if (!res.ok) throw new Error('Examen no encontrado');
        const data = await res.json();

        setFormData({ titulo: data.titulo || '', descripcion: data.descripcion || '' });

        const preguntasMapeadas = (data.preguntas || []).map(p => {
          const respuestaCorrecta = p.opciones.findIndex(o => o.es_correcta === 1 || o.es_correcta === true);
          return {
            pregunta_id: p.pregunta_id,
            texto: p.texto_pregunta,
            opciones: p.opciones.map(o => o.texto_opcion),
            respuestaCorrecta: respuestaCorrecta >= 0 ? respuestaCorrecta : 0,
          };
        });

        setPreguntas(preguntasMapeadas.length > 0
          ? preguntasMapeadas
          : [{ texto: '', opciones: ['', ''], respuestaCorrecta: 0 }]
        );
      } catch (err) {
        console.error(err);
        alert('Error al cargar el examen.');
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    };

    cargarExamen();
  }, [mounted, quizId, router]);

  const agregarPregunta = () => {
    setPreguntas([...preguntas, { texto: '', opciones: ['', ''], respuestaCorrecta: 0 }]);
  };

  const eliminarPregunta = (index) => {
    if (preguntas.length === 1) return alert('El examen debe tener al menos una pregunta.');
    setPreguntas(preguntas.filter((_, i) => i !== index));
  };

  const manejarPregunta = (index, campo, valor) => {
    const nuevas = [...preguntas];
    nuevas[index][campo] = valor;
    setPreguntas(nuevas);
  };

  const manejarOpcion = (pIndex, oIndex, valor) => {
    const nuevas = [...preguntas];
    nuevas[pIndex].opciones[oIndex] = valor;
    setPreguntas(nuevas);
  };

  const agregarOpcion = (pIndex) => {
    const nuevas = [...preguntas];
    if (nuevas[pIndex].opciones.length < 4) {
      nuevas[pIndex].opciones.push('');
      setPreguntas(nuevas);
    }
  };

  const quitarOpcion = (pIndex, oIndex) => {
    const nuevas = [...preguntas];
    if (nuevas[pIndex].opciones.length > 2) {
      nuevas[pIndex].opciones.splice(oIndex, 1);
      if (nuevas[pIndex].respuestaCorrecta >= nuevas[pIndex].opciones.length) {
        nuevas[pIndex].respuestaCorrecta = 0;
      }
      setPreguntas(nuevas);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo) return alert('El título es obligatorio.');

    const confirmar = window.confirm('¿Guardar los cambios del examen?');
    if (!confirmar) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          preguntas,
        }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        const err = await res.json();
        alert('Error al guardar: ' + (err.error || 'Error desconocido'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Cargando examen...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen font-sans p-6 lg:p-8 text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Volver
        </Link>
        <div className="flex items-center gap-3">
          <Loader2 className={`animate-spin text-purple-300 ${saving ? 'opacity-100' : 'opacity-0'}`} size={20} />
          <h1 className="text-2xl font-black tracking-tight">Editar Examen</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                <Type size={12} className="text-purple-500" /> Título del Examen
              </label>
              <input
                required
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: Evaluación de Seguridad"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                <AlignLeft size={12} className="text-purple-500" /> Descripción / Instrucciones
              </label>
              <textarea
                rows="5"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-medium text-sm resize-none"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Instrucciones para el alumno..."
              />
            </div>
          </div>

          <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100 flex gap-4">
            <HelpCircle className="text-purple-500 shrink-0" size={20} />
            <p className="text-[11px] text-purple-700 font-medium leading-relaxed">
              Los cambios reemplazarán todas las preguntas y opciones actuales del examen.
            </p>
          </div>
        </div>

        {/* COLUMNA CENTRAL: PREGUNTAS */}
        <div className="xl:col-span-6 space-y-6">
          <div className="space-y-6">
            {preguntas.map((pregunta, pIndex) => (
              <div key={pIndex} className="bg-white p-8 rounded-[2rem] border-2 border-slate-50 shadow-sm relative group animate-in fade-in slide-in-from-bottom-3 duration-500">
                <button
                  type="button"
                  onClick={() => eliminarPregunta(pIndex)}
                  className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>

                <div className="flex items-center gap-2 mb-6">
                  <span className="bg-purple-600 text-white w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-purple-100">
                    {pIndex + 1}
                  </span>
                  <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Pregunta del Examen</h3>
                </div>

                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm mb-6 resize-none"
                  value={pregunta.texto}
                  onChange={(e) => manejarPregunta(pIndex, 'texto', e.target.value)}
                  placeholder="¿Qué desea preguntar?"
                  rows={2}
                  required
                />

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Opciones de Respuesta</p>
                  {pregunta.opciones.map((opcion, oIndex) => (
                    <div key={oIndex} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${pregunta.respuestaCorrecta === oIndex ? 'border-green-500 bg-green-50/30' : 'bg-white border-slate-100'}`}>
                      <button
                        type="button"
                        onClick={() => manejarPregunta(pIndex, 'respuestaCorrecta', oIndex)}
                        className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${pregunta.respuestaCorrecta === oIndex ? 'bg-green-500 border-green-500 text-white shadow-md' : 'border-slate-200 text-transparent hover:border-green-300'}`}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <input
                        className="w-full bg-transparent outline-none text-sm font-bold text-slate-700"
                        value={opcion}
                        onChange={(e) => manejarOpcion(pIndex, oIndex, e.target.value)}
                        placeholder={`Opción ${oIndex + 1}...`}
                        required
                      />
                      {pregunta.opciones.length > 2 && (
                        <button type="button" onClick={() => quitarOpcion(pIndex, oIndex)} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pregunta.opciones.length < 4 && (
                  <button
                    type="button"
                    onClick={() => agregarOpcion(pIndex)}
                    className="mt-6 mx-auto bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Plus size={14} /> Añadir Opción
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={agregarPregunta}
            className="w-full p-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black hover:bg-white hover:border-purple-300 hover:text-purple-500 transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-purple-50 transition-colors">
              <Plus size={24} />
            </div>
            <span className="uppercase text-xs tracking-[0.2em]">Nueva Pregunta</span>
          </button>
        </div>

        {/* COLUMNA DERECHA: RESUMEN */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm sticky top-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              Resumen
              <span className="text-xs font-bold bg-slate-100 text-slate-400 px-3 py-1 rounded-full">{preguntas.length}</span>
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Preguntas</p>
                <p className="font-black text-slate-700">{preguntas.length}</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">ID del Examen</p>
                <p className="font-black text-purple-700">#{quizId}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-purple-600 text-white p-5 rounded-2xl font-black shadow-xl shadow-purple-100 flex items-center justify-center gap-3 hover:bg-purple-700 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Guardar Cambios
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}