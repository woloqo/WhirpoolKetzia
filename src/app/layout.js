"use client"; // Necesario para detectar la ruta actual

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // Definimos si estamos en la página de login para ocultar elementos
  const isLoginPage = pathname === '/login';

  return (
    <html lang="es">
      <body className="bg-slate-50 antialiased"> 
        {/* 1. Solo mostramos el Sidebar si NO es login */}
        {!isLoginPage && <Sidebar />}

        <div 
          className={`min-h-screen flex flex-col transition-all duration-300 ${
            !isLoginPage ? 'lg:ml-20 pb-16 lg:pb-0' : ''
          }`}
        >
          {/* 2. Solo mostramos el Header si NO es login */}
          {!isLoginPage && <Header />}
          
          {/* 3. El contenido principal (Main) */}
          <main className={`flex-1 ${!isLoginPage ? 'p-6 lg:p-10' : ''}`}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}