import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

interface QuestionOption {
  id: number;
  label: string;
  text: string;
  score: number;
  isDefault?: boolean;
}
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
  points: number;
  order?: number;
  frequencyType?: string;
  frequencyDay?: number | null;
  frequencyInterval?: number | null;
  options?: QuestionOption[];
  configs?: QuestionConfig[];
  cargos?: QuestionCargo[];
}
interface Program {
  id: number;
  name: string;
  description?: string;
  questions: Question[];
  evaluation?: {
    id: number;
    totalScore: number;
    totalAdminScore: number | null;
    maxScore: number;
    completedAt: string | null;
    periodsAnswered: number;
  } | null;
}

interface AnswerFile {
  fileType: string;
  fileName: string;
  fileUrl: string;
}

interface EvaluationResult {
  id: number;
  totalScore: number;
  maxScore: number;
  completedAt: string;
  answers: {
    question: Question;
    awardedScore: number;
    files: AnswerFile[];
  }[];
}

interface PeriodData {
  id: number;
  periodStart: string | null;
  periodEnd: string | null;
  optionId: number | null;
  optionLabel: string | null;
  awardedScore: number;
  hasEvidence: boolean;
  files: AnswerFile[];
}

interface QuestionHistory {
  id: number;
  text: string;
  frequencyType: string;
  points: number;
  periods: PeriodData[];
  totalAuto: number;
  adminScore: number | null;
  adminComment: string | null;
  adminReviewedAt: string | null;
  reviewedBy: { id: number; name: string } | null;
}

interface HistoryEvaluation {
  id: number;
  source: string;
  programId: number | null;
  program?: { id: number; name: string };
  totalScore: number;
  maxScore: number;
  completedAt: string;
  questions: QuestionHistory[];
}

