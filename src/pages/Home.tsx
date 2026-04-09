import Layout from "../components/Layout";
import { useAuthStore } from "../stores/authStore";

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();

  return (
    <Layout title="Mi perfil">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* banner */}
          <div className="h-36 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          </div>

          {/* profile info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12 relative z-10">
              {/* avatar */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-white">
                {initial}
              </div>
              {/* name */}
              <div className="flex-1 sm:pb-1">
                <h2 className="text-2xl font-bold text-slate-900">{user?.name || "Usuario"}</h2>
                <p className="text-slate-500 mt-0.5">{user?.email}</p>
              </div>
              {/* role badge */}
              <div className="sm:pb-2">
                <span className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-600">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre</p>
            <p className="text-base font-semibold text-slate-900">{user?.name || "No especificado"}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-600">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Correo</p>
            <p className="text-base font-semibold text-slate-900 break-all">{user?.email}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-violet-600">
                <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Rol</p>
            <p className="text-base font-semibold text-slate-900 uppercase">{user?.role}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
