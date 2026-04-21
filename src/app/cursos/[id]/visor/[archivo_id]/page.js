"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, ExternalLink, CheckCircle, Loader2} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function VisorMaterial(props) {
  const params = use(props.params);
  const curso_id = params.id;
  const archivo_id = params.archivo_id;

  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completado, setCompletado] = useState(false);
  
  const sensorRef = useRef(null);

  const marcarComoTerminado = useCallback(async () => {
    if (completado) return;
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) return;

    try {
      const res = await fetch('/api/progreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          curso_id: curso_id,
          archivo_id: archivo_id
        })
      });
      if (res.ok) setCompletado(true);
    } catch (error) {
      console.error("Error al guardar progreso:", error);
    }
  }, [archivo_id, curso_id, completado]);

  // 1. Cargar datos del archivo
  useEffect(() => {
    const cargarArchivo = async () => {
      try {
        const res = await fetch(`/api/archivos/${archivo_id}`);
        const data = await res.json();
        setArchivo(data);

        // LÓGICA YOUTUBE: Se marca como terminado apenas carga la info
        if (data.url_archivo.includes('youtube.com') || data.url_archivo.includes('youtu.be')) {
          marcarComoTerminado();
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarArchivo();
  }, [archivo_id, marcarComoTerminado]);

  // 2. LÓGICA PDF (Solo se marca al llegar al final del scroll)
  useEffect(() => {
    if (!archivo || archivo.url_archivo.includes('youtube') || completado) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        marcarComoTerminado();
      }
    }, { 
      root: null, 
      threshold: 0.9, // Requiere que casi todo el sensor sea visible
      rootMargin: "0px 0px 50px 0px" 
    });

    if (sensorRef.current) observer.observe(sensorRef.current);
    
    return () => observer.disconnect();
  }, [archivo, completado, marcarComoTerminado]);

  const obtenerEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
  };

  if (loading){ return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-slate-300" size={36} />
        <p className="text-slate-400 text-sm font-medium">Descargando material...</p>
      </div>
    </div>
  )}
  if (!archivo) return <div className="p-10 text-center">Material no encontrado</div>;

  const esYouTube = archivo.url_archivo.includes('youtube.com') || archivo.url_archivo.includes('youtu.be');
  const driveEmbedUrl = archivo.url_archivo.replace(/\/view.*/, '/preview');

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-4 bg-slate-800 flex justify-between items-center text-white z-40 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <Link href={`/cursos/${curso_id}`} className="hover:text-blue-400 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">{archivo.curso_titulo}</p>
            <h1 className="text-sm font-bold truncate max-w-[200px] md:max-w-md">{archivo.nombre_archivo}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {completado && (
            <span className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 animate-in fade-in zoom-in">
              <CheckCircle size={14} /> Completado
            </span>
          )}
          <a href={archivo.url_archivo} target="_blank" className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <ExternalLink size={14} /> Abrir Original
          </a>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 w-full bg-white relative overflow-y-auto custom-scrollbar">
        {esYouTube ? (
          <div className="absolute inset-0 w-full h-full bg-black">
            <iframe 
              className="w-full h-full border-0" 
              src={obtenerEmbedUrl(archivo.url_archivo)} 
              title="YouTube video player" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex flex-col w-full">
             <iframe 
              src={driveEmbedUrl} 
              className="w-full h-[95vh] border-none" 
              allow="autoplay"
              title={archivo.nombre_archivo}
            />
            {/* SENSOR DE FINAL (Invisible para el usuario) */}
            <div 
              ref={sensorRef} 
              className="h-1 w-full opacity-0 pointer-events-none bg-slate-900" 
            />
          </div>
        )}
      </div>
    </div>
  );
}