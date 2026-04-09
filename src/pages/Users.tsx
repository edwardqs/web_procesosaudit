import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import type { User } from "../types";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User[]>("/users")
      .then((r) => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Usuarios">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestion de usuarios</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? "Cargando..." : `${users.length} usuarios registrados en el sistema`}
            </p>
          </div>
        </div>

        {/* table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded-lg bg-slate-100 animate-pulse" />
                    <div className="h-3 w-1/4 rounded-lg bg-slate-50 animate-pulse" />
                  </div>
                  <div className="h-7 w-16 rounded-full bg-slate-100 animate-pulse" />
                  <div className="h-4 w-24 rounded-lg bg-slate-50 animate-pulse hidden sm:block" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} className="w-8 h-8 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-600">No hay usuarios</p>
              <p className="text-sm text-slate-400 mt-1">Los usuarios apareceran aqui cuando se registren</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Usuario</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Rol</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden sm:table-cell">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${i < users.length - 1 ? "border-b border-slate-100" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                            {(u.name || u.email)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{u.name || "-"}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-brand-50 text-brand-700 border border-brand-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.role === "admin" ? "bg-brand-500" : "bg-slate-400"}`} />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
