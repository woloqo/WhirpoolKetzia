"use client";
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catalogo, setCatalogo] = useState(null); 
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Recuperamos el nombre del usuario del localStorage
    const nombreUsuario = localStorage.getItem('nombre_usuario') || "empleado";
    let contextoCursos = catalogo; 

    if (messages.length === 0 && !catalogo) {
      try {
        const usuarioId = localStorage.getItem('usuario_id');
        const resCursos = await fetch(`/api/cursos?usuario_id=${usuarioId}`);
        if (resCursos.ok) {
          const cursosData = await resCursos.json();
          if (cursosData && cursosData.length > 0) {
            contextoCursos = cursosData.map(c => `- ${c.titulo}: ${c.descripcion || c.descripcionCurso}`).join("\n");
            setCatalogo(contextoCursos); 
          } else {
            contextoCursos = "El usuario no tiene cursos inscritos actualmente.";
          }
        }
      } catch (e) {
        console.error("Error al obtener catálogo:", e);
      }
    }
    
    const userMsg = { role: "user", parts: [{ text: input }] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: input, 
          historial: messages,
          contextoCursos: contextoCursos,
          nombreUsuario: nombreUsuario // Enviamos el nombre al backend
        })
      });

      if (!res.ok) throw new Error("Error en la respuesta");
      const data = await res.json();
      const botText = data.text_content || "No pude generar una respuesta.";
      setMessages(prev => [...prev, { role: "model", parts: [{ text: botText }] }]);
    } catch (e) {
      console.error("Chat Error:", e);
      setMessages(prev => [...prev, { role: "model", parts: [{ text: "Error de conexión." }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed z-50 transition-all duration-500 ${
      isOpen 
        ? "inset-0 lg:left-auto lg:right-0 lg:top-0 lg:h-screen lg:w-96" 
        : "bottom-24 right-6 lg:bottom-10 lg:right-10"
    }`}>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-white hover:bg-slate-50 p-0 w-12 h-12 rounded-full shadow-2xl transition-all active:scale-90 flex items-center justify-center animate-in fade-in zoom-in border border-slate-100 overflow-hidden"
        >
          <img src="/gemini.webp" alt="Gemini" className="w-full h-full object-cover" />
        </button>
      )}

      {isOpen && (
        <div className={`bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300 h-full w-full lg:border-l lg:border-slate-100 lg:animate-in lg:slide-in-from-right-full`}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl"><Bot size={20} /></div>
              <div>
                <p className="font-black text-sm leading-none">Whirlpool AI</p>
                <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold mt-1">Asistente de Soporte</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="text-center mt-10">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-2 border-white shadow-md">
                    <img src="gemini.webp" alt="Gemini" className="w-full h-full object-cover" />
                </div>
                <p className="text-slate-400 text-xs italic font-medium px-10">¡Hola! Soy tu asistente de Whirlpool. Pregúntame sobre tus cursos o progreso.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                  m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  <div className="markdown-container">
                    <ReactMarkdown>{m.parts[0].text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm text-slate-400 text-[10px] animate-pulse">
                  Escribiendo...
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-slate-50 flex gap-2 pb-10 lg:pb-8">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu duda..."
              disabled={loading}
              className="flex-1 bg-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
            />
            <button onClick={handleSend} disabled={loading} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}