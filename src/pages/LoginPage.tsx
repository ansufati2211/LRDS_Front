import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  // Utiliza exactamente tu función del store
  const setAuth = useAuthStore((s) => s.setAuth); 
  
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Llamada exacta a tu API
      const data = await login({ correo, password });
      
      // Guardamos en Zustand
      setAuth(data);

      // Redirige según el rol (tu lógica exacta)
      const rol = data.rol;
      if (rol === 'ROLE_COCINA') navigate('/kds');
      else if (rol === 'ROLE_GERENTE' || rol === 'ROLE_SUPER_ADMIN') navigate('/dashboard');
      else navigate('/mozo');

    } catch (err: any) {
      // 1. Imprimimos el error real y profundo en la consola
      console.error("🕵️‍♂️ ERROR DETECTADO EN LOGIN:", err);
      
      // 2. Si el error es de conexión, te lo avisará visualmente
      if (err.message === "Network Error") {
        setError("❌ Error de Red: El backend en Java está apagado o bloqueando la conexión.");
      } else {
        // 3. Muestra el error real del backend si es que llegó
        setError(err.response?.data?.message || 'Error desconocido al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-orange-100/50">
        
        {/* Panel Izquierdo: Branding (Oculto en móviles, visible desde pantallas medianas) */}
        <div className="hidden md:flex md:w-1/2 bg-orange-500 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mb-6 shadow-inner border border-white/30">
              <UtensilsCrossed className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              La Ruta del Sabor
            </h1>
            <p className="text-orange-100 mt-4 text-lg font-medium max-w-sm">
              Sistema de gestión integral centralizando el salón, la cocina y la caja.
            </p>
          </div>
          
          <div className="relative z-10 text-orange-200 text-sm font-medium">
            v1.0 &copy; 2026 VERONICA Core System
          </div>
        </div>

        {/* Panel Derecho: Formulario de Login */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white relative z-10">
          <div className="max-w-md w-full mx-auto">
            
            {/* Branding Móvil */}
            <div className="md:hidden flex flex-col items-center text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-2xl mb-4 shadow-lg">
                <UtensilsCrossed className="text-white w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">La Ruta del Sabor</h2>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">¡Hola de nuevo!</h2>
              <p className="text-gray-500 mt-2">Ingresa tus credenciales para continuar.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700" htmlFor="correo">
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                  placeholder="usuario@restaurante.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className={`border-l-4 p-4 rounded-r-xl text-sm font-medium ${error.includes('Error de Red') ? 'bg-red-100 border-red-600 text-red-800' : 'bg-orange-50 border-orange-500 text-orange-800'}`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full flex justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  'Ingresar al sistema'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}