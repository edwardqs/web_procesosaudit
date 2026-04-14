import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface QuestionConfig {
  id: number;
  fileType: string;
  maxFiles: number;
}

interface QuestionCargo {
  cargo: { id: number; name: string };
}

interface Question {
  id: number;
  text: string;
  description?: string;
  frequencyType?: string;
  frequencyDay?: number | null;
  frequencyInterval?: number | null;
  order: number;
  isActive: boolean;
  configs: QuestionConfig[];
  cargos?: QuestionCargo[];
  options?: QuestionOption[];
}

interface QuestionOption {
  id: number;
  label: string;
  text: string;
  score: number;
  isDefault: boolean;
}

interface CampaignUser {
  user: { id: number; email: string; name: string };
}

interface Campaign {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  assignedUsers: CampaignUser[];
  stats?: { totalAssigned: number; completed: number; pending: number };
  evaluations?: any[];
  pendingUsers?: { id: number; email: string; name: string }[];
}

interface Result {
  id: number;
  totalScore: number;
  maxScore: number;
  completedAt: string;
  user: { id: number; name: string; email: string };
}

interface User {
  id: number;
  email: string;
  name: string;
  role?: { name: string };
  sede?: { id: number; name: string };
  unidadNegocio?: { id: number; name: string };
  cargo?: { id: number; name: string };
}

interface Sede { id: number; name: string; }
interface UnidadNegocio { id: number; name: string; }
interface Cargo { id: number; name: string; }

const FILE_TYPES = [
  { value: "IMAGEN", label: "Imagen" },
  { value: "PDF", label: "PDF" },
  { value: "PPT", label: "PowerPoint" },
  { value: "EXCEL", label: "Excel" },
  { value: "IN_SITU", label: "IN SITU (Revisión presencial)" },
];

