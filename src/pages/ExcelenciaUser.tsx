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
  points?: number;
  order: number;
  configs: QuestionConfig[];
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

export default function ExcelenciaUser() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [questionId: number]: AnswerFile[] }>({});
  const [submitting, setSubmitting] = useState(false);
  const [myResult, setMyResult] = useState<EvaluationResult | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const cargoId = (user as any)?.cargo?.id;
      const qRes = await api.get(cargoId ? `/questions?cargoId=${cargoId}` : "/questions");
      setQuestions(qRes.data);
      
      const initialAnswers: { [questionId: number]: AnswerFile[] } = {};
      const draftStr = localStorage.getItem(`pauser_answers_draft_${cargoId || 'normal'}`);
      const draft = draftStr ? JSON.parse(draftStr) : null;

      qRes.data.forEach((q: Question) => {
        initialAnswers[q.id] = draft?.[q.id] || [];
      });
      setAnswers(initialAnswers);

      const resultRes = await api.get("/evaluations/my-result");
      setMyResult(resultRes.data.evaluation);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      const cargoId = (user as any)?.cargo?.id;
      localStorage.setItem(`pauser_answers_draft_${cargoId || 'normal'}`, JSON.stringify(answers));
    }
  }, [answers, loading, user]);

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
        console.error("Error subiendo archivo:", err);
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

  const hasAllRequiredFiles = (question: Question) => {
    const questionFiles = answers[question.id] || [];
    for (const config of question.configs) {
      const ofType = questionFiles.filter(f => f.fileType === config.fileType).length;
      if (ofType < config.maxFiles) return false;
    }
    return true;
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
        files: answers[q.id] || [],
      }));

      await api.post("/evaluations/submit", {
        campaignId: campaignRes.data.id,
        answers: payload,
      });

      const cargoId = (user as any)?.cargo?.id;
      localStorage.removeItem(`pauser_answers_draft_${cargoId || 'normal'}`);
      
      alert("¡Evaluación enviada exitosamente!");
      fetchData();
    } catch (err: any) {
      console.error("Error submitting evaluation:", err);
      const errorMessage = err.response?.data?.error || err.message || "Error al enviar evaluación";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const allQuestionsComplete = questions.every(q => hasAllRequiredFiles(q));

  if (myResult?.completedAt) {
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Programa de Excelencia</h2>
          <p className="text-slate-500 mb-8">
            Sube la evidencia solicitada. Cada respuesta con archivos válidos suma 3 puntos.
          </p>

          {loading ? (
            <p className="text-slate-500">Cargando...</p>
          ) : questions.length === 0 ? (
            <p className="text-slate-500">No hay preguntas disponibles en este momento.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 mb-2">{q.text}</p>
                      {q.description && <p className="text-sm text-slate-500 mb-4">{q.description}</p>}
                      <p className="text-xs text-brand-600 font-medium mb-4">{q.points || 3} puntos</p>

                      <div className="space-y-4">
                        {q.configs.map((config) => {
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
                          <span>Completado</span>
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
                {submitting ? "Enviando..." : "Enviar mi evaluación"}
              </button>

              {!allQuestionsComplete && (
                <p className="text-center text-sm text-slate-500">
                  Completa todos los archivos requeridos para poder enviar.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}