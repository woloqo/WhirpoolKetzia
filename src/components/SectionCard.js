export const SectionCard = ({ 
  title, 
  count, 
  action, 
  children, 
  className = "", 
  variant = "light" // "light" o "dark"
}) => {
  
  // Mapeo de estilos según el tema elegido
  const themes = {
    light: {
      container: "bg-white border-slate-100 shadow-sm",
      header: "bg-white border-slate-50",
      title: "text-slate-800",
      badge: "bg-slate-100 text-slate-400"
    },
    dark: {
      container: "bg-slate-900 border-slate-800 shadow-xl",
      header: "bg-slate-900 border-slate-800/50",
      title: "text-white",
      badge: "bg-white/10 text-slate-400"
    }
  };

  const style = themes[variant] || themes.light;

  return (
    <div className={`rounded-[0.8rem] border overflow-hidden transition-all duration-300 ${style.container} ${className}`}>
      
      {/* Solo renderizamos el contenedor de la cabecera si existe un título.
        Esto elimina automáticamente el separador (border-b) si no hay título.
      */}
      {title && (
        <div className={`pl-6 pr-4 py-4 border-b flex justify-between items-center ${style.header}`}>
          <h2 className={`text-xl font-black flex items-center gap-2 ${style.title}`}>
            {title}
            {count !== undefined && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>
                {count}
              </span>
            )}
          </h2>
          {action}
        </div>
      )}

      <div className="">
        {children}
      </div>
    </div>
  );
};