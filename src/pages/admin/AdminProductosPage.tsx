import { useEffect, useState, useCallback } from 'react';
import { 
  Package, LayoutList, Search, Plus, Edit2, Trash2, 
  X, UtensilsCrossed, AlertTriangle, CheckCircle, RotateCcw, Clock
} from 'lucide-react';
import { 
  getCategorias, crearCategoria, actualizarCategoria, eliminarCategoria, activarCategoria,
  getProductosAdmin, crearProducto, actualizarProducto, eliminarProducto, activarProducto
} from '@/api/catalogo';
import type { Categoria, CategoriaRequestDTO, ProductoRequestDTO } from '@/api/catalogo';
import type { Producto } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import { sileo } from 'sileo';

// ============================================================================
// COMPONENTE: MODAL CATEGORÍA
// ============================================================================
function ModalCategoria({ categoria, onClose, onGuardar }: { categoria?: Categoria | null; onClose: () => void; onGuardar: () => void; }) {
  const [nombre, setNombre] = useState(categoria?.nombre || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return sileo.error({ title: 'El nombre es obligatorio' });
    
    setLoading(true);
    try {
      const payload: CategoriaRequestDTO = { nombre };
      if (categoria) {
        await actualizarCategoria(categoria.id, payload);
        sileo.success({ title: 'Categoría actualizada exitosamente' });
      } else {
        await crearCategoria(payload);
        sileo.success({ title: 'Categoría creada exitosamente' });
      }
      onGuardar();
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error al guardar la categoría' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
            <LayoutList className="text-blue-500" size={20} />
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre de la Categoría</label>
            <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold outline-none text-gray-900" placeholder="Ej. Entradas, Bebidas..." />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 flex justify-center items-center">
              {loading ? 'Guardando...' : 'Confirmar Guardado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: MODAL PRODUCTO
// ============================================================================
function ModalProducto({ producto, categorias, onClose, onGuardar }: { producto?: Producto | null; categorias: Categoria[]; onClose: () => void; onGuardar: () => void; }) {
  const [nombre, setNombre] = useState(producto?.nombre || '');
  const [precio, setPrecio] = useState(producto?.precioVenta?.toString() || '');
  const [categoriaId, setCategoriaId] = useState(producto?.categoriaId?.toString() || (categorias[0]?.id.toString() || ''));
  
  const [esPreparado, setEsPreparado] = useState<boolean>(producto?.esPreparado ?? true);
  const [tiempo, setTiempo] = useState(producto?.tiempoPreparacionMinutos?.toString() || '5');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !precio || !categoriaId) return sileo.error({ title: 'Completa todos los campos obligatorios' });
    
    setLoading(true);
    try {
      const payload: ProductoRequestDTO = {
        nombre,
        precioVenta: parseFloat(precio),
        categoriaId: parseInt(categoriaId),
        tipoProducto: 'BIEN',
        esPreparado,
        tiempoPreparacionMinutos: parseInt(tiempo) || 5
      };

      if (producto) {
        await actualizarProducto(producto.id, payload);
        sileo.success({ title: 'Producto actualizado exitosamente' });
      } else {
        await crearProducto(payload);
        sileo.success({ title: 'Producto creado exitosamente' });
      }
      onGuardar();
    } catch (err: any) {
      sileo.error({ title: err.response?.data?.message || 'Error al guardar el producto' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="text-orange-500" size={20} />
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría Perteneciente</label>
            <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-semibold outline-none text-gray-900">
              <option value="" disabled>Seleccione una categoría...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre del Plato / Bebida</label>
            <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-semibold outline-none text-gray-900" placeholder="Ej. Lomo Saltado a lo Pobre" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Precio de Venta (S/)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">S/</span>
              <input type="number" step="0.10" min="0" value={precio} onChange={e => setPrecio(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-black outline-none text-gray-900" placeholder="0.00" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-bold text-gray-900">Va a Cocina (KDS)</p>
              <p className="text-[10px] font-medium text-gray-500 mt-0.5">¿Este ítem requiere preparación?</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={esPreparado} onChange={() => setEsPreparado(!esPreparado)} />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {esPreparado && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Clock size={12}/> Tiempo estimado (Minutos)
              </label>
              <input type="number" min="1" value={tiempo} onChange={e => setTiempo(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-semibold outline-none text-gray-900" placeholder="5" />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 flex justify-center items-center">
              {loading ? 'Guardando...' : 'Confirmar Guardado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL (PÁGINA)
// ============================================================================
export default function AdminProductosPage() {
  const [tab, setTab] = useState<'PRODUCTOS' | 'CATEGORIAS'>('PRODUCTOS');
  const [busqueda, setBusqueda] = useState('');
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalCat, setModalCat] = useState<{ isOpen: boolean; data?: Categoria | null }>({ isOpen: false });
  const [modalProd, setModalProd] = useState<{ isOpen: boolean; data?: Producto | null }>({ isOpen: false });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([getCategorias(), getProductosAdmin()]);
      setCategorias(cats);
      setProductos(prods);
    } catch (error) {
      sileo.error({ title: 'Error al conectar con el servidor para cargar el catálogo.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleEliminarCategoria = async (id: number) => {
    if(!window.confirm('¿Estás seguro de desactivar esta categoría?')) return;
    try { 
      await eliminarCategoria(id); 
      sileo.success({ title: 'Categoría ocultada' });
      cargarDatos(); 
    } catch (e) { sileo.error({ title: 'No se pudo desactivar la categoría' }); }
  };

  const handleActivarCategoria = async (id: number) => {
    if(!window.confirm('¿Deseas volver a activar esta categoría?')) return;
    try { 
      await activarCategoria(id); 
      sileo.success({ title: 'Categoría restaurada' });
      cargarDatos(); 
    } catch (e) { sileo.error({ title: 'No se pudo restaurar la categoría' }); }
  };

  const handleEliminarProducto = async (id: number) => {
    if(!window.confirm('¿Estás seguro de desactivar este producto?')) return;
    try { 
      await eliminarProducto(id); 
      sileo.success({ title: 'Producto ocultado' });
      cargarDatos(); 
    } catch (e) { sileo.error({ title: 'No se pudo desactivar el producto' }); }
  };

  const handleActivarProducto = async (id: number) => {
    if(!window.confirm('¿Deseas volver a activar este producto?')) return;
    try { 
      await activarProducto(id); 
      sileo.success({ title: 'Producto restaurado' });
      cargarDatos(); 
    } catch (e) { sileo.error({ title: 'No se pudo restaurar el producto' }); }
  };

  const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const categoriasFiltradas = categorias.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Catálogo y Menú</h1>
            <p className="text-gray-500 font-medium mt-1">Administración de precios, platos y categorías del restaurante.</p>
          </div>
        </div>

        <div className="bg-slate-100/80 p-5 rounded-[1.5rem] border border-slate-200 shadow-inner flex flex-col xl:flex-row items-center justify-between gap-5">
          
          <div className="flex p-1.5 bg-gray-200/50 rounded-2xl w-full xl:w-auto border border-gray-200/50">
            <button 
              onClick={() => setTab('PRODUCTOS')} 
              className={`flex-1 xl:w-48 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${tab === 'PRODUCTOS' ? 'bg-white shadow-md text-gray-900 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
            >
              Platos y Bebidas
            </button>
            <button 
              onClick={() => setTab('CATEGORIAS')} 
              className={`flex-1 xl:w-48 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${tab === 'CATEGORIAS' ? 'bg-white shadow-md text-gray-900 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
            >
              Categorías
            </button>
          </div>

          <div className="hidden xl:block w-px h-8 bg-slate-300"></div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="w-full sm:w-80 flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 shadow-sm rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder={tab === 'PRODUCTOS' ? "Buscar producto..." : "Buscar categoría..."} 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
                className="bg-transparent text-gray-900 text-sm font-semibold outline-none w-full placeholder-gray-400" 
              />
            </div>

            {tab === 'PRODUCTOS' ? (
              <button onClick={() => setModalProd({ isOpen: true, data: null })} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap">
                <Plus size={18} /> Nuevo Producto
              </button>
            ) : (
              <button onClick={() => setModalCat({ isOpen: true, data: null })} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 px-6 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap">
                <Plus size={18} /> Nueva Categoría
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px] relative">
          {loading ? (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-gray-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500 mb-4"></div>
              <p className="font-bold text-gray-600">Sincronizando catálogo...</p>
            </div>
          ) : null}

          {tab === 'PRODUCTOS' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-500 uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-8 py-5">Producto</th>
                    <th className="px-8 py-5">Categoría</th>
                    <th className="px-8 py-5">Precio Venta</th>
                    <th className="px-8 py-5">Disponibilidad</th>
                    <th className="px-8 py-5 text-center">Estado del Sistema</th>
                    <th className="px-8 py-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-32 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><Package size={24} className="text-gray-300"/></div>
                          <p className="font-bold text-gray-600 text-lg">Catálogo Vacío</p>
                          <p className="text-sm mt-1">No se encontraron productos con esos filtros.</p>
                        </div>
                      </td>
                    </tr>
                  ) : productosFiltrados.map((p) => (
                    <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors group ${!p.estadoRegistro ? 'opacity-50 grayscale' : ''}`}>
                      <td className="px-8 py-4 font-bold text-gray-900 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500"><UtensilsCrossed size={18} /></div>
                        <div className="flex flex-col">
                          <span className="text-base">{p.nombre}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.tipoProducto === 'SERVICIO' && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-black uppercase tracking-widest w-max">SERVICIO</span>}
                            {!p.esPreparado && <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-slate-200 w-max">DIRECTO</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-gray-500 font-medium">{categorias.find(c => c.id === p.categoriaId)?.nombre || 'Sin categoría'}</td>
                      <td className="px-8 py-4 font-black text-gray-900 text-base">S/ {p.precioVenta.toFixed(2)}</td>
                      
                      {/* CORRECCIÓN DE LA LÓGICA DE DISPONIBILIDAD */}
                      <td className="px-8 py-4">
                        {!p.estadoRegistro ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200">
                            No Aplica
                          </span>
                        ) : p.estadoDisponibilidad === 'DISPONIBLE' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100">
                            <CheckCircle size={14}/> Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-700 bg-red-50 border border-red-100">
                            <AlertTriangle size={14}/> Agotado
                          </span>
                        )}
                      </td>

                      <td className="px-8 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${p.estadoRegistro ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                          {p.estadoRegistro ? 'Activo / Visible' : 'Inactivo / Oculto'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setModalProd({ isOpen: true, data: p })} className="p-2.5 text-blue-600 bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm"><Edit2 size={16} /></button>
                          {p.estadoRegistro ? (
                            <button onClick={() => handleEliminarProducto(p.id)} className="p-2.5 text-red-600 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-sm" title="Ocultar Producto"><Trash2 size={16} /></button>
                          ) : (
                            <button onClick={() => handleActivarProducto(p.id)} className="p-2.5 text-emerald-600 bg-white border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl transition-all shadow-sm" title="Restaurar Producto"><RotateCcw size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-500 uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-8 py-5 w-1/3">Categoría</th>
                    <th className="px-8 py-5 text-center">Estado del Sistema</th>
                    <th className="px-8 py-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categoriasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-32 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><LayoutList size={24} className="text-gray-300"/></div>
                          <p className="font-bold text-gray-600 text-lg">Sin Categorías</p>
                          <p className="text-sm mt-1">Crea una familia para empezar a organizar tu menú.</p>
                        </div>
                      </td>
                    </tr>
                  ) : categoriasFiltradas.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-4 font-bold text-gray-900 flex items-center gap-4 text-base">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500"><LayoutList size={18} /></div>
                        {c.nombre}
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${c.estadoRegistro ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                          {c.estadoRegistro ? 'Activo / Visible' : 'Inactivo / Oculto'}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setModalCat({ isOpen: true, data: c })} className="p-2.5 text-blue-600 bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm"><Edit2 size={16} /></button>
                          {c.estadoRegistro ? (
                            <button onClick={() => handleEliminarCategoria(c.id)} className="p-2.5 text-red-600 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-sm" title="Ocultar Categoría"><Trash2 size={16} /></button>
                          ) : (
                            <button onClick={() => handleActivarCategoria(c.id)} className="p-2.5 text-emerald-600 bg-white border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl transition-all shadow-sm" title="Restaurar Categoría"><RotateCcw size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalCat.isOpen && <ModalCategoria categoria={modalCat.data} onClose={() => setModalCat({ isOpen: false })} onGuardar={() => { setModalCat({ isOpen: false }); cargarDatos(); }} />}
      {modalProd.isOpen && <ModalProducto producto={modalProd.data} categorias={categorias} onClose={() => setModalProd({ isOpen: false })} onGuardar={() => { setModalProd({ isOpen: false }); cargarDatos(); }} />}
    </AdminLayout>
  );
}