"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, User, LogOut } from 'lucide-react';

export default function Sidebar() {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Soluciona el error de hidratación: 
  // Solo renderiza la lógica completa una vez que el componente está en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isActive = (path) => pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('usuario_id');
    router.push('/login');
    router.refresh(); // Limpia el caché de la ruta
  };

  // Mientras se hidrata, devolvemos el contenedor base para evitar saltos visuales
  if (!isMounted) {
    return (
      <aside className="fixed bottom-0 left-0 w-full h-16 bg-white border-t border-slate-200 z-50 
                         lg:top-0 lg:left-0 lg:w-20 lg:h-screen lg:border-r lg:border-t-0" />
    );
  }

  return (
    <aside className="fixed bottom-0 left-0 w-full h-16 bg-white border-t border-slate-200 z-50 
                       lg:top-0 lg:left-0 lg:w-20 lg:h-screen lg:border-r lg:border-t-0 
                       flex lg:flex-col items-center justify-around lg:justify-start lg:py-8">

      <nav className="flex lg:flex-col gap-8 lg:gap-6 items-center justify-center lg:flex-grow">
        {/* Dashboard */}
        <Link 
          href="/" 
          className={`p-3 rounded-2xl transition-all duration-300 relative ${
            isActive('/') 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
            : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          <LayoutGrid size={24} />
          {isActive('/') && (
            <span className="hidden lg:block absolute -left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
          )}
        </Link>

        {/* Perfil */}
        <Link 
          href="/perfil" 
          className={`p-3 rounded-2xl transition-all duration-300 relative ${
            isActive('/perfil') 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
            : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          <User size={24} />
          {isActive('/perfil') && (
            <span className="hidden lg:block absolute -left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
          )}
        </Link>
      </nav>

      {/* Botón Salir */}
      <button 
        onClick={handleLogout}
        className="text-slate-300 hover:text-red-500 transition-colors p-3 lg:mt-auto"
      >
        <LogOut size={24} />
      </button>
    </aside>
  );
}