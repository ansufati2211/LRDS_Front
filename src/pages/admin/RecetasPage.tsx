import { useEffect, useState } from 'react';
import { ChefHat, Save, Plus, Trash2, Box,ArrowLeft } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { getProductosAdmin } from '@/api/catalogo';
import { getInsumos, getRecetaProducto, guardarReceta } from '@/api/inventario';
import type { Producto } from '@/types';
import type { Insumo } from '@/api/inventario';

interface RecetaLocal { insumoId: number; cantidadUsada: number; insumoNombre?: string; unidad?: string; costo?: number; }

export default function RecetasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [productoSel, setProductoSel] = useState<Producto | null>(null);
  const [receta, setReceta] = useState<RecetaLocal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getProductosAdmin(), getInsumos()]).then(([p, i]) => {
      setProductos(p.filter(x => x.estadoRegistro));
      setInsumos(i.filter(x => x.estadoRegistro));
    });
  }, []);

  const seleccionarProducto = async (prod: Producto) => {
    setProductoSel(prod);
    setLoading(true);
    try {
      const data = await getRecetaProducto(prod.id);
      // Mapeamos los datos de la BD y buscamos el nombre del insumo localmente
      const mapeada = data.map((d: any) => {
        const ins = insumos.find(i => i.id === d.insumoId);
        return { insumoId: d.insumoId, cantidadUsada: d.cantidadUsada, insumoNombre: ins?.nombre, unidad: ins?.unidadMedida, costo: ins?.costoUnitario };
      });
      setReceta(mapeada);
    } catch {
      setReceta([]); // Si no tiene receta, empieza vacía
    } finally { setLoading(false); }
  };

  const agregarInsumo = (insumoId: number) => {
    if (!insumoId) return;
    if (receta.find(r => r.insumoId === insumoId)) return alert('Este insumo ya está en la receta');
    const ins = insumos.find(i => i.id === insumoId);
    setReceta([...receta, { insumoId, cantidadUsada: 0, insumoNombre: ins?.nombre, unidad: ins?.unidadMedida, costo: ins?.costoUnitario }]);
  };

  const quitarInsumo = (insumoId: number) => setReceta(receta.filter(r => r.insumoId !== insumoId));
  
  const actualizarCantidad = (insumoId: number, val: number) => {
    setReceta(receta.map(r => r.insumoId === insumoId ? { ...r, cantidadUsada: val } : r));
  };

  const handleGuardar = async () => {
    if (!productoSel) return;
    if (receta.some(r => r.cantidadUsada <= 0)) return alert('Todas las cantidades deben ser mayores a 0');
    setLoading(true);
    try {
      await guardarReceta(productoSel.id, receta.map(r => ({ insumoId: r.insumoId, cantidadUsada: r.cantidadUsada })));
      alert('Receta guardada exitosamente. Se descontará inventario al vender.');
    } catch (e: any) { alert('Error al guardar: ' + e.message); } 
    finally { setLoading(false); }
  };

  const costoReceta = receta.reduce((s, r) => s + (r.cantidadUsada * (r.costo || 0)), 0);

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* PANEL IZQUIERDO: LISTA DE PRODUCTOS */}
        <div className="w-full lg:w-1/3 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col max-h-[80vh]">
          <div className="p-5 border-b border-gray-100 bg-orange-50/50 rounded-t-3xl">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><ChefHat className="text-orange-500"/> Catálogo de Platos</h2>
            <p className="text-xs text-gray-500 mt-1">Selecciona uno para armar su receta</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {productos.map(p => (
              <button key={p.id} onClick={() => seleccionarProducto(p)} className={`w-full text-left p-3 rounded-xl border transition-all ${productoSel?.id === p.id ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-500' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                <p className="font-bold text-sm text-gray-900">{p.nombre}</p>
                <p className="text-xs text-gray-500">S/ {p.precioVenta.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* PANEL DERECHO: CONSTRUCTOR DE RECETAS */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col">
          {!productoSel ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
              <ArrowLeft size={48} className="mb-4 opacity-30" />
              <p className="font-semibold">Selecciona un producto del catálogo</p>
              <p className="text-sm">Para configurar su explosión de insumos.</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-slate-900 rounded-t-3xl text-white">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Configuración de Receta</p>
                  <h2 className="text-2xl font-black">{productoSel.nombre}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase font-bold">Costo Base</p>
                  <p className="text-xl font-black text-green-400">S/ {costoReceta.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="flex items-center gap-3">
                  <select id="insumoSelect" className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-300 outline-none" defaultValue="">
                    <option value="" disabled>Añadir un nuevo insumo a la receta...</option>
                    {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidadMedida})</option>)}
                  </select>
                  <button onClick={() => { 
                    const select = document.getElementById('insumoSelect') as HTMLSelectElement;
                    agregarInsumo(parseInt(select.value)); select.value = ""; 
                  }} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition">
                    <Plus size={16} /> Añadir
                  </button>
                </div>

                <div className="space-y-3 mt-6">
                  {loading && <p className="text-sm text-gray-500 animate-pulse">Cargando receta...</p>}
                  {receta.map((r) => (
                    <div key={r.insumoId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl bg-white shadow-sm">
                      <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Box size={20} /></div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{r.insumoNombre}</p>
                        <p className="text-xs text-gray-500">Costo Ref: S/ {r.costo?.toFixed(2)} x {r.unidad}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.001" min="0" value={r.cantidadUsada} onChange={e => actualizarCantidad(r.insumoId, parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-bold" />
                        <span className="text-xs font-bold text-gray-400 w-8">{r.unidad}</span>
                      </div>
                      <button onClick={() => quitarInsumo(r.insumoId)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18}/></button>
                    </div>
                  ))}
                  {receta.length === 0 && !loading && <div className="text-center py-10 text-sm text-gray-400 font-medium border-2 border-dashed rounded-2xl">Esta receta aún no tiene insumos configurados.</div>}
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end">
                <button onClick={handleGuardar} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition shadow-md shadow-orange-500/20 disabled:opacity-50">
                  <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Receta'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}