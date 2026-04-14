import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

interface Role { id: number; name: string; }
interface Sede { id: number; name: string; }
interface UnidadNegocio { id: number; name: string; }
interface Cargo { id: number; name: string; }
interface Program { id: number; name: string; description?: string; isActive: boolean; assignedAt?: string; }

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

interface UserForm {
  email: string;
  password: string;
  name: string;
  roleId: number;
  sedeId: number | null;
  unidadId: number | null;
  cargoId: number | null;
}

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de crear
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<UserForm>({
    email: "",
    password: "",
    name: "",
    roleId: 2,
    sedeId: null,
    unidadId: null,
    cargoId: null,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Modal de editar
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UserForm>({
    email: "",
    password: "",
    name: "",
    roleId: 2,
    sedeId: null,
    unidadId: null,
    cargoId: null,
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Modal de eliminar
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  // Modal de gestión de programas
  const [showProgramsModal, setShowProgramsModal] = useState(false);
  const [programsUserId, setProgramsUserId] = useState<number | null>(null);
  const [programsUserName, setProgramsUserName] = useState("");
  const [assignedPrograms, setAssignedPrograms] = useState<Program[]>([]);
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [savingPrograms, setSavingPrograms] = useState(false);

  // Filtros
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

  // ==================== CREATE ====================
  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateForm({ email: "", password: "", name: "", roleId: 2, sedeId: null, unidadId: null, cargoId: null });
    setCreateError("");
  };

  const handleCreate = async () => {
    if (!createForm.email || !createForm.password) {
      setCreateError("Email y contraseña son requeridos");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const res = await api.post("/users", createForm);
      const data = res.data;
      const newUser = data.user;
      
      setUsers(prev => [...prev, { 
        ...newUser, 
        roleName: newUser.roleName || "user" 
      }]);
      
      setShowCreateModal(false);
      setCreateForm({ email: "", password: "", name: "", roleId: 2, sedeId: null, unidadId: null, cargoId: null });
    } catch (err: any) {
      console.error("Error al crear usuario:", err);
      const errorMsg = err.response?.data?.error || "Error al crear usuario";
      setCreateError(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  // ==================== EDIT ====================
  const startEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditForm({
      email: user.email,
      password: "",
      name: user.name || "",
      roleId: user.roleId,
      sedeId: user.sede?.id || null,
      unidadId: user.unidadNegocio?.id || null,
      cargoId: user.cargo?.id || null,
    });
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    setEditError("");
    try {
      const updateData: any = {
        name: editForm.name,
        roleId: editForm.roleId,
        sedeId: editForm.sedeId,
        unidadId: editForm.unidadId,
        cargoId: editForm.cargoId,
      };
      if (editForm.email) updateData.email = editForm.email;
      if (editForm.password) updateData.password = editForm.password;

      const res = await api.put(`/users/${editingId}`, updateData);
      const updated = res.data.user;
      setUsers(users.map(u => u.id === editingId ? {
        ...u,
        email: updated.email,
        name: updated.name,
        roleId: updated.roleId,
        roleName: updated.roleName || u.roleName,
        sede: updated.sede,
        unidadNegocio: updated.unidadNegocio,
        cargo: updated.cargo,
      } : u));
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.response?.data?.error || "Error al actualizar usuario");
    } finally {
      setSaving(false);
    }
  };

  // ==================== DELETE ====================
  const openDeleteModal = (user: UserData) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // ==================== PROGRAMAS ====================
  const openProgramsModal = async (user: UserData) => {
    setProgramsUserId(user.id);
    setProgramsUserName(user.name || user.email);
    setShowProgramsModal(true);
    setProgramsLoading(true);

    try {
      const res = await api.get(`/users/${user.id}/programs`);
      setAssignedPrograms(res.data.assigned || []);
      setAvailablePrograms(res.data.available || []);
      setSelectedProgramIds((res.data.assigned || []).map((p: Program) => p.id));
    } catch (err) {
      console.error("Error al obtener programas:", err);
    } finally {
      setProgramsLoading(false);
    }
  };

  const toggleProgram = (programId: number) => {
    setSelectedProgramIds(prev =>
      prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
  };

  const handleSavePrograms = async () => {
    if (!programsUserId) return;
    setSavingPrograms(true);
    try {
      const res = await api.post(`/users/${programsUserId}/programs`, {
        programIds: selectedProgramIds,
      });
      
      // Actualizar lista de programas asignados
      setAssignedPrograms(res.data.programs || []);
      
      setShowProgramsModal(false);
      setProgramsUserId(null);
    } catch (err: any) {
      console.error("Error al guardar programas:", err);
      alert(err.response?.data?.error || "Error al guardar programas");
    } finally {
      setSavingPrograms(false);
    }
  };

  return (
    <Layout title="Usuarios">
      <div className="px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestión de usuarios</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? "Cargando..." : `${users.length} usuarios`}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            + Nuevo usuario
          </button>
        </div>

        {/* Filtros */}
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

        {/* Tabla de usuarios */}
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
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Programas</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className={`hover:bg-slate-50 ${i < users.length - 1 ? "border-b border-slate-100" : ""}`}>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              placeholder="Nombre"
                              className="text-sm border rounded px-2 py-1 w-full"
                            />
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              placeholder="Email"
                              className="text-sm border rounded px-2 py-1 w-full"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
                              {(u.name || u.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{u.name || "-"}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <select value={editForm.sedeId || 0} onChange={(e) => setEditForm({ ...editForm, sedeId: e.target.value ? parseInt(e.target.value) : null })} className="text-sm border rounded px-2 py-1">
                            <option value={0}>Seleccionar</option>
                            {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-600">{u.sede?.name || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <select value={editForm.unidadId || 0} onChange={(e) => setEditForm({ ...editForm, unidadId: e.target.value ? parseInt(e.target.value) : null })} className="text-sm border rounded px-2 py-1">
                            <option value={0}>Seleccionar</option>
                            {unidades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-600">{u.unidadNegocio?.name || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === u.id ? (
                          <select value={editForm.cargoId || 0} onChange={(e) => setEditForm({ ...editForm, cargoId: e.target.value ? parseInt(e.target.value) : null })} className="text-sm border rounded px-2 py-1">
                            <option value={0}>Seleccionar</option>
                            {cargos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-600">{u.cargo?.name || "-"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openProgramsModal(u)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Gestionar →
                        </button>
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
                            <button onClick={handleSave} disabled={saving} className="text-xs text-brand-600 hover:underline">
                              {saving ? "Guardando..." : "Guardar"}
                            </button>
                            <button onClick={cancelEdit} className="text-xs text-slate-500 hover:underline">Cancelar</button>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button onClick={() => startEdit(u)} className="text-sm text-brand-600 hover:underline">Editar</button>
                            <button onClick={() => openDeleteModal(u)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {editError && (
                <div className="px-4 py-3 bg-red-50 border-t border-red-200 text-red-600 text-sm">
                  {editError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Crear Usuario */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Crear nuevo usuario</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="Nombre completo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                  <select
                    value={createForm.roleId}
                    onChange={(e) => setCreateForm({ ...createForm, roleId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sede</label>
                  <select
                    value={createForm.sedeId || 0}
                    onChange={(e) => setCreateForm({ ...createForm, sedeId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value={0}>Seleccionar</option>
                    {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de negocio</label>
                  <select
                    value={createForm.unidadId || 0}
                    onChange={(e) => setCreateForm({ ...createForm, unidadId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value={0}>Seleccionar</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                  <select
                    value={createForm.cargoId || 0}
                    onChange={(e) => setCreateForm({ ...createForm, cargoId: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value={0}>Seleccionar</option>
                    {cargos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {createError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  {creating ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmar Eliminación */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">Eliminar usuario</h3>
                <p className="text-sm text-slate-500 mt-1">
                  ¿Estás seguro de que deseas eliminar a <span className="font-medium text-slate-700">{userToDelete.name || userToDelete.email}</span>?
                </p>
                <p className="text-xs text-red-600 mt-2">
                  Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingId !== null}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId !== null ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Gestión de Programas */}
        {showProgramsModal && programsUserId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gestionar Programas</h3>
                  <p className="text-sm text-slate-500">Usuario: <span className="font-medium">{programsUserName}</span></p>
                </div>
                <button
                  onClick={() => setShowProgramsModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {programsLoading ? (
                <div className="text-center py-8 text-slate-500">Cargando programas...</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Programas asignados */}
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Programas asignados ({selectedProgramIds.length})
                    </p>
                    {selectedProgramIds.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No hay programas asignados</p>
                    ) : (
                      <div className="space-y-1">
                        {[...assignedPrograms, ...availablePrograms.filter(p => selectedProgramIds.includes(p.id))]
                          .filter(p => selectedProgramIds.includes(p.id))
                          .map(program => (
                            <label
                              key={program.id}
                              className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100"
                            >
                              <input
                                type="checkbox"
                                checked={selectedProgramIds.includes(program.id)}
                                onChange={() => toggleProgram(program.id)}
                                className="w-4 h-4 text-brand-600 rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">{program.name}</p>
                                {program.description && (
                                  <p className="text-xs text-slate-500">{program.description}</p>
                                )}
                              </div>
                              <span className="text-xs text-green-600 font-medium">✓ Asignado</span>
                            </label>
                          ))
                        }
                      </div>
                    )}
                  </div>

                  {/* Programas disponibles */}
                  {availablePrograms.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Programas disponibles</p>
                      <div className="space-y-1">
                        {availablePrograms
                          .filter(p => !selectedProgramIds.includes(p.id))
                          .map(program => (
                            <label
                              key={program.id}
                              className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100"
                            >
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => toggleProgram(program.id)}
                                className="w-4 h-4 text-brand-600 rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">{program.name}</p>
                                {program.description && (
                                  <p className="text-xs text-slate-500">{program.description}</p>
                                )}
                              </div>
                            </label>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setShowProgramsModal(false)}
                  disabled={savingPrograms}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePrograms}
                  disabled={savingPrograms}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  {savingPrograms ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
