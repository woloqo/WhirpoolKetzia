"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, Database, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const INTENCIONES_RAG = [
  'curso', 'cursos', 'progreso', 'avance', 'pendiente', 'completar', 'terminar',
  'gema', 'gemas', 'quiz', 'examen', 'evaluación', 'calificación', 'nota',
  'racha', 'actividad', 'comunidad', 'publicación', 'notificación',
  'mi perfil', 'mis cursos', 'mis gemas', 'mis evaluaciones',
  'cuánto', 'cuántos', 'cuántas', 'qué tengo', 'qué me falta',
  'qué he completado',
];

function detectarRAG(texto) {
  const lower = texto.toLowerCase();
  return INTENCIONES_RAG.some(kw => lower.includes(kw));
}

function RAGBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
      <Database size={9} /> Datos de la plataforma
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRAG, setLoadingRAG] = useState(false);

  const contextoRAGRef = useRef(null);
  const contextoRAGTimestamp = useRef(null);
  const RAG_TTL = 10 * 60 * 1000; // 5 minutos

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const fetchContextoRAG = useCallback(async () => {
    const uid = localStorage.getItem('usuario_id');
    if (!uid) return null;

    const ahora = Date.now();
    const cacheValido = contextoRAGTimestamp.current &&
      (ahora - contextoRAGTimestamp.current) < RAG_TTL &&
      contextoRAGRef.current;

    if (cacheValido) return contextoRAGRef.current;

    setLoadingRAG(true);
    try {
      const res = await fetch(`/api/rag/contexto?usuario_id=${uid}`);
      if (!res.ok) return null;
      const data = await res.json();
      contextoRAGRef.current = data.contexto;
      contextoRAGTimestamp.current = Date.now();
      return data.contexto;
    } catch (e) {
      console.error('Error fetching RAG context:', e);
      return null;
    } finally {
      setLoadingRAG(false);
    }
  }, []);

  const handleOpen = async () => {
    setIsOpen(true);
    fetchContextoRAG();
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const uid = localStorage.getItem('usuario_id');
    const nombreUsuario = localStorage.getItem('nombre_usuario') || 'empleado';
    const userPrompt = input.trim();

    const userMsg = { role: 'user', parts: [{ text: userPrompt }] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const necesitaRAG = detectarRAG(userPrompt);
      let contextoRAG = null;

      if (necesitaRAG && uid) {
        contextoRAG = await fetchContextoRAG();
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          historial: messages,
          nombreUsuario,
          usuario_id: uid,
          contextoRAG,
        }),
      });

      if (!res.ok) throw new Error('Error en la respuesta');

      const data = await res.json();

      if (data.necesita_contexto && uid) {
        contextoRAGTimestamp.current = null;
        const nuevoContexto = await fetchContextoRAG();

        const res2 = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userPrompt,
            historial: messages,
            nombreUsuario,
            usuario_id: uid,
            contextoRAG: nuevoContexto,
          }),
        });
        const data2 = await res2.json();
        setMessages(prev => [...prev, {
          role: 'model',
          parts: [{ text: data2.text_content || 'No pude generar una respuesta.' }],
          usedRAG: data2.uso_rag,
        }]);
        return;
      }

      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: data.text_content || 'No pude generar una respuesta.' }],
        usedRAG: data.uso_rag,
      }]);

    } catch (e) {
      console.error('Chat error:', e);
      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: 'Hubo un error de conexión. Intenta de nuevo.' }],
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sugerencias = [
    '¿Qué cursos tengo pendientes?',
    '¿Cuál es mi progreso en mis cursos?',
    '¿Que gemas hay relacionadas con la ingeniería??',
    'Dime un resumen de lo más nuevo en la comunidad.',
  ];

  return (
    <div className={`fixed z-50 transition-all duration-500 ${
      isOpen
        ? 'inset-0 lg:left-auto lg:right-0 lg:top-0 lg:h-screen lg:w-96'
        : 'bottom-24 right-6 lg:bottom-10 lg:right-10'
    }`}>

      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="bg-white hover:bg-slate-50 w-12 h-12 rounded-full shadow-2xl transition-all active:scale-90 flex items-center justify-center border border-slate-100 overflow-hidden"
        >
          <img src="/gemini.webp" alt="Whirlpool AI" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Panel del chat */}
      {isOpen && (
        <div className="bg-white shadow-2xl flex flex-col overflow-hidden h-full w-full lg:border-l lg:border-slate-100 lg:animate-in lg:slide-in-from-right-full">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                <img src="/gemini.webp" alt="AI" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-black text-sm leading-none">Whirlpool AI</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">
                    {loadingRAG ? 'Cargando datos...' : 'En linea'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Indicador de carga RAG */}
          {loadingRAG && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center gap-2">
              <Loader2 size={12} className="text-emerald-600 animate-spin" />
              <p className="text-emerald-700 text-xs font-bold">Consultando tus datos en la plataforma...</p>
            </div>
          )}

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">

            {/* Estado vacío con sugerencias */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center pt-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full overflow-hidden border-2 border-white shadow-md mb-4">
                  <img src="/gemini.webp" alt="AI" className="w-full h-full object-cover" />
                </div>
                <p className="text-slate-600 font-medium text-center px-6 mb-2">
                  ¡Pregúntame sobre tus cursos, progreso, gemas o la comunidad!
                </p>
                <p className="text-slate-400 text-xs font-medium text-center px-6">
                  Ninguna de nuestras conversaciones se guarda o se usa para entrenar el modelo.
                </p>
                <p className="text-slate-300 text-xs font-medium text-center px-6 mb-6">
                  (La IA puede cometer errores)
                </p>

                {/* Sugerencias rápidas */}
                <div className="w-full space-y-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center mb-3">
                    Sugerencias
                  </p>
                  {sugerencias.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="w-full text-left p-3 bg-white border border-slate-100 rounded-2xl text-xs font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mensajes */}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] space-y-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {m.usedRAG && m.role === 'model' && (
                    <RAGBadge />
                  )}
                  <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    <div className="markdown-container">
                      <ReactMarkdown>{m.parts[0].text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && <TypingIndicator />}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-50 pb-10 lg:pb-4 shrink-0">
            {/* Indicador de que va a usar RAG */}
            {detectarRAG(input) && input.length > 2 && (
              <div className="flex items-center gap-1.5 mb-2">
                <Database size={10} className="text-emerald-500" />
                <p className="text-[10px] font-bold text-emerald-600">
                  Consultaré los datos de la plataforma para responder esa pregunta.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                disabled={loading || loadingRAG}
                rows={1}
                className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50 resize-none max-h-32"
                style={{ minHeight: '44px' }}
              />
              <button
                onClick={handleSend}
                disabled={loading || loadingRAG || !input.trim()}
                className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}