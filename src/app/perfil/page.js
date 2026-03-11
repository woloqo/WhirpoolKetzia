import { pool } from '@/lib/db';
import { User, Mail, Shield, Calendar, BookOpen, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function PerfilPage() {
  const USUARIO_ID = 1; // ID temporal de prueba

  try {
    // 1. Obtener datos del usuario y su rol
    const [userRows] = await pool.query(`
      SELECT u.*, r.nombre as nombre_rol 
      FROM Usuarios u
      JOIN Roles r ON u.rol_id = r.rol_id
      WHERE u.usuario_id = ?`, [USUARIO_ID]);
    
    const usuario = userRows[0];

    // 2. Obtener estadísticas (Cursos inscritos y completados)
    const [statsRows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM Inscripciones WHERE usuario_id = ?) as total_inscritos,
        (SELECT COUNT(*) FROM Completaciones c 
         JOIN Inscripciones i ON c.inscripcion_id = i.inscripcion_id 
         WHERE i.usuario_id = ?) as total_completados
    `, [USUARIO_ID, USUARIO_ID]);

    const stats = statsRows[0];

    if (!usuario) return <div className="p-20 text-center text-xl">Usuario no encontrado</div>;

    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header de Perfil */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <User size={60} />
            </div>
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-3xl font-black text-slate-900">{usuario.nombre}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Shield size={12} /> {usuario.nombre_rol}
                </span>
                <span className="text-slate-500 text-sm flex items-center gap-1">
                  <Calendar size={14} /> Miembro desde {new Date(usuario.fecha_creacion).toLocaleDateString()}
                </span>
              </div>
            </div>
            <Link href="/" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm">
              Volver al Dashboard
            </Link>
          </div>

          {/* Grid de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-xl"><BookOpen size={24} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.total_inscritos}</p>
                <p className="text-slate-500 text-sm font-medium">Cursos Asignados</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><CheckCircle size={24} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.total_completados}</p>
                <p className="text-slate-500 text-sm font-medium">Cursos Terminados</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Clock size={24} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{stats.total_inscritos - stats.total_completados}</p>
                <p className="text-slate-500 text-sm font-medium">Pendientes</p>
              </div>
            </div>
          </div>

          {/* Información Detallada */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Información de la Cuenta</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <span className="text-slate-500 font-medium">Correo Electrónico</span>
                <span className="text-slate-900 font-bold flex items-center gap-2"><Mail size={16}/> {usuario.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <span className="text-slate-500 font-medium">ID de Empleado</span>
                <span className="text-slate-900 font-mono font-bold">#WHL-{usuario.usuario_id.toString().padStart(4, '0')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Estado de Cuenta</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1 italic">
                  Activa ●
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  } catch (error) {
    console.error(error);
    return <div className="p-20 text-center text-red-500">Error al conectar con la base de datos</div>;
  }
}