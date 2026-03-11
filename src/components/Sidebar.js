import { LayoutGrid, BookOpen, Diamond, BarChart3, UserCircle } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-slate-100 flex flex-row items-center px-6 justify-between 
                      lg:sticky lg:top-0 lg:w-20 lg:h-screen lg:flex-col lg:py-8 lg:border-r lg:border-t-0">
      
      {/* Logo: Lo mantenemos oculto en móvil para no saturar el Topbar */}
      <div className="hidden lg:flex text-amber-500 mb-10">
      </div>

      {/* Navegación */}
      <nav className="flex flex-row lg:flex-col gap-2 lg:gap-8 flex-1 lg:flex-none justify-around lg:justify-start">
        <button className="p-3 bg-amber-50 text-amber-500 rounded-xl">
          <LayoutGrid size={24} />
        </button>
        <button className="p-3 text-slate-300 hover:text-slate-500 transition-colors">
          <BookOpen size={24} />
        </button>
        <button className="p-3 text-slate-300 hover:text-slate-500 transition-colors">
          <BarChart3 size={24} />
        </button>
        
        {/* Perfil en móvil: Aparece como el último icono de la fila */}
        <div className="lg:hidden flex items-center p-3 text-slate-300">
          <UserCircle size={28} strokeWidth={1.5} />
        </div>
      </nav>

      {/* Perfil en Desktop: Aparece abajo del todo */}
      <div className="hidden lg:block text-slate-300 hover:text-slate-500 cursor-pointer">
        <UserCircle size={32} strokeWidth={1.5} />
      </div>
      
    </aside>
  );
}