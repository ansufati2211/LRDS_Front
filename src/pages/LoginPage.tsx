import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, Eye, EyeOff, Loader2,
  ArrowRight, ShieldCheck, AlertTriangle, WifiOff
} from 'lucide-react';
import { login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';



export default function LoginPage() {
  const navigate = useNavigate();
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
      const data = await login({ correo, password });
      setAuth(data);

      const rol = data.rol;
      switch (rol) {
        case 'ROLE_COCINA':
          navigate('/kds');
          break;
        case 'ROLE_MOZO':
          navigate('/mozo');
          break;
        case 'ROLE_CAJERO':
          navigate('/cajero');
          break;
        case 'ROLE_GERENTE_SEDE':
        case 'ROLE_ADMIN_EMPRESA':
        case 'ROLE_SUPER_ADMIN':
          navigate('/dashboard');
          break;
        default:
          // Como fallback, para cualquier rol no manejado explícitamente
          navigate('/login');
          break;
      }

    } catch (err: any) {
      console.error("🕵️‍♂️ ERROR DETECTADO EN LOGIN:", err);

      if (err.message === "Network Error") {
        setError("Error de red: el backend no responde. Verifica la conexión.");
      } else {
        setError(err.response?.data?.message || 'Error desconocido al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isNetworkError = error.toLowerCase().includes('red');

  return (
    <div className="min-h-screen w-full bg-[#05070d] relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .font-display { font-family: 'Manrope', sans-serif; }
        .font-ui { font-family: 'Inter', sans-serif; }
        .font-data { font-family: 'JetBrains Mono', monospace; }

        .dot-grid {
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.05); }
        }
        @keyframes drift-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-24px, 24px) scale(1.08); }
        }
        .glow-a { animation: drift 18s ease-in-out infinite; }
        .glow-b { animation: drift-slow 22s ease-in-out infinite; }

        @keyframes card-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticket-in {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .anim-card-in {
          animation: card-in 0.5s ease-out both;
        }
        .anim-ticket-in {
          animation: ticket-in 0.5s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .glow-a, .glow-b, .anim-card-in, .anim-ticket-in {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Ambiente: glows + textura */}
      <div className="absolute inset-0 dot-grid pointer-events-none opacity-40" />
      <div className="glow-a absolute top-[-10%] left-[5%] w-[420px] h-[420px] bg-orange-500/[0.10] rounded-full blur-[100px] pointer-events-none" />
      <div className="glow-b absolute bottom-[-15%] right-[10%] w-[480px] h-[480px] bg-sky-500/[0.06] rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">

        {/* PANEL IZQUIERDO — vista previa del panel operativo (signature element) */}
        <div className="hidden lg:flex flex-col justify-between p-14 xl:p-20 border-r border-white/[0.06]">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/20">
                <UtensilsCrossed className="text-white w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="font-display font-extrabold text-white text-lg tracking-tight">
                La Ruta del Sabor
              </span>
            </div>

            <span className="font-data text-[11px] tracking-[0.25em] text-orange-400/80 uppercase">
              Acceso interno
            </span>
            <h1 className="font-display font-extrabold text-white text-[2.75rem] xl:text-5xl leading-[1.05] tracking-tight mt-4 max-w-lg">
              Un panel para toda la operación.
            </h1>
            <p className="font-ui text-slate-400 text-base mt-5 max-w-sm leading-relaxed">
              Gestiona pedidos, cocina, inventario y caja desde un mismo lugar, en tiempo real.
            </p>
          </div>


          <p className="font-data text-[11px] text-slate-600 tracking-wide">
            VERONICA Core System · v1.0 &copy; 2026
          </p>
        </div>

        {/* PANEL DERECHO — formulario */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="anim-card-in w-full max-w-md">
            {/* Branding móvil */}
            <div className="lg:hidden flex flex-col items-center text-center mb-10">
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-3 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
                <UtensilsCrossed className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <h2 className="font-display font-extrabold text-white text-xl tracking-tight">La Ruta del Sabor</h2>
              <span className="font-data text-[10px] tracking-[0.2em] text-orange-400/80 uppercase mt-1">Acceso interno</span>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 sm:p-10 backdrop-blur-xl shadow-2xl shadow-black/40">

              <div className="mb-8">
                <div className="hidden lg:flex items-center gap-2 mb-6">
                  <ShieldCheck size={14} className="text-orange-400" />
                  <span className="font-data text-[10px] tracking-[0.2em] text-slate-500 uppercase">Veronica OS</span>
                </div>
                <h2 className="font-display font-extrabold text-white text-2xl sm:text-3xl tracking-tight">
                  Inicia sesión
                </h2>
                <p className="font-ui text-slate-400 text-sm mt-2">
                  Ingresa tus credenciales para acceder al sistema.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <label className="block font-ui text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="correo">
                    Correo corporativo
                  </label>
                  <input
                    id="correo"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="font-ui w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus:border-orange-500/50 focus:bg-white/[0.06] transition-all duration-200 disabled:opacity-50"
                    placeholder="usuario@restaurante.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-ui text-xs font-semibold text-slate-300 uppercase tracking-wide" htmlFor="password">
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
                      className="font-ui w-full pl-4 pr-12 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus:border-orange-500/50 focus:bg-white/[0.06] transition-all duration-200 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-orange-400 transition-colors focus:outline-none focus-visible:text-orange-400"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className={`flex items-start gap-3 border rounded-2xl px-4 py-3.5 font-ui text-sm ${
                      isNetworkError
                        ? 'bg-red-500/[0.08] border-red-500/20 text-red-300'
                        : 'bg-amber-500/[0.08] border-amber-500/20 text-amber-300'
                    }`}
                  >
                    {isNetworkError ? <WifiOff size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 w-full flex justify-center items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-ui font-semibold py-3.5 px-4 rounded-2xl transition-all duration-200 shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      Ingresar al sistema
                      <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="text-center font-ui text-xs text-slate-600 mt-6">
              ¿No puedes ingresar? Contacta a soporte interno de TI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}