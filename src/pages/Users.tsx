import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

interface Role { id: number; name: string; }
interface Sede { id: number; name: string; }
interface UnidadNegocio { id: number; name: string; }
interface Cargo { id: number; name: string; }

interface UserData {
  id: number;
  email: string;
  name: string;
  roleId: number;
  roleName?: string;
  createdAt: string;
  sede?: { id: number; name: string };
  unidadNegocio?: { id: number; name: string };
  cargo?: { id: number; name: string };
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ roleId: 0, sedeId: 0, unidadId: 0, cargoId: 0 });
  const [filters, setFilters] = useState({ sedeId: 0, unidadId: 0, cargoId: 0 });

  useEffect(() => {
    Promise.all([
      api.get("/users/roles"),
      api.get("/references/sedes"),
      api.get("/references/unidades"),
      api.get("/references/cargos"),
    ]).then(([rolesRes, sedesRes, unidadesRes, cargosRes]) => {
      setRoles(rolesRes.data);
      setSedes(sedesRes.data);
      setUnidades(unidadesRes.data);
      setCargos(cargosRes.data);
    });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = () => {
    const params = new URLSearchParams();
    if (filters.sedeId) params.append("sedeId", filters.sedeId.toString());
    if (filters.unidadId) params.append("unidadId", filters.unidadId.toString());
    if (filters.cargoId) params.append("cargoId", filters.cargoId.toString());

    api.get(`/users?${params}`).then((res) => {
      const mapped = (res.data as any[]).map((u: any) => ({
        ...u,
        roleId: u.role?.id,
        roleName: u.role?.name,
      }));
      setUsers(mapped);
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  const startEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditForm({
      roleId: user.roleId,
      sedeId: user.sede?.id || 0,
      unidadId: user.unidadNegocio?.id || 0,
      cargoId: user.cargo?.id || 0,
    });
  };

  const handleSave = async (userId: number) => {
    setSaving(userId);
    try {
      const res = await api.put(`/users/${userId}/role`, { roleId: editForm.roleId, sedeId: editForm.sedeId, unidadId: editForm.unidadId, cargoId: editForm.cargoId });
      const updated = res.data;
      setUsers(users.map(u => u.id === userId ? {
        ...u,
        roleId: updated.role?.id || editForm.roleId,
        roleName: updated.role?.name,
        sede: updated.sede,
        unidadNegocio: updated.unidadNegocio,
        cargo: updated.cargo,
      } : u));
      setEditingId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Layout title="Usuarios">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestión de usuarios</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? "Cargando..." : `${users.length} usuarios`}
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select value={filters.sedeId} onChange={(e) => setFilters({ ...filters, sedeId: parseInt(e.target.value) })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value={0}>Todas las sedes</option>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filters.unidadId} onChange={(e) => setFilters({ ...filters, unidadId: parseInt(e.target.value) })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value={0}>Todas las unidades</option>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {(filters.sedeId || filters.unidadId) && (
            <button onClick={() => setFilters({ sedeId: 0, unidadId: 0, cargoId: 0 })} className="text-sm text-slate-500 hover:text-slate-700">
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-500">No hay usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Sede</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Unidad</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Cargo</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className={`hover:bg-slate-50 ${i < users.length - 1 ? "border-b border-slate-100" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
                            {(u.name || u.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{u.name || "-"}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <select value={editForm.sedeId} onChange={(e) => setEditForm({ ...editForm, sedeId: parseInt(e.target.value) })} className="text-sm border rounded px-2 py-1">
                            <option value={0}>Seleccionar</option>
                            {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-600">{u.sede?.name || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <select value={editForm.unidadId} onChange={(e) => setEditForm({ ...editForm, unidadId: parseInt(e.target.value) })} className="text-sm border rounded px-2 py-1">
                            <option value={0}>Seleccionar</option>
                            {unidades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-600">{u.unidadNegocio?.name || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <select value={editForm.cargoId} onChange={(e) => setEditForm({ ...editForm, cargoId: parseInt(e.target.value) })} className="text-sm border rounded px-2 py-1">
                            <option value={0}>Seleccionar</option>
                            {cargos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-600">{u.cargo?.name || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <select value={editForm.roleId} onChange={(e) => setEditForm({ ...editForm, roleId: parseInt(e.target.value) })} className="text-sm border rounded px-2 py-1">
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${u.roleId === 1 ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                            {u.roleName || "user"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleSave(u.id)} disabled={saving === u.id} className="text-xs text-brand-600 hover:underline">
                              {saving === u.id ? "Guardando..." : "Guardar"}
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:underline">Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(u)} className="text-sm text-brand-600 hover:underline">Editar</button>
                        )}
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