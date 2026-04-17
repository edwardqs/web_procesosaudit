import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";
import pauserLogo from "../assets/pauser_logo_procesos-removebg-preview.png";

interface QuestionConfig {
  id: number;
  fileType: string;
  maxFiles: number;
}

interface Question {
  id: number;
  text: string;
  description?: string;
  frequencyType?: string;
  frequencyDay?: number | null;
  frequencyInterval?: number | null;
  order: number;
  configs: QuestionConfig[];
  options?: QuestionOption[];
}

interface QuestionOption {
  id: number;
  label: string;
  text: string;
  score: number;
}

interface AnswerFile {
  fileType: string;
  fileName: string;
  fileUrl: string;
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
  totalScore: number;
  maxScore: number;
  completedAt: string;
  questions: QuestionHistory[];
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

export default function ExcelenciaUser() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [questionId: number]: AnswerFile[] }>({});
  const [selectedOptions, setSelectedOptions] = useState<{ [questionId: number]: number | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [myResult, setMyResult] = useState<EvaluationResult | null>(null);
  const [myHistory, setMyHistory] = useState<HistoryEvaluation[]>([]);
  const [questionAvailability, setQuestionAvailability] = useState<{ [qId: number]: { available: boolean; isComplete: boolean; currentPeriod: { periodStart: string; periodEnd: string } | null } }>({});
  const [campaignMessage, setCampaignMessage] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const cargoId = user?.cargo?.id;
      const qRes = await api.get(cargoId ? `/questions?cargoId=${cargoId}&targetType=EXCELENCIA` : "/questions?targetType=EXCELENCIA");
      setQuestions(qRes.data);
      
      const availRes = await api.get("/evaluations/question-availability", {
        params: { source: "EXCELENCIA" },
      });
      
      if (availRes.data.message) {
        setCampaignMessage(availRes.data.message);
      }
      
      const availMap: { [qId: number]: { available: boolean; isComplete: boolean; currentPeriod: { periodStart: string; periodEnd: string } | null } } = {};
      availRes.data.questions?.forEach((q: any) => {
        availMap[q.id] = {
          available: q.available,
          isComplete: q.isComplete,
          currentPeriod: q.currentPeriod,
        };
      });
      setQuestionAvailability(availMap);

      const initialAnswers: { [questionId: number]: AnswerFile[] } = {};
      const initialOptions: { [questionId: number]: number | null } = {};
      const draftStr = localStorage.getItem(`pauser_answers_draft_${cargoId || 'normal'}`);
      const draft = draftStr ? JSON.parse(draftStr) : null;

      qRes.data.forEach((q: Question) => {
        initialAnswers[q.id] = draft?.[q.id]?.files || [];
        initialOptions[q.id] = draft?.[q.id]?.optionId || null;
      });
      setAnswers(initialAnswers);
      setSelectedOptions(initialOptions);

      const resultRes = await api.get("/evaluations/my-result", {
        params: { source: "EXCELENCIA" },
      });
      setMyResult(resultRes.data.evaluation);

      const historyRes = await api.get("/evaluations/my-history", {
        params: { source: "EXCELENCIA" },
      });
      setMyHistory(historyRes.data.evaluations || []);
    } catch (err) {
      // silently handled — loading state covers UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      const cargoId = user?.cargo?.id;
      const draftData: { [questionId: number]: { files: AnswerFile[]; optionId: number | null } } = {};
      Object.keys(answers).forEach(qId => {
        draftData[parseInt(qId)] = {
          files: answers[parseInt(qId)],
          optionId: selectedOptions[parseInt(qId)] || null,
        };
      });
      localStorage.setItem(`pauser_answers_draft_${cargoId || 'normal'}`, JSON.stringify(draftData));
    }
  }, [answers, selectedOptions, loading, user]);

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
    
    for (const config of question.configs) {
      // IN_SITU no requiere archivos, se considera completado automáticamente
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

      const payload = questions.map(q => ({
        questionId: q.id,
        optionId: selectedOptions[q.id],
        files: answers[q.id] || [],
      }));

      await api.post("/evaluations/submit", {
        campaignId: campaignRes.data.id,
        answers: payload,
        source: "EXCELENCIA",
      });

      const cargoId = user?.cargo?.id;
      localStorage.removeItem(`pauser_answers_draft_${cargoId || 'normal'}`);
      
      alert("¡Evaluación enviada exitosamente!");
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = axiosErr.response?.data?.error || axiosErr.message || "Error al enviar evaluación";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const allQuestionsComplete = questions
    .filter(q => questionAvailability[q.id]?.available !== false)
    .every(q => hasAllRequiredFiles(q));

  const hasAvailableQuestions = questions.some(q => questionAvailability[q.id]?.available && !questionAvailability[q.id]?.isComplete);

  if (myResult?.completedAt && !hasAvailableQuestions) {
    const percentage = myResult.maxScore > 0 ? Math.round((myResult.totalScore / myResult.maxScore) * 100) : 0;

    return (
      <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
        <header className="bg-sidebar h-16 flex items-center px-6 shadow-lg">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={pauserLogo} alt="Pauser" className="h-10 w-auto" />
            </div>
            <button onClick={() => navigate("/home")} className="text-white/80 hover:text-white text-sm font-medium">
              ← Volver
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Evaluación Completada</h2>

            <div className="mb-6">
              <p className="text-6xl font-bold text-brand-600">{myResult.totalScore}</p>
              <p className="text-slate-500">puntos de {myResult.maxScore}</p>
            </div>

            {(myResult as any).adminPublishedAt && (
              <div className="mt-6 p-6 bg-brand-50 border-2 border-brand-200 rounded-xl text-left shadow-sm">
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
                        <p className="font-medium text-slate-800">{ev.source}</p>
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
                                {(p as any).files && (p as any).files.length > 0 && (
                                  <div className="ml-2 mt-1 flex flex-wrap gap-1">
                                    {(p as any).files.map((f: any, i: number) => (
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      <header className="bg-sidebar h-16 flex items-center px-6 shadow-lg">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-3">
          <img src={pauserLogo} alt="Pauser" className="h-10 w-auto" />
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Autoevaluación Mensual</h2>
          <p className="text-slate-500 mb-8">
            Selecciona una opción para cada pregunta y sube la evidencia solicitada. El puntaje depende de la opción seleccionada.
          </p>

          {loading ? (
            <p className="text-slate-500">Cargando...</p>
          ) : campaignMessage ? (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-200 p-8 text-center text-slate-500">
               {campaignMessage}
            </div>
          ) : questions.length === 0 ? (
            <p className="text-slate-500">No hay preguntas disponibles en este momento.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, i) => {
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
                            {q.configs.map((config) => {
                              // Si es IN_SITU, mostrar mensaje especial
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

                          // Para los demás tipos de archivo, mostrar la UI normal
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
                {submitting ? "Enviando..." : "Enviar mi evaluación"}
              </button>

              {!allQuestionsComplete && (
                <p className="text-center text-sm text-slate-500">
                  Selecciona una opción y completa todos los archivos requeridos para poder enviar.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}