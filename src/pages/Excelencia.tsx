import { useNavigate } from "react-router-dom";

export default function Excelencia() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      {/* navbar */}
      <header className="bg-sidebar h-16 flex items-center px-6 shadow-lg">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg">Pauser</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver al inicio
          </button>
        </div>
      </header>

      {/* content */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 sm:p-14">
            {/* icon */}
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-8">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-emerald-600">
                <path d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-3">
              Bienvenido a la Autoevaluación Mensual
            </h1>
            <p className="text-slate-500 text-base leading-relaxed mb-10 max-w-md mx-auto">
              Este modulo esta en desarrollo. Pronto podras acceder a las herramientas de autoevaluacion y mejora continua institucional.
            </p>

            {/* status badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-4 py-2 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                En desarrollo
              </span>
              <span className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl">
                Version futura
              </span>
            </div>

            {/* back button */}
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md shadow-brand-600/20 transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
