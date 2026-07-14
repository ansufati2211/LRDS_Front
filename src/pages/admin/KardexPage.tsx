import { useEffect, useState, useCallback, useRef } from 'react';
import { PackagePlus, TrendingDown, Settings2, Box, ChevronDown } from 'lucide-react';
import { getInsumos, registrarEntrada, registrarMerma, registrarAjuste } from '@/api/inventario';
import type { Insumo } from '@/api/inventario';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/layouts/AdminLayout';
import { sileo } from 'sileo';

export default function KardexPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [insumoId, setInsumoId] = useState('');
  const [tipoMov, setTipoMov] = useState<'ENTRADA' | 'MERMA' | 'AJUSTE'>('ENTRADA');
  
  // Formulario
  const [cantidad, setCantidad] = useState('');
  const [costo, setCosto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState<'POSITIVO' | 'NEGATIVO'>('POSITIVO');
  
  const [loading, setLoading] = useState(false);
  const { sedeSeleccionadaId } = useAuthStore();

  // Estados y Refs para el Selector Custom
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cargarInsumos = useCallback(async () => {
    try {
      const data = await getInsumos(sedeSeleccionadaId || undefined);
      // Filtramos solo los activos
      setInsumos(data.filter(i => i.estadoRegistro));
    } catch (e) {
      sileo.error({ title: 'Error al cargar los insumos del almacén' });
    }
  }, [sedeSeleccionadaId]);

  useEffect(() => { cargarInsumos(); }, [cargarInsumos]);

  // Cerrar el dropdown al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const insumoSel = insumos.find(i => i.id.toString() === insumoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoId || !cantidad) return sileo.error({ title: 'Complete los campos requeridos' });
    
    setLoading(true);
    try {
      if (tipoMov === 'ENTRADA') {
        await registrarEntrada({ 
          insumoId: parseInt(insumoId), 
          cantidad: parseFloat(cantidad), 
          costoUnitario: parseFloat(costo) || 0, 
          observacion: motivo,
          sedeId: sedeSeleccionadaId || undefined 
        });
      } else if (tipoMov === 'MERMA') {
        await registrarMerma({ 
          insumoId: parseInt(insumoId), 
          cantidad: parseFloat(cantidad), 
          motivo,
          sedeId: sedeSeleccionadaId || undefined 
        });
      } else {
        await registrarAjuste({ 
          insumoId: parseInt(insumoId), 
          cantidad: parseFloat(cantidad), 
          esPositivo: tipoAjuste === 'POSITIVO', 
          motivo,
          sedeId: sedeSeleccionadaId || undefined 
        });
      }
      sileo.success({ title: 'Movimiento registrado exitosamente' });
      setCantidad(''); setCosto(''); setMotivo('');
      setInsumoId('');
      cargarInsumos(); // Actualiza el stock visualmente
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error al registrar el movimiento' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        {/* CABECERA CON TÍTULO DEGRADADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Kardex y <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Movimientos</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Registra compras, mermas o ajustes manuales al inventario.</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-8 md:p-10">
          
          {/* SELECTOR DE TIPO DE MOVIMIENTO */}
          <div className="flex bg-slate-100/80 p-2 rounded-2xl mb-10 border border-slate-200 shadow-inner">
            <button 
              onClick={() => setTipoMov('ENTRADA')} 
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all duration-300 ${tipoMov === 'ENTRADA' ? 'bg-white shadow-md text-emerald-600 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
            >
              <PackagePlus size={18}/> Entrada (Compra)
            </button>
            <button 
              onClick={() => setTipoMov('MERMA')} 
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all duration-300 ${tipoMov === 'MERMA' ? 'bg-white shadow-md text-red-600 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
            >
              <TrendingDown size={18}/> Merma (Pérdida)
            </button>
            <button 
              onClick={() => setTipoMov('AJUSTE')} 
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all duration-300 ${tipoMov === 'AJUSTE' ? 'bg-white shadow-md text-blue-600 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
            >
              <Settings2 size={18}/> Ajuste Manual
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* SELECTOR CUSTOM ESTILO "MIS LOCALES OPERATIVOS" */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Seleccionar Insumo
                </label>
                <div className="relative" ref={dropdownRef}>
                  
                  {/* Botón Principal del Selector */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 border ${isDropdownOpen ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-gray-200'} rounded-xl transition-all focus:outline-none`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Box size={18} className="text-gray-400 flex-shrink-0" />
                      <span className={`text-sm font-semibold truncate ${insumoSel ? 'text-gray-900' : 'text-gray-500'}`}>
                        {insumoSel ? `${insumoSel.nombre} (Stock: ${Number(insumoSel.stockActual || 0).toFixed(2)} ${insumoSel.unidadMedida})` : 'Selecciona un insumo...'}
                      </span>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Lista Desplegable Flotante */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Insumos Disponibles</p>
                      </div>
                      <div className="p-2 max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                        {insumos.map(i => (
                          <button
                            key={i.id}
                            type="button"
                            onClick={() => {
                              setInsumoId(i.id.toString());
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                              insumoId === i.id.toString()
                                ? 'bg-gray-900 text-white font-bold shadow-md'
                                : 'text-gray-600 font-semibold hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <span className="truncate pr-4">
                              {i.nombre} <span className={insumoId === i.id.toString() ? 'text-gray-400 font-medium' : 'text-gray-400 font-medium'}>
                                - Stock: {Number(i.stockActual || 0).toFixed(2)} {i.unidadMedida}
                              </span>
                            </span>
                            {/* Punto Verde Estilo Imagen */}
                            {insumoId === i.id.toString() && (
                              <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
                            )}
                          </button>
                        ))}
                        {insumos.length === 0 && (
                          <div className="px-3 py-6 text-center text-sm font-medium text-gray-400">
                            No hay insumos activos disponibles.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Cantidad a {tipoMov === 'ENTRADA' ? 'Ingresar' : tipoMov === 'MERMA' ? 'Descontar' : 'Ajustar'}
                </label>
                <div className="relative">
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    value={cantidad} 
                    onChange={e => setCantidad(e.target.value)} 
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all font-semibold text-gray-900 outline-none text-sm" 
                    placeholder="0.00" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs tracking-widest uppercase">
                    {insumoSel?.unidadMedida || '-'}
                  </span>
                </div>
              </div>

            </div>

            {tipoMov === 'AJUSTE' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo de Ajuste</label>
                <select 
                  value={tipoAjuste} 
                  onChange={e => setTipoAjuste(e.target.value as 'POSITIVO'|'NEGATIVO')} 
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all font-semibold text-gray-700 outline-none appearance-none text-sm cursor-pointer"
                >
                  <option value="POSITIVO">AJUSTE POSITIVO (Sumar al stock)</option>
                  <option value="NEGATIVO">AJUSTE NEGATIVO (Restar al stock)</option>
                </select>
              </div>
            )}

            {tipoMov === 'ENTRADA' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Costo Unitario (S/)</label>
                <input 
                  required 
                  type="number" 
                  step="0.001" 
                  min="0" 
                  value={costo} 
                  onChange={e => setCosto(e.target.value)} 
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all font-semibold text-gray-900 outline-none text-sm" 
                  placeholder="0.00" 
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                {tipoMov === 'ENTRADA' ? 'Proveedor / Comentario (Opcional)' : 'Motivo / Justificación'}
              </label>
              <input 
                required={tipoMov !== 'ENTRADA'} 
                type="text" 
                value={motivo} 
                onChange={e => setMotivo(e.target.value)} 
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all font-semibold text-gray-900 outline-none text-sm" 
                placeholder={tipoMov === 'ENTRADA' ? 'Ej. Factura F001-456' : 'Ej. Vencimiento, derrame...'} 
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className={`w-full font-bold py-4 rounded-xl text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                  tipoMov === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                  tipoMov === 'MERMA' ? 'bg-red-600 hover:bg-red-700' : 
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Procesando...' : `Confirmar ${tipoMov}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}