import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import pauserLogo from "../assets/pauser_logo_procesos-removebg-preview.png";

interface Question {
  id: number;
  text: string;
  evidenceType: string;
  order: number;
}

interface Answer {
  questionId: number;
  hasEvidence: boolean;
  submittedFileType: string | null;
}

interface EvaluationResult {
  id: number;
  totalScore: number;
  completedAt: string;
  answers: { question: Question; awardedScore: number }[];
}

export default function ExcelenciaUser() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [myResult, setMyResult] = useState<EvaluationResult | null>(null);
  const fileInputs = useRef<{ [key: number]: HTMLInputElement }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch questions
      const qRes = await api.get("/questions");
      setQuestions(qRes.data);
      setAnswers(
        qRes.data.map((q: Question) => ({
          questionId: q.id,
          hasEvidence: false,
          submittedFileType: null,
        }))
      );

      // Check if user already submitted
      const resultRes = await api.get("/evaluations/my-result");
      setMyResult(resultRes.data.evaluation);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (questionId: number, file: File | null, type: string) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionId === questionId
          ? {
              ...a,
              hasEvidence: file !== null,
              submittedFileType: type,
            }
          : a
      )
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const campaignRes = await api.get("/campaigns/active");
      if (!campaignRes.data) {
        alert("No hay campaña activa");
        return;
      }

      await api.post("/evaluations/submit", {
        campaignId: campaignRes.data.id,
        answers,
      });

      alert("¡Evaluación enviada exitosamente!");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al enviar evaluación");
    } finally {
      setSubmitting(false);
    }
  };

  const fileTypeLabels: Record<string, string> = {
    IMAGEN: "Imagen",
    PDF: "PDF",
    PPT: "PowerPoint",
    EXCEL: "Excel",
  };

  // Already submitted - show result
  if (myResult?.completedAt) {
    const maxScore = questions.length * 3;
    const percentage = Math.round((myResult.totalScore / maxScore) * 100);

    return (
      <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
        <header className="bg-sidebar h-16 flex items-center px-6 shadow-lg">
          <div className="max-w-6xl mx-auto w-full flex items-center gap-3">
            <img src={pauserLogo} alt="Pauser" className="h-10 w-auto" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Evaluación Completada</h2>

            <div className="mb-6">
              <p className="text-6xl font-bold text-brand-600">{myResult.totalScore}</p>
              <p className="text-slate-500">puntos obtenidos</p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-4 mb-4">
              <div
                className="bg-brand-600 h-4 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p className="text-sm text-slate-500">
              Fecha: {new Date(myResult.completedAt).toLocaleDateString()}
            </p>

            <p className="mt-6 text-slate-600">
              {percentage >= 60
                ? "¡Felicidades! Has completado la evaluación."
                : "Sigue participando en las próximas campañas."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Not submitted - show form
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
            Sube la evidencia solicitada. Cada archivo válido suma 3 puntos.
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
                      <p className="font-medium text-slate-800 mb-3">{q.text}</p>
                      <p className="text-sm text-slate-500 mb-4">
                        Sube tu evidencia: {fileTypeLabels[q.evidenceType] || q.evidenceType}
                      </p>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="file"
                          ref={(el) => { fileInputs.current[q.id] = el!; }}
                          accept={
                            q.evidenceType === "IMAGEN" ? "image/*" :
                            q.evidenceType === "PDF" ? ".pdf" :
                            q.evidenceType === "PPT" ? ".ppt,.pptx" :
                            ".xlsx,.xls"
                          }
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileChange(q.id, file, q.evidenceType);
                            }
                          }}
                          className="hidden"
                        />
                        <span
                          className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                            answers.find((a) => a.questionId === q.id)?.hasEvidence
                              ? "border-green-500 bg-green-50 text-green-700"
                              : "border-slate-200 hover:border-brand-400"
                          }`}
                          onClick={() => fileInputs.current[q.id]?.click()}
                        >
                          {answers.find((a) => a.questionId === q.id)?.hasEvidence
                            ? "✓ Archivo seleccionado"
                            : "Seleccionar archivo"}
                        </span>
                        <span className="text-sm text-slate-500">
                          ({q.evidenceType === "IMAGEN" ? "jpg, png" : q.evidenceType})
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  answers.filter((a) => a.hasEvidence).length === questions.length
                }
                className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Enviando..." : "Enviar mi evaluación"}
              </button>

              <p className="text-center text-sm text-slate-500">
                Responde todas las preguntas para poder enviar.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}