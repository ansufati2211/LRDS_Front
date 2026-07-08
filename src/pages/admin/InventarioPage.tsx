import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, AlertTriangle, Box } from 'lucide-react';
import { getInsumos, crearInsumo, actualizarInsumo, eliminarInsumo } from '@/api/inventario';
import type { Insumo, InsumoRequestDTO } from '@/api/inventario';
import AdminLayout from '@/components/layouts/AdminLayout';

// COMPONENTE EXTRAÍDO: Modal Insumo
function ModalInsumo({ insumo, onClose, onGuardar }: { insumo?: Insumo | null; onClose: () => void; onGuardar: () => void }) {
  const [nombre, setNombre] = useState(insumo?.nombre || '');
  const [unidadMedida, setUnidadMedida] = useState(insumo?.unidadMedida || 'KG');
  const [stockActual, setStockActual] = useState(insumo?.stockActual?.toString() || '0');
  const [stockMinimo, setStockMinimo] = useState(insumo?.stockMinimo?.toString() || '0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return setError('El nombre es obligatorio');
    
    setLoading(true); setError('');
    try {
      const payload: InsumoRequestDTO = {
        nombre, unidadMedida,
        stockActual: parseFloat(stockActual),
        stockMinimo: parseFloat(stockMinimo)
      };
      if (insumo) await actualizarInsumo(insumo.id, payload);
      else await crearInsumo(payload);
      onGuardar();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white font-bold">
          <h2>{insumo ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
          <button onClick={onClose} className="hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-600 bg-red-50 p-2 rounded-lg text-sm">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Insumo</label>
            <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2 border rounded-xl" placeholder="Ej. Tomate" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unidad (KG, LT, UND)</label>
              <input value={unidadMedida} onChange={e => setUnidadMedida(e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Mínimo</label>
              <input type="number" step="0.01" min="0" value={stockMinimo} onChange={e => setStockMinimo(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
            </div>
          </div>

          {!insumo && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Inicial</label>
              <input type="number" step="0.01" min="0" value={stockActual} onChange={e => setStockActual(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-xl text-gray-600 hover:bg-gray-50 font-bold">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-slate-900 text-white rounded-xl hover:bg-black font-bold disabled:opacity-50">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventarioPage() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ isOpen: boolean; data?: Insumo | null }>({ isOpen: false });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      setInsumos(await getInsumos());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminar = async (id: number) => {
    if(!window.confirm('¿Desactivar insumo?')) return;
    try { await eliminarInsumo(id); cargarDatos(); } catch (e) { alert('Error al desactivar'); }
  };

  const filtrados = insumos.filter(i => i.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera Interna */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-3 rounded-xl text-slate-700"><Box size={24} /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Almacén Central</h2>
              <p className="text-sm text-gray-500">Gestión de insumos y materia prima</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar insumo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm" />
            </div>
            <button onClick={() => setModal({ isOpen: true, data: null })} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 text-sm">
              <Plus size={16} /> Nuevo Insumo
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border rounded-3xl shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <p className="p-10 text-center text-gray-400">Cargando almacén...</p>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4 font-bold">Insumo</th>
                  <th className="px-6 py-4 font-bold">Stock Físico</th>
                  <th className="px-6 py-4 font-bold">Stock Reservado</th>
                  <th className="px-6 py-4 font-bold">Costo Und.</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(i => {
                  const critico = i.stockActual <= i.stockMinimo;
                  return (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{i.nombre} <span className="text-gray-400 font-normal">({i.unidadMedida})</span></td>
                      <td className={`px-6 py-4 font-black ${critico ? 'text-red-600' : 'text-slate-700'}`}>{i.stockActual}</td>
                      <td className="px-6 py-4 text-orange-500 font-bold">{i.stockReservado}</td>
                      <td className="px-6 py-4 font-mono text-gray-500">S/ {i.costoUnitario.toFixed(4)}</td>
                      <td className="px-6 py-4">
                        {critico ? <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold flex items-center w-max gap-1"><AlertTriangle size={12}/> BAJO STOCK</span> 
                                 : <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">OK</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setModal({ isOpen: true, data: i })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleEliminar(i.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal.isOpen && <ModalInsumo insumo={modal.data} onClose={() => setModal({ isOpen: false })} onGuardar={() => { setModal({ isOpen: false }); cargarDatos(); }} />}
    </AdminLayout>
  );
}