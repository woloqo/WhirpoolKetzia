"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CursoCard from '@/components/CursoCard';
import { ChevronDown, ChevronUp, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';

export default function Page() {
  const [cursos, setCursos] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarFinalizados, setMostrarFinalizados] = useState(false); // Estado para colapsar
  const router = useRouter();

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
        const resUser = await fetch(`/api/usuario?id=${usuarioId}`);
        if (resUser.ok) {
          const userData = await resUser.json();
          setNombreUsuario(userData.nombre.split(' ')[0]);
        }

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

  // Filtrado de cursos
  const cursosActuales = cursos.filter(c => c.porcentaje < 100);
  const cursosFinalizados = cursos.filter(c => c.porcentaje === 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-slate-300" size={36} />
          <p className="text-slate-400 text-sm font-medium">Cargando tus cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-start justify-start p-6 md:p-8 pb-32 lg:pb-10 w-full max-w-[1600px]">
      <header className="mb-8 md:mb-12 text-left w-full">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight whitespace-nowrap">
          Tablero
        </h1>
        <p className="text-slate-500 mt-1 md:mt-2 text-lg md:text-xl font-medium">
          {obtenerSaludo()} {nombreUsuario || 'empleado'}, echa un vistazo a tus cursos pendientes.
        </p>
      </header>

      {cursos.length === 0 ? (
        <div className="w-full text-center p-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-400 font-bold">
          No hay cursos disponibles actualmente
        </div>
      ) : (
        <div className="w-full space-y-12 flex flex-col items-center">
          
          {/* SECCIÓN: CURSOS ACTUALES */}
          <section className="w-full flex flex-col items-center">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="text-blue-600" size={24} />
              <h2 className="text-xl md:text-2xl font-black text-slate-800">En progreso</h2>
              <span className="bg-blue-100 text-blue-600 px-3 py-0.5 rounded-full text-xs font-bold">
                {cursosActuales.length}
              </span>
            </div>

            {cursosActuales.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full justify-items-center"> {cursosActuales.map((curso) => (
                  <CursoCard 
                    key={curso.curso_id} 
                    id={curso.curso_id} 
                    completado={false} 
                    {...curso} 
                  />
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic font-medium ml-1">No tienes cursos pendientes. ¡Buen trabajo!</p>
            )}
          </section>

          {/* SECCIÓN: CURSOS FINALIZADOS (COLAPSABLE) */}
          {cursosFinalizados.length > 0 && (
            <section className="w-full">
              <button 
                onClick={() => setMostrarFinalizados(!mostrarFinalizados)}
                className="flex items-center justify-between w-full p-4 md:p-6 bg-slate-50 hover:bg-slate-100 rounded-[1.5rem] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                  <h2 className="text-lg md:text-xl font-black text-slate-700">Cursos finalizados</h2>
                  <span className="bg-slate-200 text-slate-500 px-3 py-0.5 rounded-full text-xs font-bold group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                    {cursosFinalizados.length}
                  </span>
                </div>
                {mostrarFinalizados ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
              </button>

              {mostrarFinalizados && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {cursosFinalizados.map((curso) => (
                    <CursoCard 
                      key={curso.curso_id} 
                      id={curso.curso_id} 
                      completado={true} 
                      {...curso} 
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}