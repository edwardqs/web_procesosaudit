import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import pauserLogo from "../assets/pauser_logo_procesos-removebg-preview.png";

export default function Landing() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const handleSistemaClick = () => {
    if (isAuthenticated) {
      navigate(user?.roleId === 1 ? "/dashboard" : "/home");
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
              <div className="mb-6 h-24 w-24 flex items-center justify-center bg-brand-50 rounded-2xl group-hover:bg-brand-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-brand-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
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
              <div className="mb-6 h-24 w-24 flex items-center justify-center bg-emerald-50 rounded-2xl group-hover:bg-emerald-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                </svg>
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