import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/* Móvil: flex-col (Sidebar abajo)
        Desktop: flex-row (Sidebar a la izquierda)
      */}
      <body className="flex flex-col lg:flex-row bg-[#F8F9FA] min-h-screen font-sans">
        
        {/* Sidebar: Se posiciona abajo en móvil y a la izquierda en desktop automáticamente */}
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header siempre arriba */}
          <Header />

          {/* IMPORTANTE: 
            pb-20 en móvil deja espacio para la barra de abajo.
            lg:pb-0 lo quita en desktop.
          */}
          <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-10 overflow-x-hidden">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}