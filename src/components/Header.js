import { Diamond } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-8 sticky top-0 z-40 w-full">
      <div className="flex items-center gap-2 p-1">
        {/* Agregamos h-8 para que ocupe la mitad del header o h-10 para que sea un poco más grande */}
        <img 
          src="https://www.whirlpoolcorp.com/content/dam/business-unit/whirlpoolcorp/wp-content/upload/logos/2021_Whirlpool_Corp_2C_Black_RGB.png" 
          alt="Whirlpool Logo"
          className="h-8 w-auto object-contain" 
        />
      </div>
    </header>
  );
}