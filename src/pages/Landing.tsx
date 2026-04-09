import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import pauserLogo from "../assets/pauser_logo_procesos-removebg-preview.png";

export default function Landing() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const handleSistemaClick = () => {
    if (isAuthenticated) {
      navigate(user?.role === "admin" ? "/dashboard" : "/home");
    } else {
      navigate("/login");
    }
  };

  const handleExcelenciaClick = () => {
    navigate("/excelencia");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      {/* navbar */}
      <header className="bg-sidebar h-16 flex items-center px-6 shadow-lg">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-3">
          <img src={pauserLogo} alt="Pauser" className="h-14 w-auto" />
        </div>
      </header>

      {/* content */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="max-w-4xl w-full">
          {/* cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sistema de Auditoria */}
            <button
              onClick={handleSistemaClick}
              className="group bg-white rounded-2xl border-2 border-slate-200 p-8 text-left transition-all hover:border-brand-400 hover:shadow-xl hover:shadow-brand-600/10 hover:-translate-y-1"
            >
              <div className="mb-6">
                <img src={pauserLogo} alt="Sistema" className="h-32 w-auto" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Acceder al Sistema
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Gestiona usuarios, procesos y auditorias del sistema.
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-600 group-hover:gap-3 transition-all">
                <span>Ingresar</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </button>

            {/* Programa de Excelencia */}
            <button
              onClick={handleExcelenciaClick}
              className="group bg-white rounded-2xl border-2 border-slate-200 p-8 text-left transition-all hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-600/10 hover:-translate-y-1"
            >
              <div className="mb-6">
                <img src={pauserLogo} alt="Excelencia" className="h-32 w-auto" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Programa de Excelencia
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Accede al programa de excelencia y autoevaluacion institucional.
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 group-hover:gap-3 transition-all">
                <span>Ingresar</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-slate-400">Pauser v1.0</p>
      </footer>
    </div>
  );
}