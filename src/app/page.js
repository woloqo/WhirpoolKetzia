import CursoCard from '@/components/CursoCard';

export default function CursosGrid() {
  const misCursos = [
    { id: 0, modulo: "Módulo 0", titulo: "Bienvenidos a la Era de la IA", completado: true },
    { id: 1, modulo: "Módulo 1", titulo: "Fundamentos de IA y Gemini", completado: true },
    { id: 2, modulo: "Módulo 2", titulo: "Ingeniería de Prompts", completado: false },
    { id: 3, modulo: "Módulo 3", titulo: "Automatización Avanzada", completado: false },
  ];

  return (
    <section className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">Mis Cursos</h2>
      
      {/* Este es el GRID normal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {misCursos.map((curso) => (
          <CursoCard 
            key={curso.id}
            titulo={curso.titulo}
            modulo={curso.modulo}
            completado={curso.completado}
          />
        ))}
      </div>
    </section>
  );
}