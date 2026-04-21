"use client";
import { useState, useEffect } from 'react';
import { Gem, Search, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

const COLORES = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600',
];

export default function GemaCard({ gema, index, currentUserId }) {
  const color = COLORES[index % COLORES.length];
  return (
    <Link
      href={String(gema.usuario_id) === String(currentUserId) ? '/perfil' : `/perfil/${gema.usuario_id}`}
      className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all group"
    >
      <div className={`bg-gradient-to-br ${color} p-6 flex items-center justify-between`}>
        <Gem size={28} className="text-white opacity-90" />
        <div className="w-8 h-8 bg-white/20 rounded-xl overflow-hidden flex items-center justify-center text-white font-black text-xs shrink-0">
          {gema.pfp ? <img src={gema.pfp} className="w-full h-full object-cover" alt="" /> : gema.nombre?.[0]}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-black text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">{gema.titulo}</h3>
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">{gema.descripcion}</p>
        {gema.categorias?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {gema.categorias.map(cat => (
              <span key={cat.categoria_id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase tracking-wide">
                {cat.nombre}
              </span>
            ))}
          </div>
        )}
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{gema.alias || gema.nombre}</p>
      </div>
    </Link>
  );
}