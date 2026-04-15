"use client";
import { useState, useEffect } from 'react';
import { Send, Gem, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Text } from '@/components/Typography';

export default function PostForm({ 
  fields = [], 
  apiUrl, 
  onSuccess, 
  buttonText = "Enviar", 
  extraData = {},
  loadingExternal = false 
}) {
  const initialFormState = fields.reduce((acc, field) => {
    acc[field.name] = '';
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormState);
  const [enviando, setEnviando] = useState(false);
  
  const [misGemas, setMisGemas] = useState([]);
  const [gemaSeleccionada, setGemaSeleccionada] = useState(null);
  const [cargandoGemas, setCargandoGemas] = useState(false);
  const [showGemaPicker, setShowGemaPicker] = useState(false);

  const esComunidad = apiUrl?.includes('comunidad');

  useEffect(() => {
    if (esComunidad && extraData?.usuario_id) {
      setCargandoGemas(true);
      fetch(`/api/gemas?usuario_id=${extraData.usuario_id}`)
        .then(res => res.json())
        .then(data => setMisGemas(Array.isArray(data) ? data : []))
        .catch(err => console.error("Error cargando gemas:", err))
        .finally(() => setCargandoGemas(false));
    }
  }, [extraData?.usuario_id, esComunidad]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missingFields = fields.filter(f => f.required && !formData[f.name]?.trim());
    if (missingFields.length > 0) return alert(`Por favor rellena los campos obligatorios`);

    setEnviando(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          ...extraData, 
          gema_id: gemaSeleccionada?.gema_id || null 
        }),
      });

      if (res.ok) {
        setFormData(initialFormState);
        setGemaSeleccionada(null); 
        setShowGemaPicker(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  const isLoading = enviando || loadingExternal;

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-5">
      {fields.map((field) => (
        <div key={field.name}>
          <Text variant="muted" className="ml-1 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Text>
          {field.type === 'textarea' ? (
            <textarea
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              disabled={isLoading}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none text-sm font-medium transition-all"
            />
          ) : (
            <input
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              disabled={isLoading}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          )}
        </div>
      ))}

      {/* SELECTOR DE GEMAS */}
      {esComunidad && (
        <div className="space-y-3">
          {!gemaSeleccionada ? (
            <div className="flex items-center justify-between">
  <button
    type="button"
    onClick={() => setShowGemaPicker(!showGemaPicker)}
    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-blue-600 hover:text-blue-700 transition-colors py-1"
  >
    <Gem size={14} /> {showGemaPicker ? "Cerrar selección" : "Adjuntar una gema"}
  </button>
  
  <a
    href="/perfil"
    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-slate-400 hover:text-blue-600 transition-colors py-1"
  >
    <Gem size={12} /> Nueva gema
  </a>
</div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm border border-blue-50">
                  <Gem size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase leading-none mb-1">Gema adjunta</p>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{gemaSeleccionada.titulo}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setGemaSeleccionada(null)}
                className="p-1.5 hover:bg-blue-100 rounded-full text-blue-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {showGemaPicker && !gemaSeleccionada && (
            <div className="grid grid-cols-1 gap-1 max-h-44 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
              {cargandoGemas ? (
                <div className="py-4 flex justify-center">
                  <Loader2 className="animate-spin text-slate-300" size={20} />
                </div>
              ) : misGemas.length > 0 ? (
                misGemas.map(g => (
                  <button
                    key={g.gema_id}
                    type="button"
                    onClick={() => { setGemaSeleccionada(g); setShowGemaPicker(false); }}
                    className="flex items-center justify-between p-3 hover:bg-white hover:shadow-sm rounded-lg text-left transition-all group"
                  >
                    <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{g.titulo}</span>
                    <CheckCircle2 size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase italic tracking-widest">
                    No tienes gemas disponibles
                  </p>
                  
                  <a
                    href="/perfil"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Gem size={12} /> Crear mi primera gema
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Button 
        className="w-full py-4 shadow-lg shadow-blue-200/40" 
        icon={Send} 
        loading={isLoading}
      >
        {buttonText}
      </Button>
    </form>
  );
}