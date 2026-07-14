import { useState } from 'react';
import { X, Search, Plus, Minus, Send, Loader2 } from 'lucide-react';
import { agregarItems } from '@/api/pedidos';
import type { PedidoActivo, Producto, ItemPedidoLocal } from '@/types';

interface Props {
  pedido: PedidoActivo;
  productos: Producto[];
  onClose: () => void;
  onAgregado: () => Promise<void>;
}

export default function ModalAgregarItems({ pedido, productos, onClose, onAgregado }: Props) {
  const [carrito, setCarrito] = useState<ItemPedidoLocal[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [enviando, setEnviando] = useState(false);

  const disponibles = productos.filter(p => p.estadoDisponibilidad === 'DISPONIBLE' && p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const agregar = (prod: Producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.productoId === prod.id);
      if (existe) return prev.map((i) => (i.productoId === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...prev, { productoId: prod.id, nombre: prod.nombre, precio: prod.precioVenta, cantidad: 1, notas: '' }];
    });
  };

  const cambiarCantidad = (productoId: number, delta: number) => {
    setCarrito((prev) => prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i)).filter((i) => i.cantidad > 0));
  };

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const handleEnviar = async () => {
    if (carrito.length === 0) return;
    setEnviando(true);
    try {
      await agregarItems(pedido.id, carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, notasPreparacion: i.notas })));
      await onAgregado();
      onClose();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-white font-black text-xl tracking-tight">Adicionar Platos - Orden #{pedido.id}</h2>
            <p className="text-orange-100 text-sm font-bold mt-1">{pedido.mesa || pedido.tipoConsumo}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 p-2.5 rounded-full transition-colors active:scale-95"><X size={20} /></button>
        </div>
        
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar platillo para agregar..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-sm" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar bg-gray-50/30">
          {disponibles.length === 0 && <p className="text-center text-gray-400 font-bold text-sm py-8">No hay coincidencias disponibles</p>}
          {disponibles.map((prod) => {
            const enCarrito = carrito.find((i) => i.productoId === prod.id);
            return (
              <div key={prod.id} onClick={() => agregar(prod)} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-orange-300 hover:shadow-md cursor-pointer transition-all active:scale-[0.98]">
                <div>
                  <p className="text-sm font-black text-gray-800">{prod.nombre}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">S/ {prod.precioVenta.toFixed(2)}</p>
                </div>
                {enCarrito && (
                  <span className="bg-orange-500 text-white text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl shadow-sm">
                    {enCarrito.cantidad}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        {carrito.length > 0 && (
          <div className="p-5 border-t border-gray-100 space-y-3 max-h-48 overflow-y-auto bg-gray-50 custom-scrollbar">
            {carrito.map((item) => (
              <div key={item.productoId} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                  <button onClick={() => cambiarCantidad(item.productoId, 1)} className="p-1.5 text-gray-500 hover:text-orange-600 transition-colors"><Plus size={14} strokeWidth={3} /></button>
                  <span className="text-xs font-black text-gray-900 py-1">{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.productoId, -1)} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"><Minus size={14} strokeWidth={3} /></button>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800 leading-tight">{item.nombre}</p>
                  <p className="text-xs font-black text-orange-600 mt-1">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total adicionales</span>
            <span className="text-2xl font-black text-gray-900">S/ {total.toFixed(2)}</span>
          </div>
          <button onClick={handleEnviar} disabled={enviando || carrito.length === 0} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2 active:scale-95">
            {enviando ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {enviando ? 'Enviando a cocina...' : 'Confirmar Adición'}
          </button>
        </div>
      </div>
    </div>
  );
}