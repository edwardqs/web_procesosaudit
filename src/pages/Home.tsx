import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";

interface Sede { id: number; name: string; }
interface UnidadNegocio { id: number; name: string; }
interface Cargo { id: number; name: string; }

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const setUser = useAuthStore((s) => s.setUser);
  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ sedeId: 0, unidadId: 0, cargoId: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/references/sedes"),
      api.get("/references/unidades"),
      api.get("/references/cargos"),
    ]).then(([s, u, c]) => {
      setSedes(s.data);
      setUnidades(u.data);
      setCargos(c.data);
    });

    if (user) {
      setForm({
        sedeId: (user as any)?.sede?.id || 0,
        unidadId: (user as any)?.unidadNegocio?.id || 0,
        cargoId: (user as any)?.cargo?.id || 0,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/users/profile", form);
      setUser(res.data);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Mi perfil">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="h-36 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          </div>

          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12 relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-white">
                {initial}
              </div>
              <div className="flex-1 sm:pb-1">
                <h2 className="text-2xl font-bold text-slate-900">{user?.name || "Usuario"}</h2>
                <p className="text-slate-500 mt-0.5">{user?.email}</p>
              </div>
              <div className="sm:pb-2">
                <span className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                  {user?.roleName || (user?.roleId === 1 ? "admin" : "user")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-blue-600">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre</p>
            <p className="text-base font-semibold text-slate-900">{user?.name || "No especificado"}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-emerald-600">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Correo</p>
            <p className="text-base font-semibold text-slate-900 break-all">{user?.email}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-violet-600">
                <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Rol</p>
            <p className="text-base font-semibold text-slate-900 uppercase">{user?.roleName || (user?.roleId === 1 ? "admin" : "user")}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Información Organizacional</h3>
            {isAdmin && !editing && (
              <button onClick={() => setEditing(true)} className="text-sm text-brand-600 hover:text-brand-700">
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sede</label>
                <select
                  value={form.sedeId}
                  onChange={(e) => setForm({ ...form, sedeId: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value={0}>Seleccionar sede</option>
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de Negocio</label>
                <select
                  value={form.unidadId}
                  onChange={(e) => setForm({ ...form, unidadId: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value={0}>Seleccionar unidad</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                <select
                  value={form.cargoId}
                  onChange={(e) => setForm({ ...form, cargoId: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value={0}>Seleccionar cargo</option>
                  {cargos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Sede</p>
                <p className="text-base font-semibold text-slate-900">{(user as any)?.sede?.name || "No asignado"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Unidad de Negocio</p>
                <p className="text-base font-semibold text-slate-900">{(user as any)?.unidadNegocio?.name || "No asignado"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Cargo</p>
                <p className="text-base font-semibold text-slate-900">{(user as any)?.cargo?.name || "No asignado"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}