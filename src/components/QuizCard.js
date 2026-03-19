"use client";
import { useState } from 'react';
import { Send, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function QuizCard({ quiz, usuario_id, curso_id, onTerminado }) {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);

  const preguntaActual = quiz.preguntas[paso];

  const seleccionarOpcion = (preguntaId, opcionId) => {
    setRespuestas({ ...respuestas, [preguntaId]: opcionId });
    if (paso < quiz.preguntas.length - 1) {
      setPaso(paso + 1);
    }
  };

  const enviarQuiz = async () => {
    setEnviando(true);
    // Aquí llamarías a tu API de evaluar (la que comparará con la DB)
    const res = await fetch('/api/quiz/evaluar', {
      method: 'POST',
      body: JSON.stringify({ usuario_id, quiz_id: quiz.quiz_id, respuestas, curso_id })
    });
    if (res.ok) onTerminado(); // Recargar datos del curso
    setEnviando(false);
  };

  return (
    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <HelpCircle size={120} />
      </div>

      <div className="relative z-10">
        <span className="text-blue-400 text-xs font-black uppercase tracking-[0.2em]">Evaluación Final</span>
        <h2 className="text-2xl font-black mt-2 mb-8">{quiz.titulo}</h2>

        <div className="mb-8">
          <p className="text-slate-400 text-sm mb-4">Pregunta {paso + 1} de {quiz.preguntas.length}</p>
          <h3 className="text-xl font-bold leading-tight">{preguntaActual.texto_pregunta}</h3>
        </div>

        <div className="grid gap-3">
          {preguntaActual.opciones.map((op) => (
            <button
              key={op.opcion_id}
              onClick={() => seleccionarOpcion(preguntaActual.pregunta_id, op.opcion_id)}
              className={`p-5 text-left rounded-2xl font-bold transition-all border-2 ${
                respuestas[preguntaActual.pregunta_id] === op.opcion_id
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-slate-800 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              {op.texto_opcion}
            </button>
          ))}
        </div>

        {paso === quiz.preguntas.length - 1 && respuestas[preguntaActual.pregunta_id] && (
          <button 
            onClick={enviarQuiz}
            disabled={enviando}
            className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
          >
            {enviando ? 'Calificando...' : 'Finalizar Evaluación'} <Send size={20} />
          </button>
        )}
      </div>
    </div>
  );
}