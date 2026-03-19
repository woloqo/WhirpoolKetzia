export function ProgressBar({ porcentaje }) {
  // 1. Definimos la condición de éxito
  const estaCompletado = porcentaje >= 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${
          estaCompletado ? 'text-emerald-600' : 'text-slate-500'
        }`}>
          {estaCompletado ? '¡Curso Completado! ✓' : 'Tu progreso'}
        </span>
        
        {/* El número también cambia de color */}
        <span className={`text-sm font-black transition-colors duration-500 ${
          estaCompletado ? 'text-emerald-600' : 'text-blue-600'
        }`}>
          {porcentaje}%
        </span>
      </div>
      
      {/* Contenedor de la barra */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        {/* Parte llena de la barra con colores dinámicos */}
        <div 
          className={`h-full transition-all duration-1000 ease-out rounded-full ${
            estaCompletado 
              ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' // Verde si es 100
              : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'    // Azul si es < 100
          }`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}