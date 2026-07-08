import { useEffect, useState } from 'react';
import { Building2, ShieldCheck, Mail, Building, FileText, Lock } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { getMiEmpresa } from '@/api/empresa';
import type { Empresa } from '@/api/empresa';

export default function ConfiguracionPage() {
  const { user } = useAuthStore();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  useEffect(() => {
    getMiEmpresa().then(data => { if(data) setEmpresa(data); });
  }, []);

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-slate-100 p-3 rounded-xl text-slate-700"><Building2 size={24} /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configuración del Sistema</h2>
            <p className="text-sm text-gray-500">Datos de la empresa y estado de la suscripción VERONICA.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tarjeta: Datos del Tenant */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h3 className="font-black text-gray-900 flex items-center gap-2 border-b pb-4"><Building size={18}/> Perfil de Empresa</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Razón Social</label>
              <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-bold">{empresa?.razonSocial || 'La Ruta del Sabor S.A.C.'}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RUC</label>
                <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium flex items-center gap-2"><FileText size={16} className="text-gray-400"/> {empresa?.ruc || '20123456789'}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Tenant</label>
                <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium flex items-center gap-2"><Lock size={16} className="text-gray-400"/> EMP-{user?.empresaId || '001'}</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Usuario Administrador</label>
              <div className="px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 font-medium flex items-center gap-2"><Mail size={16} className="text-gray-400"/> {user?.correo}</div>
            </div>
          </div>

          {/* Tarjeta: Estado de Suscripción */}
          <div className="bg-slate-900 rounded-3xl shadow-sm border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4 border-b border-slate-700 pb-4">
                <h3 className="font-black text-white flex items-center gap-2"><ShieldCheck className="text-green-400" size={20}/> Licencia de Software</h3>
                <span className="bg-green-500/20 text-green-400 text-xs font-black px-3 py-1 rounded-full border border-green-500/30 uppercase tracking-widest">Activa</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold">Plan Actual</p>
                  <p className="text-xl font-black text-white">VERONICA Enterprise (Full)</p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold mb-2">Módulos Habilitados</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded-md">MÓDULO KDS</span>
                    <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded-md">MÓDULO INVENTARIO</span>
                    <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded-md">MÓDULO COSTOS</span>
                    <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded-md">MÓDULO FACTURACIÓN</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-slate-800 text-center">
              El pago de la suscripción está gestionado externamente.
            </p>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}