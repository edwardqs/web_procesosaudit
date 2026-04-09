import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";
import type { User } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    api.get<User[]>("/users")
      .then((r) => setUserCount(r.data.length))
      .catch(() => setUserCount(0));
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* welcome */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-brand-600/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="relative z-10">
            <p className="text-brand-100 text-sm font-medium mb-1">Bienvenido de vuelta</p>
            <h2 className="text-2xl font-bold">{me?.name || me?.email}</h2>
            <p className="text-white/60 text-sm mt-2">Resumen general del sistema de auditoria</p>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* usuarios */}
          <div
            onClick={() => navigate("/usuarios")}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-blue-600">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Usuarios</p>
            {userCount === null ? (
              <div className="h-10 w-16 rounded-xl bg-slate-100 animate-pulse" />
            ) : (
              <p className="text-4xl font-bold text-slate-900">{userCount}</p>
            )}
            <p className="text-xs text-slate-400 mt-2">Ver todos &rarr;</p>
          </div>

          {/* procesos */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-emerald-600">
                  <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Procesos</p>
            <p className="text-4xl font-bold text-slate-900">0</p>
            <p className="text-xs text-slate-400 mt-2">Proximamente</p>
          </div>

          {/* auditorias */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-violet-600">
                  <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Auditorias</p>
            <p className="text-4xl font-bold text-slate-900">0</p>
            <p className="text-xs text-slate-400 mt-2">Proximamente</p>
          </div>
        </div>

        {/* quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Acciones rapidas</h3>
          </div>
          <div className="p-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/usuarios")}
              className="inline-flex items-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-md shadow-brand-600/20 transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Gestionar usuarios
            </button>
            <button
              disabled
              className="inline-flex items-center gap-2.5 bg-slate-100 text-slate-400 px-5 py-3 rounded-xl text-sm font-semibold cursor-not-allowed"
            >
              Procesos (pronto)
            </button>
            <button
              disabled
              className="inline-flex items-center gap-2.5 bg-slate-100 text-slate-400 px-5 py-3 rounded-xl text-sm font-semibold cursor-not-allowed"
            >
              Auditorias (pronto)
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
