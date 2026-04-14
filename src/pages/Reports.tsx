import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

interface ComparisonData {
  month: string;
  current: {
    excelencia: {
      totalScore: number;
      maxScore: number;
      percentage: number;
      completedAt: string | null;
      questions: QuestionDetail[];
    } | null;
    misProgramas: {
      totalScore: number;
      maxScore: number;
      percentage: number;
      completedAt: string | null;
      questions: QuestionDetail[];
    } | null;
  };
  difference: number | null;
  history: HistoryEntry[];
  cargoStats: CargoStat[] | null;
}

interface QuestionDetail {
  questionId: number;
  questionText: string;
  awardedScore: number;
  optionSelected: string | null;
  optionText: string | null;
  maxScore: number;
  hasFiles: boolean;
  files: { fileType: string; fileName: string }[];
}

interface HistoryEntry {
  month: string;
  source: string;
  avg_score: number;
  max_score: number;
  count: number;
}

interface CargoStat {
  cargo: string;
  excelencia: { count: number; avg: number };
  misProgramas: { count: number; avg: number };
}

const SOURCE_COLORS = { EXCELENCIA: "#3b82f6", MIS_PROGRAMAS: "#10b981" };

export default function Reports() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roleId === 1;
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState<ComparisonData | null>(null);
  const [view, setView] = useState<"comparison" | "questions" | "history">("comparison");

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/monthly-comparison", {
        params: { month: selectedMonth },
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  // Generar opciones de meses (últimos 6 meses)
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
    };
  }).reverse();

  // Datos para gráfico de barras (comparación)
  const barData = data?.current
    ? [
        {
          name: "Puntaje",
          Excelencia: data.current.excelencia?.totalScore || 0,
          "Mis Programas": data.current.misProgramas?.totalScore || 0,
        },
      ]
    : [];

  // Datos para gráfico circular (porcentajes)
  const pieData = [
    { name: "Excelencia", value: data?.current.excelencia?.percentage || 0, fill: SOURCE_COLORS.EXCELENCIA },
    { name: "Mis Programas", value: data?.current.misProgramas?.percentage || 0, fill: SOURCE_COLORS.MIS_PROGRAMAS },
  ].filter(d => d.value > 0);

  // Datos para histórico (línea)
  const historyChartData = (data?.history || []).map((h: any) => ({
    month: new Date(h.month).toLocaleDateString("es-ES", { month: "short" }),
    source: h.source === "EXCELENCIA" ? "Excelencia" : "Mis Programas",
    score: Number(h.avg_score),
    max: Number(h.max_score),
  }));

  // Agrupar histórico por mes para gráfico de líneas
  const groupedHistory: Record<string, { Excelencia: number; "Mis Programas": number }> = {};
  historyChartData.forEach(h => {
    if (!groupedHistory[h.month]) {
      groupedHistory[h.month] = { Excelencia: 0, "Mis Programas": 0 };
    }
    groupedHistory[h.month][h.source as "Excelencia" | "Mis Programas"] = h.score;
  });
  const lineChartData = Object.entries(groupedHistory).map(([month, scores]) => ({
    month,
    ...scores,
  }));

  // Datos por cargo (admin)
  const cargoBarData = (data?.cargoStats || []).map(c => ({
    cargo: c.cargo.length > 20 ? c.cargo.slice(0, 20) + "..." : c.cargo,
    Excelencia: c.excelencia.avg,
    "Mis Programas": c.misProgramas.avg,
  }));

  return (
    <Layout title="Reportes y Gráficos">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Reportes y Comparativas</h2>
            <p className="text-slate-500 text-sm">Análisis comparativo entre módulos</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600 font-medium">Mes:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {[
            { key: "comparison" as const, label: "📊 Comparación" },
            { key: "questions" as const, label: "📋 Por Pregunta" },
            { key: "history" as const, label: "📈 Histórico" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                view === tab.key
                  ? "bg-white text-brand-600 border-b-2 border-brand-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : !data ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No hay datos disponibles para este mes.</p>
          </div>
        ) : (
          <>
            {/* VIEW: Comparación */}
            {view === "comparison" && (
              <div className="space-y-6">
                {/* Cards resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <p className="text-sm text-slate-500 mb-1">Programa de Excelencia</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {data.current.excelencia?.totalScore || "-"}
                    </p>
                    <p className="text-sm text-slate-400">
                      de {data.current.excelencia?.maxScore || 0} puntos
                    </p>
                    {data.current.excelencia?.percentage != null && (
                      <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${data.current.excelencia.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <p className="text-sm text-slate-500 mb-1">Mis Programas</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {data.current.misProgramas?.totalScore || "-"}
                    </p>
                    <p className="text-sm text-slate-400">
                      de {data.current.misProgramas?.maxScore || 0} puntos
                    </p>
                    {data.current.misProgramas?.percentage != null && (
                      <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${data.current.misProgramas.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <p className="text-sm text-slate-500 mb-1">Diferencia</p>
                    <p className={`text-3xl font-bold ${
                      (data.difference || 0) > 0 ? "text-green-600" : (data.difference || 0) < 0 ? "text-red-600" : "text-slate-400"
                    }`}>
                      {data.difference !== null ? `${data.difference > 0 ? "+" : ""}${data.difference}` : "-"}
                    </p>
                    <p className="text-sm text-slate-400">
                      Excelencia vs Mis Programas
                    </p>
                  </div>
                </div>

                {/* Gráfico de barras */}
                {barData.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Comparación de Puntajes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Excelencia" fill={SOURCE_COLORS.EXCELENCIA} radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Mis Programas" fill={SOURCE_COLORS.MIS_PROGRAMAS} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Gráfico circular */}
                {pieData.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Porcentaje de Cumplimiento</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Por cargo (admin) */}
                {isAdmin && cargoBarData.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Promedio por Cargo</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={cargoBarData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="cargo" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Excelencia" fill={SOURCE_COLORS.EXCELENCIA} radius={[0, 8, 8, 0]} />
                        <Bar dataKey="Mis Programas" fill={SOURCE_COLORS.MIS_PROGRAMAS} radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: Por Pregunta */}
            {view === "questions" && (
              <div className="space-y-6">
                {data.current.excelencia?.questions && data.current.excelencia.questions.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Detalle por Pregunta - Excelencia</h3>
                    <div className="space-y-3">
                      {data.current.excelencia.questions.map((q, i) => (
                        <div key={q.questionId} className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">
                                <span className="text-slate-400 mr-2">{i + 1}.</span>
                                {q.questionText}
                              </p>
                              {q.optionText && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Respuesta: {q.optionText} ({q.optionSelected})
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-blue-600">{q.awardedScore}</p>
                              <p className="text-xs text-slate-400">de {q.maxScore}</p>
                            </div>
                          </div>
                          {q.hasFiles && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {q.files.map((f, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  📎 {f.fileType}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.current.misProgramas?.questions && data.current.misProgramas.questions.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Detalle por Pregunta - Mis Programas</h3>
                    <div className="space-y-3">
                      {data.current.misProgramas.questions.map((q, i) => (
                        <div key={q.questionId} className="p-4 bg-slate-50 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">
                                <span className="text-slate-400 mr-2">{i + 1}.</span>
                                {q.questionText}
                              </p>
                              {q.optionText && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Respuesta: {q.optionText} ({q.optionSelected})
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-emerald-600">{q.awardedScore}</p>
                              <p className="text-xs text-slate-400">de {q.maxScore}</p>
                            </div>
                          </div>
                          {q.hasFiles && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {q.files.map((f, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  📎 {f.fileType}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: Histórico */}
            {view === "history" && lineChartData.length > 0 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Tendencia Mensual</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Excelencia"
                        stroke={SOURCE_COLORS.EXCELENCIA}
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Mis Programas"
                        stroke={SOURCE_COLORS.MIS_PROGRAMAS}
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {view === "history" && lineChartData.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No hay datos históricos disponibles aún.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
