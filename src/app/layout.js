"use client";

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // 1. Centro de mando de rutas
  const configRutas = {
    isLogin: pathname === '/login',
    isVisor: pathname.includes('/visor/'),
    isComunidad: pathname === '/comunidad',
    isProfile: pathname === '/perfil'
  };

  // 2. Lógica de componentes
  const mostrarSidebar = !configRutas.isLogin; 
  const mostrarHeader = !configRutas.isLogin && !configRutas.isVisor;
  const colapsarSidebar = configRutas.isComunidad || configRutas.isVisor || configRutas.isProfile;
  
  // 3. Clases dinámicas para el Sidebar y el Contenedor
  const anchoSidebar = configRutas.isVisor || configRutas.isComunidad || configRutas.isProfile ? 'lg:ml-20' : 'lg:ml-32';
  const margenMain = mostrarSidebar ? `${anchoSidebar} pb-2 lg:pb-0` : '';

  return (
    <html lang="es">
      <body className="bg-slate-50 antialiased overflow-x-hidden"> 
        {mostrarSidebar && <Sidebar colapsado={colapsarSidebar} />}

        <div className={`min-h-screen flex flex-col transition-all duration-500 ease-in-out ${margenMain}`}>
          
          {mostrarHeader && <Header />}
          
          <main className={`flex-1 ${mostrarSidebar ? 'p-2' : ''}`}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}