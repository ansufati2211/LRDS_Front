import { useEffect, useState } from 'react';
import { PackagePlus, TrendingDown, Settings2, Box } from 'lucide-react';
import { getInsumos, registrarEntrada, registrarMerma, registrarAjuste } from '@/api/inventario';
import type { Insumo } from '@/api/inventario';
import AdminLayout from '@/components/layouts/AdminLayout';

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
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const cargarInsumos = async () => setInsumos(await getInsumos());
  useEffect(() => { cargarInsumos(); }, []);

  const insumoSel = insumos.find(i => i.id.toString() === insumoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoId || !cantidad) return;
    setLoading(true); setMensaje({ texto: '', tipo: '' });

    try {
      if (tipoMov === 'ENTRADA') {
        await registrarEntrada({ insumoId: parseInt(insumoId), cantidad: parseFloat(cantidad), costoUnitario: parseFloat(costo) || 0, proveedor: motivo });
      } else if (tipoMov === 'MERMA') {
        await registrarMerma({ insumoId: parseInt(insumoId), cantidad: parseFloat(cantidad), motivo });
      } else {
        await registrarAjuste({ insumoId: parseInt(insumoId), cantidad: parseFloat(cantidad), tipoAjuste, motivo });
      }
      setMensaje({ texto: 'Movimiento registrado exitosamente.', tipo: 'success' });
      setCantidad(''); setCosto(''); setMotivo('');
      cargarInsumos(); // Actualiza el stock visualmente
    } catch (err: any) {
      setMensaje({ texto: err.response?.data?.message || 'Error al registrar el movimiento', tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Box size={24} /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Movimientos de Kardex</h2>
            <p className="text-sm text-gray-500">Registra compras, mermas o ajustes manuales al inventario.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
            <button onClick={() => setTipoMov('ENTRADA')} className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all ${tipoMov === 'ENTRADA' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}><PackagePlus size={18}/> Entrada (Compra)</button>
            <button onClick={() => setTipoMov('MERMA')} className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all ${tipoMov === 'MERMA' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}><TrendingDown size={18}/> Merma (Pérdida)</button>
            <button onClick={() => setTipoMov('AJUSTE')} className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all ${tipoMov === 'AJUSTE' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><Settings2 size={18}/> Ajuste Manual</button>
          </div>

          {mensaje.texto && (
            <div className={`p-4 rounded-xl mb-6 font-bold text-sm ${mensaje.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {mensaje.texto}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seleccionar Insumo</label>
                <select required value={insumoId} onChange={e => setInsumoId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-300 font-medium">
                  <option value="" disabled>Elige un insumo...</option>
                  {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre} (Stock: {i.stockActual} {i.unidadMedida})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad a {tipoMov === 'ENTRADA' ? 'Ingresar' : tipoMov === 'MERMA' ? 'Descontar' : 'Ajustar'}</label>
                <div className="relative">
                  <input required type="number" step="0.01" min="0.01" value={cantidad} onChange={e => setCantidad(e.target.value)} className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-300 font-bold" placeholder="0.00" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">{insumoSel?.unidadMedida || '-'}</span>
                </div>
              </div>
            </div>

            {tipoMov === 'AJUSTE' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Ajuste</label>
                <select value={tipoAjuste} onChange={e => setTipoAjuste(e.target.value as 'POSITIVO'|'NEGATIVO')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-300">
                  <option value="POSITIVO">AJUSTE POSITIVO (Sumar al stock)</option>
                  <option value="NEGATIVO">AJUSTE NEGATIVO (Restar al stock)</option>
                </select>
              </div>
            )}

            {tipoMov === 'ENTRADA' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Unitario (S/)</label>
                <input required type="number" step="0.001" min="0" value={costo} onChange={e => setCosto(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-300" placeholder="¿Cuánto costó cada unidad?" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{tipoMov === 'ENTRADA' ? 'Proveedor (Opcional)' : 'Motivo / Justificación'}</label>
              <input required={tipoMov !== 'ENTRADA'} type="text" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-300" placeholder={tipoMov === 'ENTRADA' ? 'Ej. Macro Mercado' : 'Ej. Tomates vencidos, error de conteo...'} />
            </div>

            <button type="submit" disabled={loading} className={`w-full font-bold py-3.5 rounded-xl text-white transition ${tipoMov === 'ENTRADA' ? 'bg-green-600 hover:bg-green-700' : tipoMov === 'MERMA' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
              {loading ? 'Registrando...' : 'Confirmar Movimiento'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}