"use client"; // <--- Necesario para usar useEffect y localStorage

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CursoCard from '@/components/CursoCard';

export default function Page() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Intentamos obtener el ID del usuario
    const usuarioId = localStorage.getItem('usuario_id');

    // 2. Si no existe, lo mandamos al login
    if (!usuarioId) {
      router.push('/login');
      return;
    }

    // 3. Pedimos los cursos asignados a ese ID a través de una API
    const fetchCursos = async () => {
      try {
        const res = await fetch(`/api/cursos?usuario_id=${usuarioId}`);
        if (res.ok) {
          const data = await res.json();
          setCursos(data);
        }
      } catch (error) {
        console.error("Error al cargar cursos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, [router]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium">Cargando tus cursos de Whirlpool...</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          Mis Cursos Asignados
        </h1>
        <p className="text-slate-500 mt-2 font-medium italic">
          Cursos personalizados según tu perfil de empleado.
        </p>
      </header>

      {cursos.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
          <p className="text-slate-400 text-lg">No tienes cursos asignados actualmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cursos.map((curso) => (
            <CursoCard 
              key={curso.curso_id} 
              id={curso.curso_id} 
              {...curso} 
            />
          ))}
        </div>
      )}
    </div>
  );
}