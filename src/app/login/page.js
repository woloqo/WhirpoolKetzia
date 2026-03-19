"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      // DEBUG: Mira tu consola del navegador para ver qué llega de la DB
      console.log("Respuesta del servidor:", data);

      if (res.ok) {
        // Limpiamos basura previa para evitar conflictos
        localStorage.clear();

        // Guardamos asegurándonos de que no sean undefined
        if (data.usuario_id) localStorage.setItem('usuario_id', data.usuario_id.toString());
        
        // Si tu API devuelve 'rol_id', lo guardamos. 
        // Si no llega, ponemos un valor por defecto (ej: 2 para empleado común)
        const rolParaGuardar = data.rol_id !== undefined ? data.rol_id : 2;
        localStorage.setItem('rol_id', rolParaGuardar.toString());

        router.push('/');
        router.refresh(); 
      } else {
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Hubo un problema al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-200">
            <LogIn size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Whirlpool</h1>
          <p className="text-slate-500 text-sm mt-1 font-bold uppercase tracking-widest">Learning Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-[0.2em] ml-1">
              Correo Institucional
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="nombre.apellido@whirlpool.com"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100 text-sm font-bold animate-in fade-in zoom-in duration-300">
              <AlertCircle size={18} className="shrink-0" /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? 'Validando...' : 'Acceder al Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}