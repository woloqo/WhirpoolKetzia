"use client";

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ChatBot from '@/components/ChatBot';
import Providers from './providers';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();

  const configRutas = {
    isLogin: pathname === '/login',
    isRegistro: pathname === '/registro',
    isVisor: pathname.includes('/visor/'),
    isQuiz: pathname.includes('/quiz/'),
    isComunidad: pathname === '/comunidad',
    isProfile: pathname.includes('/perfil', '/perfil/'),
    isAdmin: pathname.includes('/admin', '/admin/'),
    isGemas: pathname === '/gemas'
  };

  const nombresRutas = {
    '/': 'Whirlpool Learning',
    '/login': 'Iniciar Sesión',
    '/registro': 'Registro',
    '/comunidad': 'Comunidad',
    '/perfil': 'Mi Perfil',
    '/admin': 'Admin',
    '/gemas': 'Gemas',
  };

  const tituloActual = nombresRutas[pathname] || 'Whirlpool Learning';

  const mostrarSidebar = !configRutas.isLogin && !configRutas.isRegistro; 
  const mostrarChatbot = !configRutas.isLogin && !configRutas.isRegistro; 
  const mostrarHeader = !configRutas.isLogin && !configRutas.isVisor && !configRutas.isRegistro && !configRutas.isQuiz;
  const colapsarSidebar = configRutas.isComunidad || configRutas.isVisor || configRutas.isProfile || configRutas.isAdmin || configRutas.isQuiz || configRutas.isGemas;
  
  const anchoSidebar = colapsarSidebar ? 'lg:pl-20' : 'lg:pl-32'; 

  return (
    <html lang="es">
      <head>
        <title>{tituloActual}</title>
        <meta name="description" content="Sistema de capacitación interna" />
      </head>
      <body className="bg-slate-50 antialiased overflow-x-hidden"> 
        <Providers>
          {mostrarSidebar && <Sidebar colapsado={colapsarSidebar} />}

          <div className={`min-h-screen flex flex-col transition-all duration-500 ease-in-out ${mostrarSidebar ? (colapsarSidebar ? 'lg:pl-20' : 'lg:pl-32') : ''}`}>
            
            {mostrarHeader && <Header />}
            
            <main className="flex-1">
              {children}
            </main>

            {mostrarChatbot && <ChatBot/>}
          </div>
        </Providers>
      </body>
    </html>
  );
}
