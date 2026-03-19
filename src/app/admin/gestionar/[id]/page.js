"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, UserMinus, Search, Loader2, Users, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function GestionarCurso({ params }) {
  const resolvedParams = use(params);
  const cursoId = resolvedParams.id;
  const [disponibles, setDisponibles] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);

  const cargarDatos = async () => {
    const res = await fetch(`/api/admin/asignar?curso_id=${cursoId}`);
    const data = await res.json();
    setDisponibles(data.disponibles || []);
    setInscritos(data.inscritos || []);
    setLoading(false);
  };

  useEffect(() => { cargarDatos(); }, [cursoId]);

  const manejarInscripcion = async (usuarioId, metodo) => {
    setProcesando(usuarioId);
    try {
      const res = await fetch('/api/admin/asignar', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, curso_id: cursoId }),
      });
      if (res.ok) await cargarDatos();
    } catch (err) {
      alert("Error en la operación");
    } finally {
      setProcesando(null);
    }
  };

  const filtrar = (lista) => lista.filter(u => 
    u.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
    u.email.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10 font-sans">
      <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 font-bold transition-colors">
        <ArrowLeft size={18} /> Volver al Panel
      </Link>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Gestión de Alumnos</h1>
        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* COLUMNA 1: DISPONIBLES */}
        <div>
          <div className="flex items-center gap-2 mb-6 px-2">
            <UserPlus className="text-blue-600" size={20} />
            <h2 className="text-xl font-black text-slate-800">Disponibles</h2>
          </div>
          
          <div className="space-y-3">
            {filtrar(disponibles).map(u => (
              <div key={u.usuario_id} className={`p-5 rounded-2xl border flex items-center justify-between ${u.rol_id === 1 ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-slate-100'}`}>
                <div>
                  <p className="font-bold text-slate-800">{u.nombre} {u.rol_id === 1 && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full ml-2">TÚ (ADMIN)</span>}</p>
                  <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                </div>
                <button 
                  onClick={() => manejarInscripcion(u.usuario_id, 'POST')}
                  disabled={procesando === u.usuario_id}
                  className="p-3 bg-white text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  {procesando === u.usuario_id ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: YA INSCRITOS */}
        <div>
          <div className="flex items-center gap-2 mb-6 px-2">
            <GraduationCap className="text-green-600" size={20} />
            <h2 className="text-xl font-black text-slate-800">Inscritos ({inscritos.length})</h2>
          </div>

          <div className="space-y-3">
            {filtrar(inscritos).map(u => (
              <div key={u.usuario_id} className="p-5 rounded-2xl bg-slate-800 text-white flex items-center justify-between shadow-xl shadow-slate-200">
                <div>
                  <p className="font-bold">{u.nombre}</p>
                  <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                </div>
                <button 
                  onClick={() => manejarInscripcion(u.usuario_id, 'DELETE')}
                  disabled={procesando === u.usuario_id}
                  className="p-3 bg-slate-700 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  {procesando === u.usuario_id ? <Loader2 size={18} className="animate-spin" /> : <UserMinus size={18} />}
                </button>
              </div>
            ))}
            {inscritos.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold">
                Nadie inscrito aún.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}