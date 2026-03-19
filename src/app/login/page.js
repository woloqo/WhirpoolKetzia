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

      if (res.ok) {
        // Guardamos el ID en el navegador del empleado
        localStorage.setItem('usuario_id', data.usuario_id);
        localStorage.setItem('rol_id', data.rol_id);
        // Redirigimos al Dashboard
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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            <LogIn size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Whirlpool Learning</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Portal de Capacitación Interna</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
              Correo Institucional
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="ejemplo@whirlpool.com"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Acceder al Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}