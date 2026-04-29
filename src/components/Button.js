// components/Button.js
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export const Button = ({ 
  children, 
  href, 
  onClick, 
  variant = 'primary', 
  loading = false, 
  icon: Icon,
  className = "" 
}) => {
  // Ajustamos padding: px-4 en móvil, px-6 en desktop
  // Ajustamos texto: text-xs en móvil, text-sm en desktop
  const baseStyles = "p-2 md:px-6  md:py-3 rounded-[0.5rem] font-black flex items-center justify-center gap-2 transition-all active:scale-95 text-xs md:text-sm";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 shadow-lg md:shadow-xl",
    primaryGreen: "bg-green-600 text-white hover:bg-green-700 shadow-green-100 shadow-lg md:shadow-xl",
    dark: "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-100 shadow-lg md:shadow-xl",
    danger: "bg-white text-red-500 border border-red-100 hover:bg-red-50 shadow-red-50 shadow-lg md:shadow-xl",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border border-slate-100",
    pill: "bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-slate-100 px-3 md:px-4 py-1.5 md:py-2 text-[9px] md:text-[10px] uppercase tracking-widest shadow-none border-none"
  };

  const content = (
    <>
      {/* Icono más pequeño en móvil */}
      {loading ? (
        <Loader2 className="animate-spin w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
      ) : (
        Icon && <Icon className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
      )}
      <span className="truncate">{children}</span>
    </>
  );

  const combinedClasses = `${baseStyles} ${variants[variant]} ${className} disabled:opacity-50`;

  if (href) return <Link href={href} className={combinedClasses}>{content}</Link>;
  
  return (
    <button onClick={onClick} disabled={loading} className={combinedClasses}>
      {content}
    </button>
  );
};