import { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

interface User {
  id: number;
  name: string | null;
  email: string;
  cargo?: { name: string } | null;
}

interface Campaign {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
}

interface Question {
  id: number;
  text: string;
  frequencyType: string;
  points: number;
  options?: { id: number; label: string; text: string; score: number }[];
}

interface Answer {
  id: number;
  questionId: number;
  awardedScore: number;
  adminScore: number | null;
  adminComment: string | null;
  adminReviewedAt: string | null;
  createdAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  question: Question;
  option?: { id: number; label: string; text: string } | null;
  files: { id: number; fileType: string; fileName: string; fileUrl: string }[];
  reviewedBy?: { id: number; name: string } | null;
}

interface Evaluation {
  id: number;
  userId: number;
  campaignId: number;
  source: string;
  programId: number | null;
  totalScore: number;
  maxScore: number;
  completedAt: string | null;
  createdAt: string;
  user: User;
  campaign: Campaign;
  program?: Program | null;
  answers: Answer[];
  autoScore: number;
  adminScore: number | null;
  adminFinalScore: number | null;
  adminFinalComment: string | null;
  adminPublishedAt: string | null;
  reviewedCount: number;
  totalAnswers: number;
  isComplete: boolean;
}

export default function EvaluationsAdmin() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ source: "", programId: 0, userId: 0, campaignId: 0 });
  const [selectedUserEvals, setSelectedUserEvals] = useState<{ user: User, evaluations: Evaluation[], campaignId: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"EXCELENCIA" | "MIS_PROGRAMAS">("EXCELENCIA");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.source) params.append("source", filters.source);
      if (filters.programId) params.append("programId", filters.programId.toString());
      if (filters.userId) params.append("userId", filters.userId.toString());
      if (filters.campaignId) params.append("campaignId", filters.campaignId.toString());

      const [evRes, progRes, campRes, userRes] = await Promise.all([
        api.get(`/evaluations/all?${params}`),
        api.get("/programs"),
        api.get("/campaigns"),
        api.get("/users"),
      ]);

      setEvaluations(evRes.data);
      setPrograms(progRes.data);
      setCampaigns(campRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupedUsers = useMemo(() => {
    const map: Record<number, { user: User, campaignId: number, autoScore: number, autoMax: number, mProgramsScore: number, mProgramsMax: number, autoEvalStatus: string, mProgramsCount: number }> = {};
    evaluations.forEach(ev => {
      if (!map[ev.user.id]) {
         map[ev.user.id] = { user: ev.user, campaignId: ev.campaignId, autoScore: 0, autoMax: 0, mProgramsScore: 0, mProgramsMax: 0, autoEvalStatus: "Sin registro", mProgramsCount: 0 };
      }
      if (ev.source === "EXCELENCIA") {
         map[ev.user.id].autoScore = ev.autoScore;
         map[ev.user.id].autoMax = ev.maxScore;
         map[ev.user.id].autoEvalStatus = ev.isComplete ? "Completado" : "Pendiente";
      }
      if (ev.source === "MIS_PROGRAMAS") {
         map[ev.user.id].mProgramsScore += ev.autoScore;
         map[ev.user.id].mProgramsMax += ev.maxScore;
         map[ev.user.id].mProgramsCount += 1;
      }
    });
    return Object.values(map);
  }, [evaluations]);

  const fetchUserCombinedDetails = async (userId: number, campaignId: number) => {
    try {
      const res = await api.get(`/evaluations/user/${userId}/campaign/${campaignId}/details`);
      if (res.data && res.data.length > 0) {
        setSelectedUserEvals({ user: res.data[0].user, evaluations: res.data, campaignId });
      } else {
        alert("No se encontraron detalles agrupados.");
      }
    } catch (err) {
      console.error("Error fetching user combined details:", err);
      alert("Error al obtener detalles");
    }
  };

  const handleOpenUserDetails = (userId: number, campaignId: number) => {
    fetchUserCombinedDetails(userId, campaignId);
    setActiveTab("EXCELENCIA");
  };

  const handlePublishFinal = async (evaluationId: number, finalScore: number, finalComment: string) => {
    try {
      await api.put(`/evaluations/${evaluationId}/publish-result`, {
        adminFinalScore: finalScore,
        adminFinalComment: finalComment,
      });
      // Refresh modal and table
      if (selectedUserEvals) fetchUserCombinedDetails(selectedUserEvals.user.id, selectedUserEvals.campaignId);
      fetchData();
      alert("Resultado final publicado exitosamente");
    } catch (err) {
      console.error(err);
      alert("Error al publicar resultado");
    }
  };

  const handleReview = async (answerId: number, adminScore: number | null, adminComment: string) => {
    try {
      await api.put(`/evaluations/answers/${answerId}/review`, { adminScore, adminComment });
      if (selectedUserEvals) fetchUserCombinedDetails(selectedUserEvals.user.id, selectedUserEvals.campaignId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error al guardar calificación");
      throw err;
    }
  };

  const getFrequencyLabel = (type: string) => {
    const labels: Record<string, string> = {
      UNICA: "Única",
      DIARIA: "Diaria",
      SEMANAL: "Semanal",
      MENSUAL: "Mensual",
      ANUAL: "Anual",
      DIA_ESPECIFICO: "Día específico",
    };
    return labels[type] || type;
  };

  const excelEvals = selectedUserEvals?.evaluations.filter(e => e.source === "EXCELENCIA") || [];
  const progEvals = selectedUserEvals?.evaluations.filter(e => e.source === "MIS_PROGRAMAS") || [];

  return (
    <Layout title="Evaluaciones">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Calificaciones y Evaluaciones</h1>
          <p className="text-slate-500">Consulta las evaluaciones consolidadas por usuario</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="EXCELENCIA">Autoevaluación Mensual</option>
              <option value="MIS_PROGRAMAS">Mis Programas</option>
            </select>

            <select
              value={filters.programId}
              onChange={(e) => setFilters({ ...filters, programId: parseInt(e.target.value) })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value={0}>Todos los programas</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={filters.campaignId}
              onChange={(e) => setFilters({ ...filters, campaignId: parseInt(e.target.value) })}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value={0}>Todas las campañas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={fetchData}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
            >
              Aplicar filtros
            </button>
          </div>
        </div>

        {/* Tabla Agrupada de Evaluaciones */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando...</div>
          ) : groupedUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No hay evaluaciones</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Autoevaluación Mensual</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mis Programas</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedUsers.map((group) => (
                    <tr key={group.user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{group.user.name || group.user.email}</p>
                        <p className="text-xs text-slate-500">{group.user.cargo?.name || "Sin cargo"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-xs font-medium mb-1 ${group.autoEvalStatus === "Completado" ? "text-green-600" : group.autoEvalStatus === "Pendiente" ? "text-amber-600" : "text-slate-400"}`}>
                          {group.autoEvalStatus}
                        </p>
                        {group.autoEvalStatus !== "Sin registro" && (
                          <p className="text-sm font-bold text-slate-700">
                            {group.autoScore} / {group.autoMax} pts
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500 mb-1">{group.mProgramsCount} programa(s)</p>
                        {group.mProgramsCount > 0 && (
                          <p className="text-sm font-bold text-purple-700">
                            {group.mProgramsScore} / {group.mProgramsMax} pts
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleOpenUserDetails(group.user.id, group.campaignId)}
                          className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-sm font-medium transition-colors"
                        >
                          Ver Reporte Consolidado
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Detalle Consolidado */}
        {selectedUserEvals && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    Perfil de Evaluación
                    <span className="text-sm font-normal px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-600">
                      Campaña: {selectedUserEvals.evaluations[0]?.campaign?.name || "Desconocida"}
                    </span>
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    <span className="font-medium text-brand-700">{selectedUserEvals.user.name || selectedUserEvals.user.email}</span> • {selectedUserEvals.user.cargo?.name || "Sin cargo"}
                  </p>
                </div>
                <button onClick={() => setSelectedUserEvals(null)} className="text-slate-400 hover:text-slate-600 text-2xl">
                  &times;
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 px-6">
                <button
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "EXCELENCIA" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setActiveTab("EXCELENCIA")}
                >
                  Autoevaluación Mensual ({excelEvals.length})
                </button>
                <button
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === "MIS_PROGRAMAS" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setActiveTab("MIS_PROGRAMAS")}
                >
                  Mis Programas ({progEvals.length})
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                {activeTab === "EXCELENCIA" && (
                  excelEvals.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                      No hay registros de Autoevaluación para este usuario.
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {excelEvals.map(evalu => (
                        <EvaluationBlock
                          key={evalu.id}
                          evaluation={evalu}
                          onReview={handleReview}
                          onPublishFinal={handlePublishFinal}
                          getFrequencyLabel={getFrequencyLabel}
                        />
                      ))}
                    </div>
                  )
                )}

                {activeTab === "MIS_PROGRAMAS" && (
                  progEvals.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                      No hay registros de Mis Programas para este usuario.
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {progEvals.map(evalu => (
                        <EvaluationBlock
                          key={evalu.id}
                          evaluation={evalu}
                          onReview={handleReview}
                          onPublishFinal={handlePublishFinal}
                          getFrequencyLabel={getFrequencyLabel}
                        />
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function EvaluationBlock({
  evaluation,
  onReview,
  onPublishFinal,
  getFrequencyLabel
}: {
  evaluation: Evaluation;
  onReview: (id: number, score: number | null, comment: string) => Promise<void>;
  onPublishFinal: (evaluationId: number, score: number, comment: string) => Promise<void>;
  getFrequencyLabel: (t: string) => string;
}) {
  const [publishingFinal, setPublishingFinal] = useState(false);
  const [finalScoreInput, setFinalScoreInput] = useState<string>(evaluation.adminFinalScore != null ? String(evaluation.adminFinalScore) : "");
  const [finalCommentInput, setFinalCommentInput] = useState<string>(evaluation.adminFinalComment || "");
  const [savingReview, setSavingReview] = useState<number | null>(null);

  const handleReviewWrapper = async (id: number, score: number | null, comment: string) => {
    setSavingReview(id);
    try {
      await onReview(id, score, comment);
    } finally {
      setSavingReview(null);
    }
  };

  const submitFinal = async () => {
    if (finalScoreInput === "") return;
    setPublishingFinal(true);
    await onPublishFinal(evaluation.id, parseInt(finalScoreInput), finalCommentInput);
    setPublishingFinal(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-lg">
          {evaluation.source === "MIS_PROGRAMAS" ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Mis Programas: {evaluation.program?.name}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Autoevaluación Mensual
            </span>
          )}
        </h3>
        {evaluation.isComplete ? (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Completado</span>
        ) : (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-medium">Parcial</span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 py-4">
        <div className="px-5">
          <p className="text-xs text-slate-500">Puntaje Automático</p>
          <p className="text-xl font-bold text-slate-700">{evaluation.autoScore} / {evaluation.maxScore}</p>
        </div>
        <div className="px-5">
          <p className="text-xs text-slate-500">Suma Admin</p>
          <p className="text-xl font-bold text-brand-600">
            {evaluation.adminScore !== null ? evaluation.adminScore : "-"}
          </p>
        </div>
        <div className="px-5">
          <p className="text-xs text-slate-500">Preguntas Revisadas</p>
          <p className="text-xl font-bold text-slate-700">
            {evaluation.answers.filter(a => a.adminScore !== null).length} / {evaluation.answers.length}
          </p>
        </div>
      </div>

      {/* BLOQUE RESULTADO FINAL */}
      <div className="p-5 border-b border-brand-100 bg-brand-50/30">
        <h4 className="text-sm font-bold text-brand-800 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Resultado Final Consolidado
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Puntaje Final</label>
            <input
              type="number"
              value={finalScoreInput}
              onChange={(e) => setFinalScoreInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-500"
              placeholder="Ej: 85"
              min={0}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Comentario General</label>
            <input
              type="text"
              value={finalCommentInput}
              onChange={(e) => setFinalCommentInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-brand-500"
              placeholder="Recomendaciones o feedback..."
            />
          </div>
          <div className="flex flex-col justify-end pt-5">
            <button
              onClick={submitFinal}
              disabled={publishingFinal || finalScoreInput === ""}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {publishingFinal ? "Guardando..." : evaluation.adminPublishedAt ? "Actualizar Resultado" : "Publicar Resultado"}
            </button>
            {evaluation.adminPublishedAt && (
              <p className="text-[11px] text-brand-600 mt-2 text-center font-medium">
                Publicado: {new Date(evaluation.adminPublishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* PREGUNTAS Y RESPUESTAS */}
      <div className="p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-700 mb-2">Desglose de Preguntas</h4>
        {evaluation.answers.map((answer, idx) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            index={idx + 1}
            onReview={handleReviewWrapper}
            saving={savingReview === answer.id}
            getFrequencyLabel={getFrequencyLabel}
            evaluationSource={evaluation.source}
          />
        ))}
      </div>
    </div>
  );
}

function AnswerCard({
  answer,
  index,
  onReview,
  saving,
  getFrequencyLabel,
  evaluationSource,
}: {
  answer: Answer;
  index: number;
  onReview: (id: number, score: number | null, comment: string) => void;
  saving: boolean;
  getFrequencyLabel: (type: string) => string;
  evaluationSource: string;
}) {
  const [editScore, setEditScore] = useState<number | null>(answer.adminScore);
  const [editComment, setEditComment] = useState(answer.adminComment || "");
  const [showFiles, setShowFiles] = useState(false);

  const handleSave = () => {
    onReview(answer.id, editScore, editComment);
  };

  return (
    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-7 h-7 bg-white border border-slate-200 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-medium text-slate-800 text-sm leading-tight">{answer.question.text}</p>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{getFrequencyLabel(answer.question.frequencyType)}</span>
                <span>• {answer.question.points} pts max</span>
              </p>
              {answer.periodStart && (
                <p className="text-xs text-slate-400 mt-1">
                  Período: {new Date(answer.periodStart).toLocaleDateString()}
                  {answer.periodEnd && ` - ${new Date(answer.periodEnd).toLocaleDateString()}`}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Automático</p>
              <p className="text-sm font-medium text-slate-700 bg-slate-100 px-2 rounded inline-block">{answer.awardedScore}</p>
              
              {answer.adminScore !== null && (
                <div className="mt-2">
                   <p className="text-[11px] text-brand-600 uppercase tracking-wider font-semibold mb-0.5">Admin</p>
                   <p className="text-sm font-bold text-white bg-brand-500 px-2 rounded inline-block">{answer.adminScore}</p>
                </div>
              )}
            </div>
          </div>

          {/* Opción seleccionada */}
          {answer.option && (
            <div className="mt-3 p-2.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm flex gap-2 items-center">
              <span className="text-brand-500 shrink-0">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
              </span>
              <span className="text-slate-600">Opción seleccionada:</span>
              <span className="font-medium text-slate-800">{answer.option.label} - {answer.option.text}</span>
            </div>
          )}

          {/* Archivos */}
          {answer.files.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowFiles(!showFiles)}
                className="text-xs flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium py-1 px-2 hover:bg-brand-50 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {showFiles ? "Ocultar archivos" : "Ver archivos"} ({answer.files.length})
              </button>
              
              {showFiles && (
                <div className="mt-2 flex flex-wrap gap-2 pl-2">
                  {answer.files.map((f) => (
                    <a
                      key={f.id}
                      href={f.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-brand-300 hover:text-brand-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {f.fileName}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sección de Calificación Admin */}
          <div className="mt-4 pt-4 border-t border-slate-200/60">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Puntaje</label>
                <input
                  type="number"
                  min={0}
                  max={answer.question.points}
                  value={editScore ?? ""}
                  onChange={(e) => setEditScore(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500"
                  placeholder={answer.question.points.toString()}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Comentario</label>
                <input
                  type="text"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-500"
                  placeholder="Feedback para el usuario..."
                />
              </div>
              <div className="flex items-end justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full px-3 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors"
                >
                  {saving ? "..." : "Guardar"}
                </button>
              </div>
            </div>
            {answer.adminReviewedAt && (
              <p className="text-[10px] text-slate-400 mt-2 text-right">
                Última revisión: {new Date(answer.adminReviewedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
