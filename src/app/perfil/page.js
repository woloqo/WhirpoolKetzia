"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Shield, Calendar, BookOpen, CheckCircle, Clock, Award } from 'lucide-react';
import Link from 'next/link';

export default function PerfilPage() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) { router.push('/login'); return; }

    fetch(`/api/perfil?id=${usuarioId}`)
      .then(res => res.json())
      .then(data => { setDatos(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!datos || !datos.usuario) return <div className="p-20 text-center">Usuario no encontrado</div>;

  const { usuario, stats } = datos;

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10">
      
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 mb-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        
        <div className="w-32 h-32 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100 shrink-0 rotate-3">
          <User size={60} className="-rotate-3" />
        </div>

        <div className="text-center md:text-left flex-grow z-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{usuario.nombre}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
            <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1.5 shadow-md shadow-blue-100">
              <Shield size={12} /> {usuario.nombre_rol}
            </span>
            <span className="text-slate-400 text-sm font-bold flex items-center gap-1.5">
              <Calendar size={16} /> Miembro desde {new Date(usuario.fecha_creacion).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Link href="/" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all text-sm shadow-xl shadow-slate-200 hover:shadow-blue-100">
          Panel de Control
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        <div className="w-full lg:w-[60%] space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="bg-orange-100 text-orange-600 p-4 rounded-2xl"><BookOpen size={28} /></div>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">{stats.total_inscritos}</p>
                <p className="text-slate-400 text-xs font-black uppercase mt-1">Cursos Asignados</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl"><CheckCircle size={28} /></div>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">{stats.total_completados}</p>
                <p className="text-slate-400 text-xs font-black uppercase mt-1">Finalizados</p>
              </div>
            </div>
          </div>

          {/* Sección de "Insignias o Logros" (Ejemplo visual) */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <Award className="absolute right-[-20px] bottom-[-20px] text-white/10" size={180} />
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                Nivel de Aprendizaje
            </h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs font-medium">Sigue completando cursos para subir de nivel y desbloquear nuevas insignias.</p>
            <div className="bg-white/10 h-2 rounded-full w-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[75%]" />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Datos de Cuenta (40%) */}
        <aside className="w-full lg:w-[40%]">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4 italic">
                Datos de la Cuenta
            </h2>
            
            <div className="space-y-8">
              <div className="group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Correo Electrónico</p>
                <p className="text-slate-900 font-bold flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                  <Mail size={16} className="text-blue-500" /> {usuario.email}
                </p>
              </div>

              <div className="group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">ID Corporativo</p>
                <p className="text-slate-900 font-mono font-black text-lg">
                  #WHL-{usuario.usuario_id.toString().padStart(4, '0')}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Estado</p>
                    <p className="text-emerald-600 font-black text-sm italic">Cuenta Verificada</p>
                </div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}