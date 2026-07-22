import { useEffect, useState, useRef } from 'react';
import { ChefHat, Save, Plus, Trash2, Box, CheckCircle, AlertTriangle, X, Search, ChevronDown } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { getProductosAdmin } from '@/api/catalogo';
import { getInsumos, getRecetaProducto, guardarReceta } from '@/api/inventario';
import type { Producto } from '@/types';
import type { Insumo } from '@/api/inventario';
import { useAuthStore } from '@/store/authStore';

interface RecetaLocal { 
  insumoId: number; 
  cantidadUsada: number; 
  insumoNombre?: string; 
  unidad?: string; 
  costo?: number; 
}

export default function RecetasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [productoSel, setProductoSel] = useState<Producto | null>(null);
  const [receta, setReceta] = useState<RecetaLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({ visible: false, type: 'success', message: '' });

  // 🔥 NUEVOS ESTADOS PARA EL SELECTOR PERSONALIZADO DE INSUMOS
  const [isInsumoDropdownOpen, setIsInsumoDropdownOpen] = useState(false);
  const [busquedaInsumo, setBusquedaInsumo] = useState('');
  const [insumoSeleccionadoId, setInsumoSeleccionadoId] = useState<string>('');
  const insumoDropdownRef = useRef<HTMLDivElement>(null);

  const { sedeSeleccionadaId } = useAuthStore();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
  };

  // Cargar productos e insumos
  useEffect(() => {
    Promise.all([getProductosAdmin(), getInsumos(sedeSeleccionadaId || undefined)]).then(([p, i]) => {
      setProductos(p.filter(x => x.estadoRegistro));
      setInsumos(i.filter(x => x.estadoRegistro));
    });
  }, [sedeSeleccionadaId]);

  // Cerrar el selector personalizado si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (insumoDropdownRef.current && !insumoDropdownRef.current.contains(event.target as Node)) {
        setIsInsumoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const seleccionarProducto = async (prod: Producto) => {
    setProductoSel(prod);
    setLoading(true);
    // Limpiamos el buscador temporal
    setInsumoSeleccionadoId('');
    setBusquedaInsumo('');
    
    try {
      const data = await getRecetaProducto(prod.id);
      
      const mapeada = data.map((d: any) => {
        const idInsumoReal = d.insumo?.id || d.insumoId;
        const cantidadReal = d.cantidadRequerida || d.cantidadUsada || 0;

        const ins = insumos.find(i => i.id === idInsumoReal);
        
        const costoReal = Number((ins as any)?.costo) || Number(ins?.costoUnitario) || 0;
        
        return { 
           insumoId: idInsumoReal, 
           cantidadUsada: cantidadReal, 
           insumoNombre: ins?.nombre || d.insumo?.nombre || 'Desconocido', 
           unidad: ins?.unidadMedida || d.unidadMedida || '-', 
           costo: costoReal 
         };
      });
      
      setReceta(mapeada);
    } catch (e: any) {
      const errorReal = e.response?.data?.causa || e.response?.data?.error || e.response?.data?.message || 'Error al cargar receta';
      showToast(`Fallo Servidor: ${errorReal}`, 'error');
      setReceta([]);
    } finally { 
      setLoading(false); 
    }
  };

  const agregarInsumo = (insumoId: number) => {
    if (!insumoId) return;
    if (receta.find(r => r.insumoId === insumoId)) return showToast('Este insumo ya está en la receta', 'error');
    
    const ins = insumos.find(i => i.id === insumoId);
    if(!ins) return;

    const costoReal = Number((ins as any)?.costo) || Number(ins?.costoUnitario) || 0;
    
    setReceta([...receta, { 
      insumoId, 
      cantidadUsada: 0, 
      insumoNombre: ins?.nombre, 
      unidad: ins?.unidadMedida, 
      costo: costoReal 
    }]);
  };

  const quitarInsumo = (insumoId: number) => setReceta(receta.filter(r => r.insumoId !== insumoId));
  
  const actualizarCantidad = (insumoId: number, val: number) => {
    setReceta(receta.map(r => r.insumoId === insumoId ? { ...r, cantidadUsada: val } : r));
  };

  const handleGuardar = async () => {
    if (!productoSel) return;
    if (receta.some(r => r.cantidadUsada <= 0)) return showToast('Todas las cantidades deben ser mayores a 0', 'error');
    setLoading(true);
    try {
      await guardarReceta(productoSel.id, receta.map(r => ({ insumoId: r.insumoId, cantidadUsada: r.cantidadUsada })));
      showToast('Receta guardada exitosamente. Se descontará inventario al vender.');
    } catch (e: any) { 
      const errorReal = e.response?.data?.causa || e.response?.data?.error || 'Error al guardar la receta';
      showToast(`Fallo SQL: ${errorReal}`, 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const costoReceta = receta.reduce((s, r) => s + (r.cantidadUsada * (r.costo || 0)), 0);

  // Filtrado de insumos para el buscador del dropdown
  const insumosFiltradosDropdown = insumos.filter(i => 
    i.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-8 pb-10">
        
        <div className="bg-[#0a0f1c] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-gray-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Explosión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Recetas</span>
            </h1>
            <p className="text-gray-400 font-medium mt-2 max-w-xl">
              Configura los ingredientes de cada plato. El sistema descontará el inventario automáticamente tras cada venta.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* PANEL IZQUIERDO: CATÁLOGO */}
          <div className="w-full lg:w-1/3 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[700px]">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
              <div className="p-3 bg-orange-50 text-orange-500 rounded-xl"><ChefHat size={22} /></div>
              <div>
                <h2 className="font-black text-gray-900 text-lg">Catálogo</h2>
                <p className="text-xs text-gray-500 font-medium">Selecciona un plato para configurar</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {productos.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => seleccionarProducto(p)} 
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${productoSel?.id === p.id ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20 translate-x-2' : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <p className={`font-bold text-sm ${productoSel?.id === p.id ? 'text-white' : 'text-gray-900'}`}>{p.nombre}</p>
                  <p className={`text-xs mt-1 ${productoSel?.id === p.id ? 'text-orange-100' : 'text-gray-500'}`}>S/ {p.precioVenta.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* PANEL DERECHO: CONSTRUCTOR DE RECETAS */}
          <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[700px] relative">
            {!productoSel ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 bg-gray-50/50 rounded-[2rem]">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                  <Box size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">Ningún plato seleccionado</h3>
                <p className="text-sm font-medium text-center max-w-sm">Selecciona un producto del panel izquierdo para configurar los insumos y cantidades que consume.</p>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 rounded-t-[2rem]">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest mb-2">
                      Editando Receta
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">{productoSel.nombre}</h2>
                  </div>
                  <div className="text-right bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Costo de Insumos</p>
                    <p className="text-xl font-black text-emerald-600">S/ {costoReceta.toFixed(2)}</p>
                  </div>
                </div>

                <div className="p-8 flex-1 overflow-y-auto">
                  
                  {/* 🔥 NUEVO SELECTOR CON BUSCADOR INTEGRADO */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-8">
                    
                    <div className="relative flex-1" ref={insumoDropdownRef}>
                      <div 
                        onClick={() => setIsInsumoDropdownOpen(!isInsumoDropdownOpen)}
                        className={`w-full px-4 py-3.5 bg-white border rounded-xl transition-all font-semibold text-sm flex justify-between items-center cursor-pointer select-none ${isInsumoDropdownOpen ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <span className={insumoSeleccionadoId ? "text-gray-900 font-bold" : "text-gray-400"}>
                          {insumoSeleccionadoId ? insumos.find(i => i.id.toString() === insumoSeleccionadoId)?.nombre : "Buscar insumo en almacén..."}
                        </span>
                        <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isInsumoDropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
                      </div>

                      {isInsumoDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                          <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Search size={16} className="text-gray-400 shrink-0" />
                            <input 
                              type="text" 
                              autoFocus
                              placeholder="Escribe para filtrar insumos..." 
                              value={busquedaInsumo}
                              onChange={(e) => setBusquedaInsumo(e.target.value)}
                              className="bg-transparent text-sm outline-none w-full font-bold text-gray-700 placeholder-gray-400"
                            />
                          </div>
                          <ul className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
                            {insumosFiltradosDropdown.length > 0 ? (
                              insumosFiltradosDropdown.map(i => (
                                <li 
                                  key={i.id}
                                  onClick={() => {
                                    setInsumoSeleccionadoId(i.id.toString());
                                    setIsInsumoDropdownOpen(false);
                                    setBusquedaInsumo('');
                                  }}
                                  className={`px-4 py-3 rounded-lg text-sm font-bold cursor-pointer transition-colors flex justify-between items-center ${insumoSeleccionadoId === i.id.toString() ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                  <span>{i.nombre}</span>
                                  <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-black uppercase tracking-widest">{i.unidadMedida}</span>
                                </li>
                              ))
                            ) : (
                              <li className="px-4 py-5 text-center text-sm text-gray-400 font-medium">No se encontraron insumos</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => { 
                        if (insumoSeleccionadoId) {
                          agregarInsumo(parseInt(insumoSeleccionadoId)); 
                          setInsumoSeleccionadoId(''); // Reseteamos después de agregar
                        } else {
                          showToast('Selecciona un insumo de la lista primero', 'error');
                        }
                      }} 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0"
                    >
                      <Plus size={18} /> Añadir
                    </button>
                  </div>

                  <div className="space-y-4">
                    {loading && receta.length === 0 && <div className="text-center py-10 text-orange-500 font-bold animate-pulse">Cargando explosión de insumos...</div>}
                    
                    {receta.map((r) => (
                      <div key={r.insumoId} className="flex items-center gap-4 p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow group">
                        <div className="bg-orange-50 p-3 rounded-xl text-orange-500 group-hover:scale-110 transition-transform"><Box size={24} /></div>
                        <div className="flex-1">
                          <p className="font-black text-[15px] text-gray-900">{r.insumoNombre}</p>
                          <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Costo Ref: S/ {r.costo?.toFixed(2)} x {r.unidad}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                          <input 
                            type="number" step="0.001" min="0" 
                            value={r.cantidadUsada || ''} 
                            onChange={e => actualizarCantidad(r.insumoId, parseFloat(e.target.value) || 0)} 
                            className="w-20 bg-transparent text-center text-sm font-black text-gray-900 outline-none" 
                            placeholder="0.00"
                          />
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 border-l border-gray-200">{r.unidad}</span>
                        </div>
                        {/* 🔥 BOTÓN DE ELIMINAR CON ESTILO MINIMALISTA */}
                        <button onClick={() => quitarInsumo(r.insumoId)} className="text-[#C1440E] hover:scale-110 transition-transform ml-4" title="Quitar Insumo">
                          <Trash2 size={20} strokeWidth={2}/>
                        </button>
                      </div>
                    ))}
                    {receta.length === 0 && !loading && (
                      <div className="text-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                        <p className="font-bold text-gray-500 mb-1">Receta Vacía</p>
                        <p className="text-sm text-gray-400 font-medium">Añade insumos usando el buscador de arriba para construir esta receta.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-white rounded-b-[2rem] flex justify-end shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                  <button onClick={handleGuardar} disabled={loading} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 transition-all shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-70">
                    <Save size={20} strokeWidth={2.5} /> {loading ? 'Sincronizando...' : 'Guardar y Sincronizar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success' ? 'bg-gray-900 border-gray-800' : 'bg-red-50 border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="text-green-400" size={24} /> : <AlertTriangle className="text-red-500" size={24} />}
          <p className={`font-bold text-sm ${toast.type === 'success' ? 'text-white' : 'text-red-900'}`}>{toast.message}</p>
          <button onClick={() => setToast(prev => ({...prev, visible: false}))} className={`ml-4 p-1 rounded-lg transition-colors ${toast.type === 'success' ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-red-400 hover:text-red-700 hover:bg-red-100'}`}>
            <X size={16} />
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}