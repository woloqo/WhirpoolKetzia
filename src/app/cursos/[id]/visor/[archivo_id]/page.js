"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function VisorMaterial(props) {
  // 1. IMPORTANTE: Ahora recibimos AMBOS IDs porque están en la ruta
  const params = use(props.params);
  const curso_id = params.id;         // Viene de la carpeta [id]
  const archivo_id = params.archivo_id; // Viene de la carpeta [archivo_id]

  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarLogro, setMostrarLogro] = useState(false);

  useEffect(() => {
    const cargarArchivo = async () => {
      try {
        // Consultamos la API que ya tienes configurada
        const res = await fetch(`/api/archivos/${archivo_id}`);
        const data = await res.json();
        setArchivo(data);
        
        const usuarioId = localStorage.getItem('usuario_id');
        if (usuarioId && data) {
          const resProgreso = await fetch('/api/progreso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usuario_id: usuarioId,
              curso_id: curso_id, 
              archivo_id: archivo_id
            })
          });

          const resultado = await resProgreso.json();
          if (resultado.completado) {
            setMostrarLogro(true);
            setTimeout(() => setMostrarLogro(false), 5000);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarArchivo();
  }, [archivo_id, curso_id]);

  const obtenerEmbedUrl = (url) => {
    if (!url) return null;

    // 1. Extraer el ID usando una expresión regular
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    const videoId = (match && match[2].length === 11) ? match[2] : null;

    // 2. Retornar el formato embed de YouTube
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;
  };

  if (loading) return <div className="p-10 text-center bg-slate-900 text-white h-screen">Cargando material...</div>;
  if (!archivo) return <div className="p-10 text-center">Material no encontrado</div>;

  const esYouTube = archivo.url_archivo.includes('youtube.com') || archivo.url_archivo.includes('youtu.be');
  const embedUrl = archivo.url_archivo.replace(/\/view.*/, '/preview');

  if(esYouTube) return (
    <div className="h-screen w-full flex flex-col bg-slate-900 overflow-hidden border border-slate-200 shadow-xl">
      <div className="shrink-0 p-4 bg-slate-800 flex justify-between items-center text-white z-40">
        <div className="flex items-center gap-4">
          <Link href={`/cursos/${curso_id}`} className="hover:text-blue-400 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">
              {archivo.curso_titulo}
            </p>
            <h1 className="text-sm font-bold truncate max-w-[200px] md:max-w-md">
              {archivo.nombre_archivo}
            </h1>
          </div>
        </div>
        <a 
          href={archivo.url_archivo} 
          target="_blank" 
          className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
        >
          <ExternalLink size={14} className="inline mr-1" /> Abrir
        </a>
      </div>

      <div className="flex-1 w-full bg-white relative">
        <iframe className="absolute top-0 left-0 w-full h-full border-0" src={obtenerEmbedUrl(archivo.url_archivo)} title="YouTube video player" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowFullcreen></iframe>
      </div>

    </div>
  );
  else return (
    <div className="h-screen w-full flex flex-col bg-slate-900 overflow-hidden border border-slate-200 shadow-xl">
      <div className="shrink-0 p-4 bg-slate-800 flex justify-between items-center text-white z-40">
        <div className="flex items-center gap-4">
          <Link href={`/cursos/${curso_id}`} className="hover:text-blue-400 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">
              {archivo.curso_titulo}
            </p>
            <h1 className="text-sm font-bold truncate max-w-[200px] md:max-w-md">
              {archivo.nombre_archivo}
            </h1>
          </div>
        </div>
        <a 
          href={archivo.url_archivo} 
          target="_blank" 
          className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
        >
          <ExternalLink size={14} className="inline mr-1" /> Abrir
        </a>
      </div>

      {/* 3. Contenedor del Iframe
          'flex-1' hace que tome todo el espacio restante 
          'h-full' asegura que el iframe llene ese espacio */}
      <div className="flex-1 w-full bg-white relative">
        <iframe 
          src={embedUrl} 
          className="absolute inset-0 w-full h-full border-none"
          allow="autoplay"
          title={archivo.nombre_archivo}
        ></iframe>
      </div>
    </div>
  );
}