"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      localStorage.setItem("usuario_id", session.user.usuario_id?.toString());
      localStorage.setItem("rol_id", session.user.rol_id?.toString());
      localStorage.setItem("nombre_usuario", session.user.name);
      localStorage.setItem("usuario_pfp", session.user.pfp || "");
      router.push("/");
    }
  }, [status, session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    console.log("Resultado signIn:", result);

    if (result?.error) {
      // result.error puede ser "CredentialsSignin" en producción
      // en lugar del mensaje real
      setError("Credenciales inválidas");
      setLoading(false);
      return;
    }

    if (result?.ok) {
      router.push("/");
      router.refresh();
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    await signIn('google', { callbackUrl: '/', prompt: 'select_account', redirect: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
        
        <div className="text-center mb-10">
          <div className="w-64 flex items-center justify-center mx-auto">
            <img 
              src="/whirlpoolwidelogo.png" 
              alt="Whirlpool" 
              className={`w-full object-contain transition-all duration-300 h-32`} 
            />
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">AI Learning Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">
              Correo
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                placeholder="ejemplo@whirlpool.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 text-red-500 bg-red-50/50 p-4 rounded-2xl border border-red-100 text-xs font-bold animate-pulse">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Verificando...' : 'Entrar ahora'}
          </button>
        </form>

        

        <div className="py-5">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all mb-6 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuar con Google
          </button>
        </div>


        <div className="border-slate-50 text-center">
          <p className="text-slate-400 text-xs font-medium">¿Aún no tienes una cuenta?</p>
          <Link 
            href="/registro" 
            className="mt-3 inline-flex items-center gap-2 text-blue-600 font-black text-sm hover:text-blue-700 transition-colors group"
          >
            <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
            Regístrate aquí
          </Link>
        </div>

      </div>
    </div>
  );
}