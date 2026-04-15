import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import type { Program } from "../types";

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal asignar usuarios
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProgram, setAssignProgram] = useState<Program | null>(null);
  const [assignMode, setAssignMode] = useState<"individual" | "mass">("individual");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]); // IDs de usuarios ya asignados
  const [assignFilters, setAssignFilters] = useState({ cargoId: 0, sedeId: 0, unidadId: 0 });
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState("");
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  // Selectores
  const [sedes, setSedes] = useState<{ id: number; name: string }[]>([]);
  const [unidades, setUnidades] = useState<{ id: number; name: string }[]>([]);
  const [cargos, setCargos] = useState<{ id: number; name: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: number; email: string; name: string; cargoId: number | null; sedeId: number | null; unidadId: number | null }[]>([]);

  // Modal preguntas
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [questionsProgram, setQuestionsProgram] = useState<Program | null>(null);
  const [allQuestions, setAllQuestions] = useState<{
    id: number; text: string; description?: string; order: number;
    frequencyType?: string; frequencyDay?: number | null;
    options?: { label: string; score: number }[];
    configs?: { fileType: string; maxFiles: number }[];
    cargos?: { cargo: { id: number; name: string } }[];
  }[]>([]);
  const [assignedQuestionIds, setAssignedQuestionIds] = useState<number[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [questionsMessage, setQuestionsMessage] = useState("");

  useEffect(() => {
    fetchPrograms();
    Promise.all([
      api.get("/references/sedes"),
      api.get("/references/unidades"),
      api.get("/references/cargos"),
      api.get("/users"),
    ]).then(([s, u, c, usr]) => {
      setSedes(s.data);
      setUnidades(u.data);
      setCargos(c.data);
      setAllUsers(usr.data);
    });
  }, []);

  const fetchPrograms = () => {
    api.get("/programs")
      .then(res => {
        setPrograms(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // ==================== CREATE / EDIT ====================
  const openCreate = () => {
    setEditingProgram(null);
    setFormName("");
    setFormDesc("");
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (p: Program) => {
    setEditingProgram(p);
    setFormName(p.name);
    setFormDesc(p.description || "");
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError("El nombre es requerido");
      return;
    }
    setSaving(true);
    try {
      if (editingProgram) {
        await api.put(`/programs/${editingProgram.id}`, { name: formName, description: formDesc });
      } else {
        await api.post("/programs", { name: formName, description: formDesc });
      }
      setShowModal(false);
      fetchPrograms();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setFormError(axiosErr.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // ==================== DELETE ====================
  const openDelete = (p: Program) => {
    setProgramToDelete(p);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!programToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/programs/${programToDelete.id}`);
      setShowDeleteModal(false);
      fetchPrograms();
    } catch {
      alert("Error al eliminar programa");
    } finally {
      setDeleting(false);
    }
  };

  // ==================== ASSIGN USERS ====================
  const openAssign = async (p: Program) => {
    setAssignProgram(p);
    setAssignMode("individual");
    setSelectedUsers([]);
    setAssignFilters({ cargoId: 0, sedeId: 0, unidadId: 0 });
    setAssignResult("");
    setLoadingAssigned(true);
    setShowAssignModal(true);

    // Cargar usuarios ya asignados
    try {
      const res = await api.get(`/programs/${p.id}/users`);
      const assignedIds = res.data.map((u: { id: number }) => u.id);
      setAssignedUserIds(assignedIds);
      setSelectedUsers(assignedIds);
    } catch {
      setAssignedUserIds([]);
    } finally {
      setLoadingAssigned(false);
    }
  };

  const handleAssign = async () => {
    if (!assignProgram) return;
    setAssigning(true);
    setAssignResult("");
    try {
      // Calcular diferencias
      const toAdd = selectedUsers.filter(id => !assignedUserIds.includes(id));
      const toRemove = assignedUserIds.filter(id => !selectedUsers.includes(id));

      let messages: string[] = [];

      // Agregar nuevos usuarios
      if (toAdd.length > 0) {
        await api.post(`/programs/${assignProgram.id}/assign-users`, {
          userIds: toAdd,
        });
        messages.push(`✅ ${toAdd.length} usuario(s) agregados`);
      }

      // Quitar usuarios
      if (toRemove.length > 0) {
        for (const userId of toRemove) {
          await api.delete(`/programs/${assignProgram.id}/users/${userId}`);
        }
        messages.push(`❌ ${toRemove.length} usuario(s) removidos`);
      }

      if (toAdd.length === 0 && toRemove.length === 0) {
        setAssignResult("ℹ️ No hay cambios para guardar");
      } else {
        setAssignResult(messages.join(" | "));
        // Actualizar lista de asignados
        setAssignedUserIds(selectedUsers);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setAssignResult("❌ " + (axiosErr.response?.data?.error || "Error al guardar cambios"));
    } finally {
      setAssigning(false);
    }
  };

  // ==================== QUESTIONS ====================
  const openQuestions = async (p: Program) => {
    setQuestionsProgram(p);
    setQuestionsMessage("");
    setShowQuestionsModal(true);

    try {
      const [qRes, pqRes] = await Promise.all([
        api.get("/questions"),
        api.get(`/programs/${p.id}/questions`),
      ]);
      setAllQuestions(qRes.data);
      setAssignedQuestionIds(pqRes.data.map((q: { id: number }) => q.id));
      setSelectedQuestionIds(pqRes.data.map((q: { id: number }) => q.id));
    } catch {
      setAllQuestions([]);
      setAssignedQuestionIds([]);
    }
  };

  const handleSaveQuestions = async () => {
    if (!questionsProgram) return;
    setSavingQuestions(true);
    setQuestionsMessage("");
    try {
      // Remover las que ya no están seleccionadas
      const toRemove = assignedQuestionIds.filter(id => {
        const isChecked = selectedQuestionIds.includes(id);
        return !isChecked;
      });
      for (const qId of toRemove) {
        await api.delete(`/programs/${questionsProgram.id}/questions/${qId}`);
      }

      // Agregar las nuevas
      const toAdd = selectedQuestionIds.filter(id => !assignedQuestionIds.includes(id));
      if (toAdd.length > 0) {
        await api.post(`/programs/${questionsProgram.id}/assign-questions`, { questionIds: toAdd });
      }

      setQuestionsMessage("✅ Preguntas actualizadas");
      setAssignedQuestionIds(selectedQuestionIds);
      fetchPrograms();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setQuestionsMessage("❌ " + (axiosErr.response?.data?.error || "Error al guardar"));
    } finally {
      setSavingQuestions(false);
    }
  };

  // Filtrar usuarios para modo individual
  const filteredUsers = allUsers.filter(u => {
    if (assignFilters.sedeId && u.sedeId !== assignFilters.sedeId) return false;
    if (assignFilters.unidadId && u.unidadId !== assignFilters.unidadId) return false;
    if (assignFilters.cargoId && u.cargoId !== assignFilters.cargoId) return false;
    return true;
  });

  return (
    <Layout title="Programas de Excelencia">
      <div className="px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Programas de Excelencia</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? "Cargando..." : `${programs.length} programas`}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            + Nuevo programa
          </button>
        </div>

        {/* Grid de programas */}
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : programs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 py-20 text-center">
            <p className="text-slate-500">No hay programas creados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map(p => (
              <div key={p.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${p.isActive ? "border-slate-200/80" : "border-slate-100 opacity-70"}`}>
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                      {p.description && <p className="text-sm text-slate-500 mt-0.5">{p.description}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>{p._count?.users || 0} usuarios</span>
                    <span>{p._count?.questions || 0} preguntas</span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => openAssign(p)} className="flex-1 text-xs text-brand-600 hover:underline py-1">
                      Asignar usuarios
                    </button>
                    <button onClick={() => openQuestions(p)} className="text-xs text-emerald-600 hover:underline py-1">
                      Preguntas
                    </button>
                    <button onClick={() => openEdit(p)} className="text-xs text-slate-500 hover:underline py-1">
                      Editar
                    </button>
                    <button onClick={() => openDelete(p)} className="text-xs text-red-500 hover:underline py-1">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Crear / Editar */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProgram ? "Editar programa" : "Crear programa"}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="WCDP, GALAXIA, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                    rows={3}
                    placeholder="Descripción del programa..."
                  />
                </div>
              </div>

              {formError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{formError}</div>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Eliminar */}
        {showDeleteModal && programToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">Eliminar programa</h3>
                <p className="text-sm text-slate-500 mt-1">
                  ¿Eliminar <span className="font-medium text-slate-700">{programToDelete.name}</span>?
                </p>
                <p className="text-xs text-red-600 mt-2">Esta acción no se puede deshacer.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
                  {deleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Asignar Usuarios */}
        {showAssignModal && assignProgram && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Asignar usuarios a {assignProgram.name}</h3>
                <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {/* Modo de asignación */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAssignMode("individual")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${assignMode === "individual" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setAssignMode("mass")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${assignMode === "mass" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Masivo (filtros)
                </button>
              </div>

              {assignMode === "individual" ? (
                <div className="space-y-2">
                  {/* Filtros para filtrar la lista de usuarios */}
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={assignFilters.sedeId}
                      onChange={e => setAssignFilters({ ...assignFilters, sedeId: parseInt(e.target.value) })}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value={0}>Todas las sedes</option>
                      {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select
                      value={assignFilters.unidadId}
                      onChange={e => setAssignFilters({ ...assignFilters, unidadId: parseInt(e.target.value) })}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value={0}>Todas las unidades</option>
                      {unidades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <select
                      value={assignFilters.cargoId}
                      onChange={e => setAssignFilters({ ...assignFilters, cargoId: parseInt(e.target.value) })}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value={0}>Todos los cargos</option>
                      {cargos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Leyenda */}
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-500 rounded inline-block"></span>
                      Ya asignado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-slate-200 rounded inline-block"></span>
                      Disponible
                    </span>
                  </div>

                  {/* Lista de usuarios con checkboxes */}
                  {loadingAssigned ? (
                    <div className="text-center py-4 text-slate-500">Cargando usuarios asignados...</div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                      {filteredUsers.map(u => {
                        const isAssigned = assignedUserIds.includes(u.id);
                        const isSelected = selectedUsers.includes(u.id);

                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-3 px-3 py-2 border-b border-slate-50 last:border-b-0 cursor-pointer transition-colors ${
                              isAssigned
                                ? "bg-green-50 hover:bg-green-100"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                                else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                              }}
                              className="rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-700 flex-1">{u.name || u.email}</span>
                            {isAssigned && (
                              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                ✓ Asignado
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Resumen de cambios */}
                  {(() => {
                    const toAdd = selectedUsers.filter(id => !assignedUserIds.includes(id)).length;
                    const toRemove = assignedUserIds.filter(id => !selectedUsers.includes(id)).length;
                    return (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <p className="font-medium mb-1">Resumen de cambios al guardar:</p>
                        <p className="text-green-600">➕ Agregar: {toAdd} usuario(s)</p>
                        <p className="text-red-600">➖ Quitar: {toRemove} usuario(s)</p>
                        <p className="text-slate-500 mt-1">Total después de guardar: {selectedUsers.length} usuario(s)</p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">Selecciona los filtros para asignar automáticamente a todos los usuarios que coincidan:</p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sede</label>
                    <select value={assignFilters.sedeId} onChange={e => setAssignFilters({ ...assignFilters, sedeId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                      <option value={0}>Seleccionar</option>
                      {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de negocio</label>
                    <select value={assignFilters.unidadId} onChange={e => setAssignFilters({ ...assignFilters, unidadId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                      <option value={0}>Seleccionar</option>
                      {unidades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                    <select value={assignFilters.cargoId} onChange={e => setAssignFilters({ ...assignFilters, cargoId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                      <option value={0}>Seleccionar</option>
                      {cargos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {assignResult && (
                <div className={`text-sm p-3 rounded-lg ${assignResult.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {assignResult}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowAssignModal(false); fetchPrograms(); }} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cerrar</button>
                <button onClick={handleAssign} disabled={assigning} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">
                  {assigning ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Gestionar Preguntas */}
        {showQuestionsModal && questionsProgram && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Preguntas de {questionsProgram.name}</h3>
                <button onClick={() => setShowQuestionsModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <p className="text-sm text-slate-500">Selecciona las preguntas que pertenecen a este programa:</p>

              {/* Lista de preguntas con checkboxes */}
              <div className="border border-slate-200 rounded-lg max-h-[28rem] overflow-y-auto">
                {allQuestions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">No hay preguntas creadas</div>
                ) : (
                  allQuestions
                    .sort((a, b) => a.order - b.order)
                    .map((q, i) => {
                      const freqLabels: Record<string, string> = {
                        UNICA: "",
                        DIARIA: "📅 Diaria",
                        SEMANAL: "📆 Semanal",
                        MENSUAL: "🗓️ Mensual",
                        ANUAL: "📋 Anual",
                        DIA_ESPECIFICO: `📅 Día ${q.frequencyDay || 1}`,
                      };
                      const freqLabel = freqLabels[q.frequencyType || "UNICA"] || "";

                      return (
                        <label key={q.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedQuestionIds.includes(q.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                              else setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id));
                            }}
                            className="mt-1 rounded border-slate-300 shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-medium text-slate-800">{i + 1}. {q.text}</p>
                            {q.description && <p className="text-xs text-slate-500">{q.description}</p>}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              {q.options && q.options.length > 0 && (
                                <span>Opciones: {q.options.map(o => `${o.label}=${o.score}pts`).join(", ")}</span>
                              )}
                              {q.configs && q.configs.length > 0 && (
                                <span>Archivos: {q.configs.map(c => `${c.fileType} (${c.maxFiles})`).join(", ")}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              {freqLabel && <span className="text-xs text-brand-600">{freqLabel}</span>}
                              {q.cargos && q.cargos.length > 0 && (
                                <span className="text-xs text-slate-400">Cargos: {q.cargos.map(c => c.cargo.name).join(", ")}</span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })
                )}
              </div>
              <p className="text-xs text-slate-400">{selectedQuestionIds.length} pregunta(s) seleccionada(s)</p>

              {questionsMessage && (
                <div className={`text-sm p-3 rounded-lg ${questionsMessage.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {questionsMessage}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowQuestionsModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Cerrar</button>
                <button onClick={handleSaveQuestions} disabled={savingQuestions} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">
                  {savingQuestions ? "Guardando..." : "Guardar selección"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