export default function ExcelenciaAdmin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "campaigns" | "progress" | "results">("questions");
  const [progressData, setProgressData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({ text: "", description: "", order: 0, configs: [] as any[], cargoIds: [] as number[], frequencyType: "UNICA" as string, frequencyDay: null as number | null, frequencyInterval: null as number | null, options: [] as Array<{ label: string; text: string; score: number }> });
  const [campaignForm, setCampaignForm] = useState({ name: "", startDate: "", endDate: "", assignedUserIds: [] as number[] });
  const [filters, setFilters] = useState({ sedeId: 0, unidadId: 0, cargoId: 0 });
  const [activeFormTab, setActiveFormTab] = useState<"general" | "options" | "files" | "cargos">("general");

  useEffect(() => {
    if (activeTab === "questions") {
      fetchQuestions();
      if (cargos.length === 0) fetchReferences();
    } else if (activeTab === "campaigns") {
      fetchCampaigns();
      fetchUsers();
      fetchReferences();
    } else if (activeTab === "progress") {
      fetchProgress();
    } else {
      fetchResults();
    }
  }, [activeTab]);

  const fetchProgress = async () => {
    try {
      const res = await api.get("/evaluations/progress");
      setProgressData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "campaigns") {
      fetchUsers();
    }
  }, [filters]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get("/questions");
      setQuestions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await api.get("/campaigns");
      setCampaigns(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.sedeId) params.append("sedeId", filters.sedeId.toString());
      if (filters.unidadId) params.append("unidadId", filters.unidadId.toString());
      if (filters.cargoId) params.append("cargoId", filters.cargoId.toString());
      const res = await api.get(`/users?${params}`);
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchReferences = async () => {
    try {
      const [sedesRes, unidadesRes, cargosRes] = await Promise.all([
        api.get("/references/sedes"),
        api.get("/references/unidades"),
        api.get("/references/cargos"),
      ]);
      setSedes(sedesRes.data);
      setUnidades(unidadesRes.data);
      setCargos(cargosRes.data);
    } catch (err) { console.error(err); }
  };

  const fetchResults = async () => {
    try {
      const res = await api.get("/evaluations/results");
      setResults(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addConfig = () => setFormData({ ...formData, configs: [...formData.configs, { fileType: "IMAGEN", maxFiles: 1 }] });
  const removeConfig = (index: number) => setFormData({ ...formData, configs: formData.configs.filter((_, i) => i !== index) });
  const updateConfig = (index: number, field: string, value: any) => {
    const newConfigs = [...formData.configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setFormData({ ...formData, configs: newConfigs });
  };

  const addOption = () => {
    const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const newLabel = labels[formData.options.length] || `${formData.options.length + 1}`;
    setFormData({ ...formData, options: [...formData.options, { label: newLabel, text: "", score: 0 }] });
  };
  
  const removeOption = (index: number) => {
    setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) });
  };
  
  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const payload = {
        text: formData.text,
        description: formData.description,
        order: formData.order,
        configs: formData.configs,
        cargoIds: formData.cargoIds,
        frequencyType: formData.frequencyType,
        frequencyDay: formData.frequencyDay,
        frequencyInterval: formData.frequencyInterval,
        options: formData.options,
      };
      console.log("Payload enviado:", payload);
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, payload);
        alert("✅ Pregunta actualizada correctamente");
      } else {
        await api.post("/questions", payload);
        alert("✅ Pregunta creada correctamente");
      }
      setShowModal(false);
      setEditingQuestion(null);
      setFormData({ text: "", description: "", order: 0, configs: [], cargoIds: [], frequencyType: "UNICA", frequencyDay: null, frequencyInterval: null, options: [] });
      fetchQuestions();
    } catch (err: any) {
      console.error("Error al guardar pregunta:", err);
      const errorMsg = err.response?.data?.error || err.message || "Error desconocido";
      alert(`❌ Error al guardar: ${errorMsg}`);
    }
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setFormData({
      text: q.text,
      description: q.description || "",
      order: q.order,
      configs: q.configs.map(c => ({ fileType: c.fileType, maxFiles: c.maxFiles })),
      cargoIds: q.cargos?.map(c => c.cargo.id) || [],
      frequencyType: q.frequencyType || "UNICA",
      frequencyDay: q.frequencyDay || null,
      frequencyInterval: q.frequencyInterval || null,
      options: q.options?.map(o => ({ label: o.label, text: o.text, score: o.score })) || [],
    });
    setShowModal(true);
    if (cargos.length === 0) fetchReferences();
  };

  const toggleCargo = (cargoId: number) => {
    setFormData(prev => ({
      ...prev,
      cargoIds: prev.cargoIds.includes(cargoId)
        ? prev.cargoIds.filter(id => id !== cargoId)
        : [...prev.cargoIds, cargoId]
    }));
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm("¿Eliminar?")) return;
    try { await api.delete(`/questions/${id}`); fetchQuestions(); }
    catch (err) { console.error(err); }
  };

  const handleSubmitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        name: campaignForm.name, 
        startDate: campaignForm.startDate, 
        endDate: campaignForm.endDate, 
        assignedUserIds: campaignForm.assignedUserIds 
      };
      
      if (editingCampaign) {
        await api.put(`/campaigns/${editingCampaign.id}`, payload);
      } else {
        await api.post("/campaigns", payload);
      }
      
      setShowCampaignModal(false);
      setEditingCampaign(null);
      setCampaignForm({ name: "", startDate: "", endDate: "", assignedUserIds: [] });
      fetchCampaigns();
    } catch (err) { console.error(err); }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate.split('T')[0],
      assignedUserIds: campaign.assignedUsers?.map((u: any) => u.user.id) || [],
    });
    setShowCampaignModal(true);
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm("¿Eliminar esta campaña? Se eliminarán todas las asignaciones y evaluaciones relacionadas.")) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) { console.error(err); }
  };

  const toggleUserAssignment = (userId: number) => {
    setCampaignForm(prev => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter(id => id !== userId)
        : [...prev.assignedUserIds, userId],
    }));
  };

  const viewCampaignDetails = async (campaign: Campaign) => {
    try {
      const res = await api.get(`/campaigns/${campaign.id}`);
      setSelectedCampaign(res.data);
    } catch (err) { console.error(err); }
  };

  const navigate = useNavigate();
  const clearFilters = () => setFilters({ sedeId: 0, unidadId: 0, cargoId: 0 });

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Programa de Excelencia - ADMIN</h1>
          <button onClick={() => navigate("/dashboard")} className="text-slate-600 hover:text-slate-800 text-sm font-medium">
            ← Volver al Dashboard
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab("questions")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "questions" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>Preguntas</button>
          <button onClick={() => setActiveTab("campaigns")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "campaigns" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>Campañas</button>
          <button onClick={() => setActiveTab("progress")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "progress" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>Avances</button>
          <button onClick={() => setActiveTab("results")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "results" ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>Resultados</button>
        </div>

        {activeTab === "questions" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Gestión de Preguntas</h2>
              <button onClick={() => { setShowModal(true); setEditingQuestion(null); setFormData({ text: "", description: "", order: questions.length + 1, configs: [], cargoIds: [], frequencyType: "UNICA", frequencyDay: null, frequencyInterval: null, options: [] }); if (cargos.length === 0) fetchReferences(); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">+ Nueva Pregunta</button>
            </div>
            {loading ? <p className="text-slate-500">Cargando...</p> : questions.length === 0 ? <p className="text-slate-500">No hay preguntas.</p> : (
              <div className="space-y-4">
                {questions.map((q, i) => {
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
                  <div key={q.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">{i + 1}. {q.text}</p>
                      {q.description && <p className="text-sm text-slate-500 mt-1">{q.description}</p>}
                      <p className="text-sm text-slate-500 mt-1">Opciones: {q.options?.length || 0} | Archivos: {q.configs.map(c => `${c.fileType} (${c.maxFiles})`).join(", ")}</p>
                      {q.options && q.options.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1">
                          {q.options.map(o => `${o.label}=${o.score}pts`).join(", ")}
                        </div>
                      )}
                      {freqLabel && <p className="text-xs text-brand-600 mt-1">{freqLabel}</p>}
                      {q.cargos && q.cargos.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">Cargos: {q.cargos.map(c => c.cargo.name).join(", ")}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditQuestion(q)} className="text-brand-600 hover:text-brand-700">Editar</button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-600 hover:text-red-700">Eliminar</button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Campañas</h2>
                <button onClick={() => { setEditingCampaign(null); setCampaignForm({ name: "", startDate: "", endDate: "", assignedUserIds: [] }); setShowCampaignModal(true); }} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">+ Nueva Campaña</button>
              </div>

              <div className="flex gap-4 mb-4">
                <select value={filters.sedeId} onChange={(e) => setFilters({ ...filters, sedeId: parseInt(e.target.value) })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value={0}>Todas las sedes</option>
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={filters.unidadId} onChange={(e) => setFilters({ ...filters, unidadId: parseInt(e.target.value) })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value={0}>Todas las unidades</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={filters.cargoId} onChange={(e) => setFilters({ ...filters, cargoId: parseInt(e.target.value) })} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value={0}>Todos los cargos</option>
                  {cargos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {(filters.sedeId || filters.unidadId || filters.cargoId) && (
                  <button onClick={clearFilters} className="text-sm text-slate-500 hover:text-slate-700">Limpiar</button>
                )}
              </div>

              {loading ? <p className="text-slate-500">Cargando...</p> : campaigns.length === 0 ? <p className="text-slate-500">No hay campañas.</p> : (
                <div className="space-y-4">
                  {campaigns.map((c) => (
                    <div key={c.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-800">{c.name}</p>
                          <p className="text-sm text-slate-500">{new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}</p>
                          {c.stats && (
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-blue-600">{c.stats.totalAssigned} asignados</span>
                              <span className="text-green-600">{c.stats.completed} completados</span>
                              <span className="text-orange-600">{c.stats.pending} pendientes</span>
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${c.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{c.isActive ? "Activa" : "Inactiva"}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleEditCampaign(c)} className="text-sm text-slate-600 hover:text-slate-800">Editar</button>
                        <button onClick={() => handleDeleteCampaign(c.id)} className="text-sm text-red-600 hover:text-red-800">Eliminar</button>
                        <button onClick={() => viewCampaignDetails(c)} className="text-sm text-brand-600 hover:text-brand-700">Ver detalles →</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">
              Avances de Carga - {progressData?.campaign?.name || "Sin campaña activa"}
            </h2>
            {loading ? (
              <p className="text-slate-500">Cargando...</p>
            ) : !progressData?.campaign ? (
              <p className="text-slate-500">No hay campaña activa</p>
            ) : progressData.progress.length === 0 ? (
              <p className="text-slate-500">No hay usuarios asignados a esta campaña</p>
            ) : (
              <div className="space-y-4">
                {progressData.progress.map((p: any) => (
                  <div key={p.userId} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-800">{p.userName}</p>
                        <p className="text-xs text-slate-500">{p.cargo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-brand-600">{p.percentage}%</p>
                        <p className="text-xs text-slate-500">{p.answered}/{p.totalQuestions} preguntas</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          p.percentage >= 80 ? "bg-green-500" :
                          p.percentage >= 50 ? "bg-yellow-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                    {p.completedAt && (
                      <p className="text-xs text-green-600 mt-2">Completado el {new Date(p.completedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Ranking de Evaluaciones</h2>
            {loading ? <p className="text-slate-500">Cargando...</p> : results.length === 0 ? <p className="text-slate-500">No hay evaluaciones.</p> : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">#</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Usuario</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Puntaje</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r, i) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 text-slate-600">{i + 1}</td>
                      <td className="px-4 py-3 text-slate-800">{r.user.name || r.user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full font-medium ${r.maxScore > 0 && r.totalScore >= r.maxScore * 0.8 ? "bg-green-100 text-green-700" : r.maxScore > 0 && r.totalScore >= r.maxScore * 0.5 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {r.totalScore}/{r.maxScore} puntos
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(r.completedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmitQuestion}>
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingQuestion ? "✏️ Editar Pregunta" : "➕ Nueva Pregunta"}
                </h3>
              </div>

              {/* Content with tabs */}
              <div className="flex-1 overflow-y-auto">
                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab("general")}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                      activeFormTab === "general"
                        ? "border-b-2 border-brand-600 text-brand-600 bg-brand-50"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    📝 Información General
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFormTab("options")}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                      activeFormTab === "options"
                        ? "border-b-2 border-brand-600 text-brand-600 bg-brand-50"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    🎯 Opciones de Respuesta
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFormTab("files")}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                      activeFormTab === "files"
                        ? "border-b-2 border-brand-600 text-brand-600 bg-brand-50"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    📎 Archivos Requeridos
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFormTab("cargos")}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                      activeFormTab === "cargos"
                        ? "border-b-2 border-brand-600 text-brand-600 bg-brand-50"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    👥 Asignación a Cargos
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* TAB: General Info */}
                  {activeFormTab === "general" && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Pregunta <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.text}
                          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
                          rows={4}
                          placeholder="Escribe aquí el texto de la pregunta..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Descripción <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all"
                          rows={3}
                          placeholder="Información adicional o contexto para la pregunta..."
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Orden de aparición
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                          />
                        </div>
                      </div>

                      <div className="border-t-2 border-slate-200 pt-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          📅 Frecuencia de respuesta
                        </label>
                        <select
                          value={formData.frequencyType}
                          onChange={(e) => setFormData({ ...formData, frequencyType: e.target.value, frequencyDay: null, frequencyInterval: null })}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 mb-4"
                        >
                          <option value="UNICA">🔹 Una sola vez</option>
                          <option value="DIARIA">📅 Diaria</option>
                          <option value="SEMANAL">📆 Semanal</option>
                          <option value="MENSUAL">🗓️ Mensual</option>
                          <option value="ANUAL">📋 Anual</option>
                          <option value="DIA_ESPECIFICO">📌 Día específico del mes</option>
                        </select>

                        {formData.frequencyType === "SEMANAL" && (
                          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Día de la semana</label>
                              <select value={formData.frequencyDay || 1} onChange={(e) => setFormData({ ...formData, frequencyDay: parseInt(e.target.value) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm">
                                <option value={1}>Lunes</option>
                                <option value={2}>Martes</option>
                                <option value={3}>Miércoles</option>
                                <option value={4}>Jueves</option>
                                <option value={5}>Viernes</option>
                                <option value={6}>Sábado</option>
                                <option value={7}>Domingo</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Cada cuántas semanas</label>
                              <input type="number" min={1} max={12} value={formData.frequencyInterval || 1} onChange={(e) => setFormData({ ...formData, frequencyInterval: parseInt(e.target.value) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>
                        )}

                        {formData.frequencyType === "MENSUAL" && (
                          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Día del mes</label>
                              <input type="number" min={1} max={31} value={formData.frequencyDay || 1} onChange={(e) => setFormData({ ...formData, frequencyDay: parseInt(e.target.value) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Cada cuántos meses</label>
                              <input type="number" min={1} max={12} value={formData.frequencyInterval || 1} onChange={(e) => setFormData({ ...formData, frequencyInterval: parseInt(e.target.value) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm" />
                            </div>
                          </div>
                        )}

                        {formData.frequencyType === "DIA_ESPECIFICO" && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Día específico del mes</label>
                            <input type="number" min={1} max={31} value={formData.frequencyDay || 1} onChange={(e) => setFormData({ ...formData, frequencyDay: parseInt(e.target.value) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: Options */}
                  {activeFormTab === "options" && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-amber-800">
                          💡 <strong>Importante:</strong> Cada opción representa una posible respuesta con su puntaje asignado.
                          El usuario seleccionará UNA de estas opciones al responder.
                        </p>
                      </div>

                      {formData.options.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🎯</div>
                          <p className="text-lg font-semibold text-slate-700 mb-2">Sin opciones configuradas</p>
                          <p className="text-sm text-slate-500 mb-4">Debes agregar al menos una opción de respuesta</p>
                          <button
                            type="button"
                            onClick={addOption}
                            className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium"
                          >
                            + Agregar primera opción
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.options.map((option, index) => (
                            <div key={index} className="border-2 border-slate-200 rounded-lg p-4 hover:border-brand-300 transition-colors bg-gradient-to-r from-white to-slate-50">
                              <div className="flex gap-4 items-start">
                                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 shadow-lg">
                                  {option.label}
                                </div>
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Texto de la opción</label>
                                    <input
                                      type="text"
                                      value={option.text}
                                      onChange={(e) => updateOption(index, "text", e.target.value)}
                                      placeholder="Describe esta opción de respuesta..."
                                      className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                      Puntaje asignado
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={option.score}
                                      onChange={(e) => updateOption(index, "score", parseInt(e.target.value) || 0)}
                                      className="w-32 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm font-semibold"
                                      required
                                    />
                                    <span className="text-xs text-slate-500 ml-2">puntos</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeOption(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                  title="Eliminar opción"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={addOption}
                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors font-medium"
                          >
                            + Agregar otra opción
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Files */}
                  {activeFormTab === "files" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-800">
                          📎 <strong>Evidencia requerida:</strong> Configura qué tipos de archivos deben subir los usuarios como evidencia.
                        </p>
                      </div>

                      {formData.configs.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">📁</div>
                          <p className="text-lg font-semibold text-slate-700 mb-2">Sin archivos configurados</p>
                          <p className="text-sm text-slate-500 mb-4">Agrega al menos un tipo de archivo requerido</p>
                          <button
                            type="button"
                            onClick={addConfig}
                            className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium"
                          >
                            + Agregar primer tipo de archivo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.configs.map((config, index) => (
                            <div key={index} className="border-2 border-slate-200 rounded-lg p-4 hover:border-brand-300 transition-colors">
                              <div className="flex gap-3 items-center">
                                <div className="flex-1">
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de archivo</label>
                                  <select
                                    value={config.fileType}
                                    onChange={(e) => updateConfig(index, "fileType", e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm"
                                  >
                                    {FILE_TYPES.map(ft => (
                                      <option key={ft.value} value={ft.value}>{ft.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="w-32">
                                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cantidad</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={config.maxFiles}
                                    onChange={(e) => updateConfig(index, "maxFiles", parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeConfig(index)}
                                  className="mt-7 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                  title="Eliminar configuración"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={addConfig}
                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors font-medium"
                          >
                            + Agregar otro tipo de archivo
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Cargos */}
                  {activeFormTab === "cargos" && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-green-800">
                          👥 <strong>Asignación:</strong> Selecciona a qué cargos se les mostrará esta pregunta.
                          Si no seleccionas ninguno, se mostrará a todos los cargos.
                        </p>
                      </div>

                      {cargos.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No hay cargos configurados</p>
                      ) : (
                        <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                            <span className="text-xs font-semibold text-slate-600">Cargos disponibles</span>
                          </div>
                          <div className="max-h-80 overflow-y-auto p-3 space-y-1">
                            {cargos.map(c => (
                              <label
                                key={c.id}
                                className="flex items-center gap-3 p-3 hover:bg-brand-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-brand-200"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.cargoIds.includes(c.id)}
                                  onChange={() => toggleCargo(c.id)}
                                  className="w-5 h-5 rounded text-brand-600 border-slate-300 focus:ring-brand-500 focus:ring-2"
                                />
                                <span className="text-sm font-medium text-slate-700 flex-1">{c.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingQuestion(null); }} 
                  className="px-6 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={formData.configs.length === 0 || formData.options.length === 0} 
                  className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {editingQuestion ? "💾 Guardar Cambios" : "✨ Crear Pregunta"}
                </button>
              </div>
            </div>
            </form>
          </div>
        )}

        {showCampaignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{editingCampaign ? "Editar Campaña" : "Nueva Campaña"}</h3>
              <form onSubmit={handleSubmitCampaign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input type="text" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inicio</label>
                    <input type="date" value={campaignForm.startDate} onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fin</label>
                    <input type="date" value={campaignForm.endDate} onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Asignar usuarios (filtrados)</label>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-2">
                    {users.filter((u: any) => u.role?.name !== "admin").length === 0 ? (
                      <p className="text-sm text-slate-400">No hay usuarios con los filtros seleccionados</p>
                    ) : (
                      users.filter((u: any) => u.role?.name !== "admin").map((user: any) => (
                        <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
                          <input type="checkbox" checked={campaignForm.assignedUserIds.includes(user.id)} onChange={() => toggleUserAssignment(user.id)} className="rounded text-brand-600" />
                          <span className="text-sm">{user.name || user.email}</span>
                          {user.sede && <span className="text-xs text-slate-400">• {user.sede.name}</span>}
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <button type="button" onClick={() => setShowCampaignModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">{editingCampaign ? "Actualizar" : "Crear Campaña"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedCampaign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">{selectedCampaign.name}</h3>
                <button onClick={() => setSelectedCampaign(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 text-sm">
                  <span className="text-blue-600">Asignados: {selectedCampaign.assignedUsers?.length || 0}</span>
                  <span className="text-green-600">Completados: {selectedCampaign.evaluations?.filter(e => e.completedAt).length || 0}</span>
                </div>
                {selectedCampaign.pendingUsers && selectedCampaign.pendingUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Pendientes ({selectedCampaign.pendingUsers.length})</h4>
                    <div className="space-y-1">
                      {selectedCampaign.pendingUsers.map((u: any) => (
                        <p key={u.id} className="text-sm text-slate-500">{u.name || u.email}</p>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCampaign.evaluations && selectedCampaign.evaluations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2">Completados ({selectedCampaign.evaluations.length})</h4>
                    <div className="space-y-2">
                      {selectedCampaign.evaluations.map((e: any) => (
                        <div key={e.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                          <span className="text-sm">{e.user.name || e.user.email}</span>
                          <span className="text-sm font-medium text-brand-600">{e.totalScore}/{e.maxScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}