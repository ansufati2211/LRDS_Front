import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Package, LayoutList, Search, Plus, Edit2, Trash2, 
  X, UtensilsCrossed, AlertTriangle, CheckCircle, RotateCcw, Clock, ChevronDown
} from 'lucide-react';
import { 
  getCategorias, crearCategoria, actualizarCategoria, eliminarCategoria, activarCategoria,
  getProductosAdmin, crearProducto, actualizarProducto, eliminarProducto, activarProducto
} from '@/api/catalogo';
import type { Categoria, CategoriaRequestDTO, ProductoRequestDTO } from '@/api/catalogo';
import type { Producto } from '@/types';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore'; 
import { sileo } from 'sileo';

// ============================================================================
// COMPONENTE: MODAL DE CONFIRMACIÓN (ESTILO PREMIUM UNIFICADO)
// ============================================================================
function ModalConfirmacion({ isOpen, title, message, onClose, onConfirm }: { isOpen: boolean; title: string; message: string; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-gray-500 text-sm font-medium mt-2">{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all">Cancelar</button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl transition-all shadow-lg shadow-[#FFC640]/30">Sí, confirmar</button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 pt-20 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera Fija */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-gray-900 font-black text-xl tracking-tight flex items-center gap-2">
            <LayoutList className="text-blue-500" size={20} />
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>

        {/* Formulario con Scroll Oculto */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre de la Categoría</label>
            <input autoFocus value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold outline-none text-gray-900" placeholder="Ej. Entradas, Bebidas..." />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-5 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black rounded-xl disabled:opacity-50 flex justify-center items-center shadow-lg shadow-[#FFC640]/30 transition-all">
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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categoriasFiltradasDropdown = categorias.filter(c => 
    c.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase())
  );

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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera Más Compacta */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <h2 className="text-gray-900 font-black text-lg tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="text-orange-500" size={18} />
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-full transition-all active:scale-95">
            <X size={18} />
          </button>
        </div>
        
        {/* Formulario Compacto (Redujimos paddings y space-y) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Categoría Perteneciente</label>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl transition-all font-semibold text-sm text-gray-900 flex justify-between items-center cursor-pointer select-none ${isDropdownOpen ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <span className={categoriaId ? "text-gray-900" : "text-gray-400"}>
                {categoriaId ? categorias.find(c => c.id.toString() === categoriaId)?.nombre : "Seleccione una categoría..."}
              </span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Search size={14} className="text-gray-400 shrink-0 ml-1" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Buscar..." 
                    value={busquedaCategoria}
                    onChange={(e) => setBusquedaCategoria(e.target.value)}
                    className="bg-transparent text-sm outline-none w-full font-medium text-gray-700 py-1 placeholder-gray-400"
                  />
                </div>
                <ul className="max-h-40 overflow-y-auto p-1 custom-scrollbar">
                  {categoriasFiltradasDropdown.length > 0 ? (
                    categoriasFiltradasDropdown.map(c => (
                      <li 
                        key={c.id}
                        onClick={() => {
                          setCategoriaId(c.id.toString());
                          setIsDropdownOpen(false);
                          setBusquedaCategoria('');
                        }}
                        className={`px-3 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors ${categoriaId === c.id.toString() ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                      >
                        {c.nombre}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-center text-sm text-gray-400 font-medium">Sin resultados</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nombre del Plato / Bebida</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-semibold outline-none text-gray-900" placeholder="Ej. Lomo Saltado a lo Pobre" />
          </div>

          {/* 🔥 GRID COMPACTO: Precio y Tiempo en la misma fila (si requiere preparación) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Precio (S/)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">S/</span>
                <input type="number" step="0.10" min="0" value={precio} onChange={e => setPrecio(e.target.value)} className="w-full pl-8 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-black outline-none text-gray-900" placeholder="0.00" />
              </div>
            </div>

            {esPreparado ? (
              <div className="animate-in fade-in">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Clock size={12}/> Tiempo (Min)
                </label>
                <input type="number" min="1" value={tiempo} onChange={e => setTiempo(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-semibold outline-none text-gray-900" placeholder="5" />
              </div>
            ) : (
              <div></div> /* Espacio vacío para mantener el Grid */
            )}
          </div>

          <div className="flex items-center justify-between bg-gray-50 p-3.5 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">Va a Cocina (KDS)</p>
              <p className="text-[10px] font-medium text-gray-500 mt-1 leading-none">¿Requiere preparación?</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={esPreparado} onChange={() => setEsPreparado(!esPreparado)} />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-gray-900 transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white  font-black rounded-xl disabled:opacity-50 flex justify-center items-center shadow-lg shadow-[#FFC640]/30 transition-all">
              {loading ? 'Guardando...' : 'Confirmar'}
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
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'ROLE_SUPER_ADMIN' || user?.rol === 'ROLE_ADMIN_EMPRESA';

  const [tab, setTab] = useState<'PRODUCTOS' | 'CATEGORIAS'>('PRODUCTOS');
  const [busqueda, setBusqueda] = useState('');
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalCat, setModalCat] = useState<{ isOpen: boolean; data?: Categoria | null }>({ isOpen: false });
  const [modalProd, setModalProd] = useState<{ isOpen: boolean; data?: Producto | null }>({ isOpen: false });

  // 🔥 NUEVO ESTADO PARA EL MODAL DE CONFIRMACIÓN CUSTOM
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: '', message: '', action: () => {} });

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

  // 🔥 NUEVAS FUNCIONES CON MODAL CUSTOM (SIN WINDOW.CONFIRM)
  const handleEliminarCategoria = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Desactivar Categoría?',
      message: 'Al ocultar esta categoría, dejará de estar visible en el sistema para los usuarios.',
      action: async () => {
        try { 
          await eliminarCategoria(id); 
          sileo.success({ title: 'Categoría ocultada' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'No se pudo desactivar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const handleActivarCategoria = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar Categoría?',
      message: 'La categoría volverá a estar visible y disponible para su uso.',
      action: async () => {
        try { 
          await activarCategoria(id); 
          sileo.success({ title: 'Categoría restaurada' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'No se pudo restaurar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const handleEliminarProducto = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Desactivar Producto?',
      message: 'Al ocultar este producto, dejará de estar disponible en el menú de ventas.',
      action: async () => {
        try { 
          await eliminarProducto(id); 
          sileo.success({ title: 'Producto ocultado' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'No se pudo desactivar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const handleActivarProducto = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Restaurar Producto?',
      message: 'El producto volverá a estar disponible para su venta en el catálogo.',
      action: async () => {
        try { 
          await activarProducto(id); 
          sileo.success({ title: 'Producto restaurado' });
          cargarDatos(); 
        } catch (e: any) { 
          const errorReal = e.response?.data?.message || e.response?.data?.error || 'No se pudo restaurar';
          sileo.error({ title: 'Fallo Servidor', description: errorReal }); 
        }
      }
    });
  };

  const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const categoriasFiltradas = categorias.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Catálogo y <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Menú</span>
            </h1>
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

            {isAdmin && tab === 'PRODUCTOS' && (
              <button onClick={() => setModalProd({ isOpen: true, data: null })} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black px-6 py-3 rounded-xl font-black flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap">
                <Plus size={18} /> Nuevo Producto
              </button>
            )}
            {isAdmin && tab === 'CATEGORIAS' && (
              <button onClick={() => setModalCat({ isOpen: true, data: null })} className="w-full sm:w-auto bg-[#FFC640] hover:bg-amber-400 text-black shadow-lg shadow-[#FFC640]/30 px-6 py-3 rounded-xl font-black flex justify-center items-center gap-2 transition-all active:scale-95 whitespace-nowrap">
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
                    {isAdmin && <th className="px-8 py-5 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-8 py-32 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><Package size={24} className="text-gray-300"/></div>
                          <p className="font-bold text-gray-600 text-lg">Catálogo Vacío</p>
                          <p className="text-sm mt-1">{isAdmin ? 'Crea un producto para empezar.' : 'Contacta al administrador para gestionar el menú.'}</p>
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

                      {isAdmin && (
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-4">
                            <button onClick={() => setModalProd({ isOpen: true, data: p })} className="text-[#FFC640] hover:scale-110 transition-transform" title="Editar">
                              <Edit2 size={18} strokeWidth={2} />
                            </button>
                            {p.estadoRegistro ? (
                              <button onClick={() => handleEliminarProducto(p.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Ocultar Producto">
                                <Trash2 size={18} strokeWidth={2} />
                              </button>
                            ) : (
                              <button onClick={() => handleActivarProducto(p.id)} className="text-emerald-500 hover:scale-110 transition-transform" title="Restaurar Producto">
                                <RotateCcw size={18} strokeWidth={2} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
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
                    {isAdmin && <th className="px-8 py-5 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categoriasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 3 : 2} className="px-8 py-32 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4"><LayoutList size={24} className="text-gray-300"/></div>
                          <p className="font-bold text-gray-600 text-lg">Sin Categorías</p>
                          <p className="text-sm mt-1">{isAdmin ? 'Crea una familia para empezar a organizar tu menú.' : 'Contacta al administrador para gestionar el menú.'}</p>
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

                      {isAdmin && (
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-4">
                            <button onClick={() => setModalCat({ isOpen: true, data: c })} className="text-[#FFC640] hover:scale-110 transition-transform" title="Editar">
                              <Edit2 size={18} strokeWidth={2} />
                            </button>
                            {c.estadoRegistro ? (
                              <button onClick={() => handleEliminarCategoria(c.id)} className="text-[#C1440E] hover:scale-110 transition-transform" title="Ocultar Categoría">
                                <Trash2 size={18} strokeWidth={2} />
                              </button>
                            ) : (
                              <button onClick={() => handleActivarCategoria(c.id)} className="text-emerald-500 hover:scale-110 transition-transform" title="Restaurar Categoría">
                                <RotateCcw size={18} strokeWidth={2} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
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
      
      {/* MODAL DE CONFIRMACIÓN CUSTOM */}
      {confirmModal.isOpen && (
        <ModalConfirmacion 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.action}
        />
      )}
    </AdminLayout>
  );
}