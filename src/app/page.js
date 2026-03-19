"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CursoCard from '@/components/CursoCard';

export default function Page() {
  const [cursos, setCursos] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Función para determinar el saludo según la hora
  const obtenerSaludo = () => {
    const hora = new Date().getHours();
    if (hora >= 6 && hora < 12) return "Buenos días";
    if (hora >= 12 && hora < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  useEffect(() => {
    const usuarioId = localStorage.getItem('usuario_id');

    if (!usuarioId) {
      router.push('/login');
      return;
    }

    const cargarDatos = async () => {
      try {
        // 1. Cargamos el nombre del usuario (puedes usar la API que creamos para el Header)
        const resUser = await fetch(`/api/usuario?id=${usuarioId}`);
        if (resUser.ok) {
          const userData = await resUser.json();
          setNombreUsuario(userData.nombre.split(' ')[0]); // Solo el primer nombre
        }

        // 2. Cargamos los cursos
        const resCursos = await fetch(`/api/cursos?usuario_id=${usuarioId}`);
        if (resCursos.ok) {
          const cursosData = await resCursos.json();
          setCursos(cursosData);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [router]);

  if (loading) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Preparando tu panel de Whirlpool...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-start justify-start p-10 w-full">
      <header className="">        
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          {obtenerSaludo()} {nombreUsuario || 'empleado'}.
        </h1>
        
        <p className="text-slate-500 mt-3 text-lg font-medium">
          Echa un vistazo a tus cursos.
        </p>
      </header>

      {cursos.length === 0 ? (
        <div className="bg-white p-16 rounded-[2rem] border-2 border-dashed border-slate-200 text-center shadow-sm">
          <div className="text-slate-300 mb-4 flex justify-center">
            <svg size={48} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-slate-500 text-xl font-bold">Todo al día</p>
          <p className="text-slate-400">No tienes cursos pendientes por ahora.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cursos.map((curso) => (
            <CursoCard 
              key={curso.curso_id} 
              id={curso.curso_id} 
              completado={curso.esCompletado === 1}
              {...curso} 
            />
          ))}
        </div>
      )}
    </div>
  );
}