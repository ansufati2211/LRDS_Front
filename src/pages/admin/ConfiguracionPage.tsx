import { useEffect, useState } from 'react';
import { Building2, ShieldCheck, Mail, Building, FileText, Lock, CheckCircle, MapPin } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import { getMiEmpresa } from '@/api/empresa';
import type { Empresa } from '@/api/empresa';
import { sileo } from 'sileo';

export default function ConfiguracionPage() {
  const { user } = useAuthStore();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMiEmpresa()
      .then(data => { 
        if(data) setEmpresa(data); 
      })
      .catch(() => {
        sileo.error({ title: 'Error al cargar los datos de la empresa' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* CABECERA LIMPIA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Ajustes de <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-600">Plataforma</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">Configuración del sistema y estado de licencia.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="font-bold text-gray-400 animate-pulse">Cargando configuración...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* TARJETA 1: DATOS DEL TENANT (EMPRESA) */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-10 relative overflow-hidden group">
              {/* Deco de fondo */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors"></div>
              
              <div className="relative z-10 flex items-center gap-4 mb-8 border-b border-gray-50 pb-6">
                <div className="w-12 h-12 rounded-[1rem] bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
                  <Building size={24} strokeWidth={2.5}/>
                </div>
                <h3 className="font-black text-2xl text-gray-900 tracking-tight">Perfil de Franquicia</h3>
              </div>
              
              <div className="relative z-10 space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre Comercial</label>
                  <div className="px-5 py-4 bg-gray-50/80 border border-gray-100 rounded-[1.25rem] text-gray-900 font-black text-lg">
                    {empresa?.nombreComercial || 'Cargando...'}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">RUC Comercial</label>
                    <div className="px-5 py-4 bg-gray-50/80 border border-gray-100 rounded-[1.25rem] text-gray-900 font-bold flex items-center gap-3">
                      <FileText size={18} className="text-gray-400"/> 
                      {empresa?.ruc || 'No especificado'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dirección Registrada</label>
                    <div className="px-5 py-4 bg-gray-50/80 border border-gray-100 rounded-[1.25rem] text-gray-900 font-bold flex items-center gap-3">
                      <MapPin size={18} className="text-gray-400"/> 
                      <span className="truncate" title={empresa?.direccion}>{empresa?.direccion || 'No especificada'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Usuario Administrador</label>
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-purple-500"/> 
                      <span className="text-gray-700 font-bold text-sm">{user?.correo}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Identificador de Base de Datos</label>
                    <div className="flex items-center gap-3">
                      <Lock size={16} className="text-purple-500"/> 
                      <span className="text-gray-700 font-mono font-bold text-sm bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                        TENANT-{user?.empresaId || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TARJETA 2: ESTADO DE SUSCRIPCIÓN (MODO OSCURO) */}
            <div className="bg-gradient-to-b from-[#0a0f1c] to-slate-900 rounded-[2rem] shadow-xl border border-gray-800 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1rem] bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <ShieldCheck size={24} strokeWidth={2.5}/>
                    </div>
                    <h3 className="font-black text-2xl text-white tracking-tight">Licencia de Software</h3>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle size={14}/> Activa
                  </span>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest mb-1">Plan Actual Contratado</p>
                    <p className="text-3xl font-black text-white tracking-tight">
                      VERONICA <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Enterprise</span>
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest mb-3">Módulos Habilitados en este Tenant</p>
                    <div className="flex flex-wrap gap-2.5">
                      <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-inner">🍽️ POS & KDS</span>
                      <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-inner">📦 INVENTARIO KARDEX</span>
                      <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-inner">📈 COSTOS & MÁRGENES</span>
                      <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-inner">🧾 FACTURACIÓN ELECTRÓNICA</span>
                      <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-xl shadow-inner">🏢 MULTI-SEDE</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative z-10 mt-8 pt-6 border-t border-white/5">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                  <Building2 className="text-gray-400 shrink-0" size={20} />
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">
                    Esta licencia permite la administración global de múltiples sedes o locales físicos (franquicias) bajo una misma Razón Social.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}