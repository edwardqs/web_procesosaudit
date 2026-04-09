import { useEffect, useState } from "react";
import api from "../services/api";

interface Question {
  id: number;
  text: string;
  evidenceType: string;
  order: number;
  isActive: boolean;
}

interface Result {
  id: number;
  totalScore: number;
  completedAt: string;
  user: { id: number; name: string; email: string };
}

export default function ExcelenciaAdmin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "results">("questions");
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({ text: "", evidenceType: "IMAGEN", order: 0 });

  useEffect(() => {
    if (activeTab === "questions") {
      fetchQuestions();
    } else {
      fetchResults();
    }
  }, [activeTab]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get("/questions");
      setQuestions(res.data);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await api.get("/evaluations/results");
      setResults(res.data);
    } catch (err) {
      console.error("Error fetching results:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, formData);
      } else {
        await api.post("/questions", formData);
      }
      setShowModal(false);
      setEditingQuestion(null);
      setFormData({ text: "", evidenceType: "IMAGEN", order: 0 });
      fetchQuestions();
    } catch (err) {
      console.error("Error saving question:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta pregunta?")) return;
    try {
      await api.delete(`/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      console.error("Error deleting question:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Programa de Excelencia - ADMIN</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "questions"
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Gestión de Preguntas
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "results"
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Resultados
          </button>
        </div>

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Preguntas</h2>
              <button
                onClick={() => {
                  setShowModal(true);
                  setEditingQuestion(null);
                  setFormData({ text: "", evidenceType: "IMAGEN", order: questions.length + 1 });
                }}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
              >
                + Nueva Pregunta
              </button>
            </div>

            {loading ? (
              <p className="text-slate-500">Cargando...</p>
            ) : questions.length === 0 ? (
              <p className="text-slate-500">No hay preguntas creadas.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">
                        {i + 1}. {q.text}
                      </p>
                      <p className="text-sm text-slate-500">
                        Tipo de evidencia: {q.evidenceType} | Orden: {q.order}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setFormData({ text: q.text, evidenceType: q.evidenceType, order: q.order });
                          setShowModal(true);
                        }}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Ranking de Evaluaciones</h2>

            {loading ? (
              <p className="text-slate-500">Cargando...</p>
            ) : results.length === 0 ? (
              <p className="text-slate-500">No hay evaluaciones completadas.</p>
            ) : (
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
                        <span className={`px-3 py-1 rounded-full font-medium ${
                          r.totalScore >= 18 ? "bg-green-100 text-green-700" :
                          r.totalScore >= 10 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {r.totalScore} puntos
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(r.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                {editingQuestion ? "Editar Pregunta" : "Nueva Pregunta"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pregunta</label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Evidencia</label>
                  <select
                    value={formData.evidenceType}
                    onChange={(e) => setFormData({ ...formData, evidenceType: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="IMAGEN">Imagen</option>
                    <option value="PDF">PDF</option>
                    <option value="PPT">PowerPoint</option>
                    <option value="EXCEL">Excel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Orden</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingQuestion(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
                  >
                    {editingQuestion ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}