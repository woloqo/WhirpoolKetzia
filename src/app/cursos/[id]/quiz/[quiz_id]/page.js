"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, ArrowRight, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QuizPage(props) {
  const params = use(props.params);
  const curso_id = params.id;
  const quiz_id = params.quiz_id;
  const router = useRouter();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    fetch(`/api/quiz/detalle?quiz_id=${quiz_id}`)
      .then(res => res.json())
      .then(data => {
        setQuiz(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [quiz_id]);

  const seleccionarOpcion = (preguntaId, opcionId) => {
    setRespuestas({ ...respuestas, [preguntaId]: opcionId });
  };

  const siguientePregunta = () => {
    if (paso < quiz.preguntas.length - 1) setPaso(paso + 1);
  };

  const enviarQuiz = async () => {
    setEnviando(true);
    const usuarioId = localStorage.getItem('usuario_id');
    
    try {
      const res = await fetch('/api/quiz/evaluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          quiz_id: quiz_id,
          respuestas,
          curso_id: curso_id
        }),
      });
      const data = await res.json();
      setResultado(data);
    } catch (error) {
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!quiz) return <div className="p-20 text-center">Quiz no encontrado</div>;

  // Pantalla de Resultados
  if (resultado) {
    const aprobado = resultado.calificacion >= quiz.puntos_minimos;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-xl text-center border border-slate-100">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center ${aprobado ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {aprobado ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">
            {aprobado ? '¡Excelente Trabajo!' : 'Puedes Mejorar'}
          </h2>
          <p className="text-slate-500 font-bold text-lg mb-8">Tu calificación: {resultado.calificacion}%</p>
          
          <div className="space-y-3">
            <Link href={`/cursos/${curso_id}`} className="block w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-blue-600 transition-all">
              Volver al Curso
            </Link>
            {!aprobado && (
              <button onClick={() => window.location.reload()} className="w-full text-slate-400 font-bold py-2 hover:text-slate-900 transition-colors">
                Reintentar Evaluación
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const preguntaActual = quiz.preguntas[paso];
  const totalPreguntas = quiz.preguntas.length;
  const progresoPregunta = ((paso + 1) / totalPreguntas) * 100;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col justify-center">
        
        {/* Header del Quiz */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Evaluación Whirlpool</p>
              <h1 className="text-2xl font-black">{quiz.titulo}</h1>
            </div>
            <span className="text-slate-500 font-mono text-sm">{paso + 1} / {totalPreguntas}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progresoPregunta}%` }}></div>
          </div>
        </div>

        {/* Cuerpo de la Pregunta */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold leading-tight mb-8">
            {preguntaActual.texto_pregunta}
          </h2>

          <div className="grid gap-4">
            {preguntaActual.opciones.map((opcion) => (
              <button
                key={opcion.opcion_id}
                onClick={() => seleccionarOpcion(preguntaActual.pregunta_id, opcion.opcion_id)}
                className={`p-6 text-left rounded-[2rem] border-2 transition-all duration-300 font-bold text-lg flex justify-between items-center group
                  ${respuestas[preguntaActual.pregunta_id] === opcion.opcion_id 
                    ? 'border-blue-500 bg-blue-600/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800'}`}
              >
                {opcion.texto_opcion}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${respuestas[preguntaActual.pregunta_id] === opcion.opcion_id ? 'border-blue-400 bg-blue-400' : 'border-slate-700'}`}>
                  {respuestas[preguntaActual.pregunta_id] === opcion.opcion_id && <div className="w-2 h-2 bg-slate-900 rounded-full"></div>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navegación */}
        <div className="flex justify-end pt-8 border-t border-slate-800">
          {paso < totalPreguntas - 1 ? (
            <button
              onClick={siguientePregunta}
              disabled={!respuestas[preguntaActual.pregunta_id]}
              className="bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20"
            >
              Siguiente Pregunta <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={enviarQuiz}
              disabled={enviando || !respuestas[preguntaActual.pregunta_id]}
              className="bg-emerald-500 disabled:opacity-30 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-900/20"
            >
              {enviando ? 'Calificando...' : 'Finalizar Evaluación'} <CheckCircle2 size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}