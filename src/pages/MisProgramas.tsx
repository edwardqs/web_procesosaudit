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

export default function MisProgramas() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // Estado para respuestas
  const [answers, setAnswers] = useState<{ [questionId: number]: AnswerFile[] }>({});
  const [selectedOptions, setSelectedOptions] = useState<{ [questionId: number]: number | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [myResult, setMyResult] = useState<EvaluationResult | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

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
      // Obtener resultado previo de Mis Programas
      const resultRes = await api.get("/evaluations/my-result", {
        params: { source: "MIS_PROGRAMAS" },
      });
      setMyResult(resultRes.data.evaluation);
      
      // Si ya hay evaluación completa, mostrar resultado
      if (resultRes.data.evaluation?.completedAt) {
        setMyResult(resultRes.data.evaluation);
      } else {
        // Cargar draft si existe
        const draftStr = localStorage.getItem(`pauser_mis_programas_draft`);
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
      localStorage.setItem(`pauser_mis_programas_draft`, JSON.stringify(draftData));
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
      });

      localStorage.removeItem(`pauser_mis_programas_draft`);

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

  const allQuestionsComplete = allQuestions.every(q => hasAllRequiredFiles(q));

  // Si hay resultado completo, mostrar pantalla de completado
  if (myResult?.completedAt && selectedProgram) {
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

            <div className="w-full bg-slate-100 rounded-full h-4 mb-4">
              <div className="bg-brand-600 h-4 rounded-full transition-all" style={{ width: `${percentage}%` }} />
            </div>

            <p className="text-sm text-slate-500">
              Fecha: {new Date(myResult.completedAt).toLocaleDateString()}
            </p>

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

            {allQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No hay preguntas asignadas a este programa.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {allQuestions.map((q, i) => (
                  <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 mb-2">{q.text}</p>
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
                        </div>

                        {/* OPCIONES DE RESPUESTA */}
                        {q.options && q.options.length > 0 && (
                          <div className="mb-4 space-y-2">
                            <p className="text-sm font-medium text-slate-700 mb-2">Selecciona una opción:</p>
                            {q.options.map((option) => (
                              <label
                                key={option.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  selectedOptions[q.id] === option.id
                                    ? "border-brand-600 bg-brand-50"
                                    : "border-slate-200 hover:border-brand-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  checked={selectedOptions[q.id] === option.id}
                                  onChange={() => handleOptionSelect(q.id, option.id)}
                                  className="mt-0.5 text-brand-600"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                      {option.label}
                                    </span>
                                    <span className="text-sm text-slate-800">{option.text}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 ml-8">Valor: {option.score} puntos</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}

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

                        {hasAllRequiredFiles(q) && (
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
                ))}

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