export default function MisProgramas() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // Estado para respuestas
  const [answers, setAnswers] = useState<{ [questionId: number]: AnswerFile[] }>({});
  const [selectedOptions, setSelectedOptions] = useState<{ [questionId: number]: number | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [myResult, setMyResult] = useState<EvaluationResult | null>(null);
  const [myHistory, setMyHistory] = useState<HistoryEvaluation[]>([]);
  const [questionAvailability, setQuestionAvailability] = useState<{ [qId: number]: { available: boolean; isComplete: boolean; currentPeriod: { periodStart: string; periodEnd: string } | null } }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  // Excel data del programa
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelPeriod, setExcelPeriod] = useState<string>("");
  const [excelFilter, setExcelFilter] = useState<string>("ALL");

  // Obtener todas las preguntas de los programas (combinadas por cargo)
  const allQuestions = selectedProgram?.questions || [];

  useEffect(() => {
    fetchMyPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchData();
    }
  }, [selectedProgram]);

  const fetchMyPrograms = async () => {
    try {
      const res = await api.get("/programs/my-programs");
      setPrograms(res.data);
    } catch (err) {
      // silently handled
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Obtener resultado previo de Mis Programas para el programa específico
      const resultRes = await api.get("/evaluations/my-result", {
        params: { 
          source: "MIS_PROGRAMAS",
          programId: selectedProgram?.id,
        },
      });
      setMyResult(resultRes.data.evaluation);
      
      // Obtener datos de Excel importado (si existe)
      try {
        const excelRes = await api.get(`/program-files/${selectedProgram?.id}/records/latest`);
        if (excelRes.data) {
          const data = excelRes.data.data as any;
          setExcelData(data?.registros || []);
          setExcelPeriod(excelRes.data.period);
        } else {
          setExcelData([]);
          setExcelPeriod("");
        }
      } catch {
        setExcelData([]);
        setExcelPeriod("");
      }
      
      // Obtener historial
      const historyRes = await api.get("/evaluations/my-history", {
        params: { 
          source: "MIS_PROGRAMAS",
          programId: selectedProgram?.id,
        },
      });
      setMyHistory(historyRes.data.evaluations || []);
      
      // Obtener disponibilidad de preguntas
      const availRes = await api.get("/evaluations/question-availability", {
        params: { 
          source: "MIS_PROGRAMAS",
          programId: selectedProgram?.id,
        },
      });
      
      // Mapear disponibilidad por questionId
      const availMap: { [qId: number]: { available: boolean; isComplete: boolean; currentPeriod: { periodStart: string; periodEnd: string } | null } } = {};
      availRes.data.questions?.forEach((q: any) => {
        availMap[q.id] = {
          available: q.available,
          isComplete: q.isComplete,
          currentPeriod: q.currentPeriod,
        };
      });
      setQuestionAvailability(availMap);
      
      // Si ya hay evaluación completa, mostrar resultado
      if (resultRes.data.evaluation?.completedAt) {
        setMyResult(resultRes.data.evaluation);
      } else {
        // Cargar draft si existe
        const draftStr = localStorage.getItem(`pauser_mis_programas_draft_${selectedProgram?.id}`);
        const draft = draftStr ? JSON.parse(draftStr) : null;

        const initialAnswers: { [questionId: number]: AnswerFile[] } = {};
        const initialOptions: { [questionId: number]: number | null } = {};
        
        allQuestions.forEach((q: Question) => {
          initialAnswers[q.id] = draft?.[q.id]?.files || [];
          initialOptions[q.id] = draft?.[q.id]?.optionId || null;
        });
        setAnswers(initialAnswers);
        setSelectedOptions(initialOptions);
      }
    } catch (err) {
      // silently handled
    }
  };

  useEffect(() => {
    if (selectedProgram && !loading) {
      const draftData: { [questionId: number]: { files: AnswerFile[]; optionId: number | null } } = {};
      Object.keys(answers).forEach(qId => {
        draftData[parseInt(qId)] = {
          files: answers[parseInt(qId)],
          optionId: selectedOptions[parseInt(qId)] || null,
        };
      });
      localStorage.setItem(`pauser_mis_programas_draft_${selectedProgram?.id}`, JSON.stringify(draftData));
    }
  }, [answers, selectedOptions, loading, selectedProgram]);

  const getFileAccept = (fileType: string) => {
    switch (fileType) {
      case "IMAGEN": return "image/*";
      case "PDF": return ".pdf";
      case "PPT": return ".ppt,.pptx";
      case "EXCEL": return ".xlsx,.xls,.xls,.csv";
      default: return "*";
    }
  };

  const getFileTypeLabel = (fileType: string) => {
    const labels: Record<string, string> = {
      IMAGEN: "Imagen",
      PDF: "PDF",
      PPT: "PowerPoint",
      EXCEL: "Excel",
      IN_SITU: "IN SITU (Revisión presencial)",
    };
    return labels[fileType] || fileType;
  };

  const handleFileChange = async (questionId: number, config: QuestionConfig, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const currentFiles = answers[questionId] || [];
    const currentOfType = currentFiles.filter(f => f.fileType === config.fileType).length;
    const available = config.maxFiles - currentOfType;

    if (available <= 0) {
      alert(`Máximo ${config.maxFiles} archivo(s) de tipo ${getFileTypeLabel(config.fileType)}`);
      return;
    }

    const filesToAdd = Array.from(files).slice(0, available);
    const newFiles: AnswerFile[] = [];

    for (const file of filesToAdd) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await api.post("/evaluations/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        newFiles.push({
          fileType: config.fileType,
          fileName: file.name,
          fileUrl: res.data.fileUrl,
        });
      } catch (err) {
        alert(`No se pudo subir ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), ...newFiles],
      }));
    }
  };

  const removeFile = (questionId: number, fileIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId].filter((_, i) => i !== fileIndex),
    }));
  };

  const handleOptionSelect = (questionId: number, optionId: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const hasAllRequiredFiles = (question: Question) => {
    const questionFiles = answers[question.id] || [];
    const hasOptionSelected = selectedOptions[question.id] !== null && selectedOptions[question.id] !== undefined;

    for (const config of question.configs || []) {
      if (config.fileType === "IN_SITU") continue;

      const ofType = questionFiles.filter(f => f.fileType === config.fileType).length;
      if (ofType < config.maxFiles) return false;
    }
    return hasOptionSelected && question.options && question.options.length > 0;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const campaignRes = await api.get("/campaigns/active");
      if (!campaignRes.data) {
        alert("No hay campaña activa");
        return;
      }

      const payload = allQuestions.map(q => ({
        questionId: q.id,
        optionId: selectedOptions[q.id],
        files: answers[q.id] || [],
      }));

      await api.post("/evaluations/submit", {
        campaignId: campaignRes.data.id,
        answers: payload,
        source: "MIS_PROGRAMAS",
        programId: selectedProgram?.id,
      });

      localStorage.removeItem(`pauser_mis_programas_draft_${selectedProgram?.id}`);

      alert("¡Evaluación de Mis Programas enviada exitosamente!");
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = axiosErr.response?.data?.error || axiosErr.message || "Error al enviar evaluación";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const allQuestionsComplete = allQuestions
    .filter(q => questionAvailability[q.id]?.available !== false)
    .every(q => hasAllRequiredFiles(q));

  const hasAvailableQuestions = allQuestions.some(q => questionAvailability[q.id]?.available && !questionAvailability[q.id]?.isComplete);

  // Si hay resultado completo y no hay preguntas disponibles, mostrar pantalla de completado
  if (myResult?.completedAt && selectedProgram && !hasAvailableQuestions) {
    const percentage = myResult.maxScore > 0 ? Math.round((myResult.totalScore / myResult.maxScore) * 100) : 0;

    return (
      <Layout title="Mis Programas">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Mis Programas Asignados</h2>
              <p className="text-slate-500 text-sm">Programa(s) asignado(s) a tu usuario</p>
            </div>
            <button
              onClick={() => { setSelectedProgram(null); setMyResult(null); }}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              ← Volver a Programas
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Evaluación de {selectedProgram.name} Completada</h2>

            <div className="mb-6">
              <p className="text-6xl font-bold text-brand-600">{myResult.totalScore}</p>
              <p className="text-slate-500">puntos de {myResult.maxScore}</p>
            </div>

            {(myResult as any).adminPublishedAt && (
              <div className="mb-6 p-6 bg-brand-50 border-2 border-brand-200 rounded-xl text-left shadow-sm">
                <h3 className="text-lg font-bold text-brand-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resultado Final Oficial
                </h3>
                <div className="bg-white rounded-lg p-4 border border-brand-100 flex items-center justify-between mb-4">
                  <span className="text-brand-900 font-medium">Calificación Administrador:</span>
                  <span className="text-2xl font-black text-brand-600">{(myResult as any).adminFinalScore}</span>
                </div>
                {(myResult as any).adminFinalComment && (
                  <div className="bg-white rounded-lg p-4 border border-brand-100 italic text-slate-600 text-sm">
                    "{(myResult as any).adminFinalComment}"
                  </div>
                )}
                <p className="text-xs text-brand-600/70 text-right mt-3 font-medium">
                  Publicado el {new Date((myResult as any).adminPublishedAt).toLocaleDateString()}
                </p>
              </div>
            )}

            <div className="w-full bg-slate-100 rounded-full h-4 mb-4">
              <div className="bg-brand-600 h-4 rounded-full transition-all" style={{ width: `${percentage}%` }} />
            </div>

            <p className="text-sm text-slate-500">
              Fecha: {new Date(myResult.completedAt).toLocaleDateString()}
            </p>

            {myHistory.length > 0 && (
              <div className="mt-8 text-left">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Mi Historial</h3>
                {myHistory.map((ev) => (
                  <div key={ev.id} className="mt-4 border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="font-medium text-slate-800">{ev.program?.name || ev.source}</p>
                        <p className="text-sm text-slate-500">
                          Puntaje automático: {ev.questions.reduce((sum, q) => sum + q.totalAuto, 0)} pts
                        </p>
                      </div>
                      <div className="text-right">
                        {ev.questions.some(q => q.adminScore !== null) && (
                          <p className="font-bold text-amber-600">
                            Puntaje Admin: {ev.questions.reduce((sum, q) => sum + (q.adminScore || 0), 0)} pts
                          </p>
                        )}
                      </div>
                    </div>

                    {ev.questions.filter(q => q.periods.length > 0).map((q) => (
                      <div key={q.id} className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-slate-700">{q.text}</p>
                          <div className="text-right text-xs">
                            <p className="text-slate-500">Auto: {q.totalAuto} pts</p>
                            {q.adminScore !== null && (
                              <p className="text-amber-600 font-bold">Admin: {q.adminScore} pts</p>
                            )}
                          </div>
                        </div>
                        {q.periods.length > 1 && (
                          <div className="mt-2 text-xs text-slate-500">
                            <p className="font-medium">Respuestas por período:</p>
                            {q.periods.map((p, idx) => (
                              <div key={idx} className="ml-2 mt-1">
                                <p>
                                  Período {idx + 1}: {p.optionLabel || "Sin respuesta"} → {p.awardedScore} pts
                                  {p.periodStart && ` (${new Date(p.periodStart).toLocaleDateString()})`}
                                </p>
                                {p.files && p.files.length > 0 && (
                                  <div className="ml-2 mt-1 flex flex-wrap gap-1">
                                    {p.files.map((f, i) => (
                                      <a key={i} href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-300 transition-colors">
                                        📎 {f.fileName.slice(0, 15)}{f.fileName.length > 15 ? '...' : ''}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.adminComment && (
                          <p className="mt-2 text-xs text-amber-600 italic">"{q.adminComment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-6 text-slate-600">
              {percentage >= 60 ? "¡Felicidades! Has completado la evaluación." : "Sigue participando en las próximas campañas."}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mis Programas">
      <div className="max-w-4xl mx-auto">
        {!selectedProgram ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">Mis Programas Asignados</h2>
              <p className="text-slate-500 text-sm">Selecciona un programa para responder</p>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">Cargando...</div>
            ) : programs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No tienes programas asignados actualmente.</p>
                <p className="text-sm text-slate-400 mt-2">Contacta al administrador para que te asigne un programa.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map(p => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 cursor-pointer transition-all hover:shadow-md hover:border-brand-300"
                    onClick={() => { setSelectedProgram(p); setMyResult(null); }}
                  >
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    {p.description && <p className="text-sm text-slate-500 mt-1">{p.description}</p>}
                    <p className="text-xs text-slate-400 mt-2">{p.questions?.length || 0} preguntas</p>
                    {p.evaluation ? (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-sm">
                          Auto: <span className="font-bold">{p.evaluation.totalScore}</span>
                          {" / "}{p.evaluation.maxScore}
                        </span>
                        {p.evaluation.totalAdminScore !== null && (
                          <span className="text-sm text-brand-600">
                            Admin: <span className="font-bold">{p.evaluation.totalAdminScore}</span>
                          </span>
                        )}
                        {p.evaluation.completedAt && (
                          <span className="text-green-600 text-xs">Completado</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm mt-2 block">Sin responder</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Programa: {selectedProgram.name}</h2>
                <p className="text-slate-500 text-sm">Responde las preguntas y sube evidencia</p>
              </div>
              <button
                onClick={() => setSelectedProgram(null)}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                ← Volver
              </button>
            </div>

            {/* Sección de datos Excel importados */}
            {excelData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">📊 Datos del período {excelPeriod}</h3>
                  <select 
                    value={excelFilter} 
                    onChange={(e) => setExcelFilter(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="ALL">Todos</option>
                    <option value="VIGENTE">Vigente</option>
                    <option value="POR VENCER">Por vencer</option>
                    <option value="VENCIDO">Vencido</option>
                  </select>
                </div>

                {/* Resumen */}
                <div className="flex gap-4 mb-4 text-sm">
                  <span className="text-green-600">✓ {excelData.filter(r => r.status_dni === "VIGENTE").length} DNI vigentes</span>
                  <span className="text-yellow-600">⚠ {excelData.filter(r => r.status_dni === "POR VENCER").length} por vencer</span>
                  <span className="text-red-600">✕ {excelData.filter(r => r.status_dni === "VENCIDO").length} vencidos</span>
                </div>

                <div className="overflow-x-auto max-h-64 border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left">#</th>
                        <th className="px-2 py-1 text-left">Nombre</th>
                        <th className="px-2 py-1 text-left">Ruta</th>
                        <th className="px-2 py-1 text-left">DNI</th>
                        <th className="px-2 py-1 text-left">F.V.</th>
                        <th className="px-2 py-1 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelData
                        .filter(r => excelFilter === "ALL" || r.status_dni === excelFilter)
                        .map((r: any) => (
                        <tr key={r.numero} className="border-b hover:bg-slate-50">
                          <td className="px-2 py-1">{r.numero}</td>
                          <td className="px-2 py-1 font-medium">{r.nombre}</td>
                          <td className="px-2 py-1">{r.salio_a_ruta}</td>
                          <td className="px-2 py-1">{r.dni}</td>
                          <td className="px-2 py-1">{r.fv_dni || "-"}</td>
                          <td className="px-2 py-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              r.status_dni === "VENCIDO" ? "bg-red-100 text-red-700" :
                              r.status_dni === "POR VENCER" ? "bg-yellow-100 text-yellow-700" :
                              r.status_dni === "VIGENTE" ? "bg-green-100 text-green-700" :
                              "bg-slate-100 text-slate-500"
                            }`}>{r.status_dni || "-"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {allQuestions.length === 0 && excelData.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No hay preguntas asignadas a este programa.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {allQuestions.map((q, i) => {
                  const avail = questionAvailability[q.id];
                  const isCompleted = avail?.isComplete || false;
                  const isAvailable = avail?.available !== false;

                  return (
                    <div key={q.id} className={`bg-white rounded-2xl shadow-sm border p-6 ${isCompleted ? "border-green-200 bg-green-50" : "border-slate-100"}`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${isCompleted ? "bg-green-100 text-green-700" : "bg-brand-100 text-brand-700"}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-slate-800">{q.text}</p>
                            {isCompleted && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Respondido
                              </span>
                            )}
                          </div>
                          {q.description && <p className="text-sm text-slate-500 mb-4">{q.description}</p>}
                          <div className="flex gap-2 items-center mb-4">
                            <p className="text-xs text-brand-600 font-medium">Opciones con puntaje</p>
                            {q.frequencyType && q.frequencyType !== "UNICA" && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {q.frequencyType === "DIARIA" && "📅 Diaria"}
                                {q.frequencyType === "SEMANAL" && `📆 Semanal (${q.frequencyDay ? ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][q.frequencyDay-1] : 'Lun'})`}
                                {q.frequencyType === "MENSUAL" && `🗓️ Mensual (día ${q.frequencyDay || 1})`}
                                {q.frequencyType === "ANUAL" && "📋 Anual"}
                                {q.frequencyType === "DIA_ESPECIFICO" && `📅 Día ${q.frequencyDay || 1} del mes`}
                              </span>
                            )}
                            {avail?.currentPeriod && (
                              <span className="text-xs text-slate-500">
                                Período actual: {new Date(avail.currentPeriod.periodStart).toLocaleDateString()} - {new Date(avail.currentPeriod.periodEnd).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* OPCIONES DE RESPUESTA - solo si está disponible */}
                          {isAvailable && q.options && q.options.length > 0 && (
                            <div className="mb-4 space-y-2">
                              <p className="text-sm font-medium text-slate-700 mb-2">Selecciona una opción:</p>
                              {q.options.map((option) => (
                                <label
                                  key={option.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                                    selectedOptions[q.id] === option.id
                                      ? "border-brand-600 bg-brand-50"
                                      : isCompleted
                                        ? "border-slate-100 bg-slate-50 opacity-50"
                                        : "border-slate-200 hover:border-brand-300 cursor-pointer"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    checked={selectedOptions[q.id] === option.id}
                                    onChange={() => handleOptionSelect(q.id, option.id)}
                                    disabled={isCompleted}
                                    className="mt-0.5 text-brand-600"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? "bg-slate-300 text-slate-500" : "bg-brand-600 text-white"}`}>
                                        {option.label}
                                      </span>
                                      <span className={`text-sm ${isCompleted ? "text-slate-400" : "text-slate-800"}`}>{option.text}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 ml-8">Valor: {option.score} puntos</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* Si está completado, mostrar estado deshabilitado */}
                          {isCompleted && (
                            <div className="mt-4 p-4 bg-slate-100 rounded-lg">
                              <p className="text-sm text-slate-600 text-center">
                                Esta pregunta ya fue respondida en el período actual. Podrás responder nuevamente en el próximo período.
                              </p>
                            </div>
                          )}

                          {/* Archivos - solo si no está completado */}
                          {!isCompleted && q.configs && q.configs.length > 0 && (
                            <div className="space-y-4">
                              {q.configs?.map((config) => {
                                if (config.fileType === "IN_SITU") {
                                  return (
                                    <div key={config.id} className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                                      <div className="flex items-start gap-3">
                                        <div className="text-2xl">📋</div>
                                        <div className="flex-1">
                                          <p className="text-sm font-semibold text-amber-800 mb-1">
                                            IN SITU - Revisión Presencial
                                          </p>
                                          <p className="text-xs text-amber-700">
                                            Este punto se verificará mediante revisión presencial. No se requiere subir documentos.
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600">
                                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span className="text-xs font-medium">Completado</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                const questionFiles = answers[q.id] || [];
                                const ofType = questionFiles.filter(f => f.fileType === config.fileType);
                                const remaining = config.maxFiles - ofType.length;

                                return (
                                  <div key={config.id} className="bg-slate-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm font-medium text-slate-700">
                                        {getFileTypeLabel(config.fileType)}
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        {ofType.length}/{config.maxFiles} archivos
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {ofType.map((f, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                                        >
                                          {f.fileName.slice(0, 20)}...
                                          <button
                                            type="button"
                                            onClick={() => removeFile(q.id, questionFiles.indexOf(f))}
                                            className="ml-1 text-green-600 hover:text-green-800"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>

                                    {remaining > 0 && (
                                      <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="file"
                                          ref={(el) => { if (el) fileInputRefs.current[`${q.id}-${config.fileType}`] = el; }}
                                          accept={getFileAccept(config.fileType)}
                                          multiple={remaining > 1}
                                          onChange={(e) => handleFileChange(q.id, config, e.target.files)}
                                          className="hidden"
                                        />
                                        <span
                                          className="px-3 py-1.5 text-sm rounded-lg border-2 border-slate-200 hover:border-brand-400 text-slate-600 hover:text-brand-600 transition-colors"
                                        >
                                          + Agregar {getFileTypeLabel(config.fileType)}
                                        </span>
                                      </label>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {hasAllRequiredFiles(q) && !isCompleted && (
                            <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Completado (opción seleccionada + evidencia cargada)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !allQuestionsComplete}
                  className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Enviando..." : "Enviar evaluación de Mis Programas"}
                </button>

                {!allQuestionsComplete && (
                  <p className="text-center text-sm text-slate-500">
                    Selecciona una opción y completa todos los archivos requeridos para poder enviar.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
