import { useState, useEffect } from "react";
import api from "../services/api";

interface StructureMap {
  sheetName: string;
  totalRows: number;
  totalCols: number;
  cells: { cell: string; value: string; isStatic: boolean; isInput: boolean }[];
  inputs: { cell: string; label: string }[];
  mergedCells: { range: string }[];
  checksum: { rowCount: number; colCount: number; staticHeaders: { cell: string; value: string }[] };
}

interface RegistroRuta {
  numero: number;
  mes: string;
  nombre: string;
  salio_a_ruta: string;
  comentario: string;
  dni: string;
  fv_dni: string | null;
  tiempo_venc_dni: number | null;
  status_dni: string | null;
  brevete: string;
  categoria_brevete: string;
  fv_brevete: string | null;
  tiempo_venc_brevete: number | null;
  status_brevete: string | null;
}

interface MonthlyRecord {
  id?: number;
  configId?: number;
  period: string;
  data: Record<string, string>;
  status: string;
  source: string;
  completedAt?: string;
}

interface ExcelConfigModalProps {
  program: { id: number; name: string };
  onClose: () => void;
}

export default function ExcelConfigModal({ program, onClose }: ExcelConfigModalProps) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [structureMap, setStructureMap] = useState<StructureMap | null>(null);
  const [inputs, setInputs] = useState<{ cell: string; label: string }[]>([]);
  const [frequencyType, setFrequencyType] = useState("MENSUAL");
  const [executionDay, setExecutionDay] = useState(5);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [periodData, setPeriodData] = useState<Record<string, string>>({});
  const [registros, setRegistros] = useState<RegistroRuta[]>([]);
  const [editingRecord, setEditingRecord] = useState(false);
  const [recordSummary, setRecordSummary] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
    fetchRecords();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get(`/program-files/${program.id}/config`);
      if (res.data) {
        setFileName(res.data.fileName);
        setStructureMap(res.data.structureMap);
        setInputs(res.data.structureMap?.inputs || []);
        setFrequencyType(res.data.frequencyType || "MENSUAL");
        setExecutionDay(res.data.executionDay || 5);
        setStep(4);
      }
    } catch {}
  };

  const fetchRecords = async () => {
    try {
      const res = await api.get(`/program-files/${program.id}/records`);
      setRecords(res.data || []);
    } catch {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/program-files/${program.id}/upload-template`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFileName(res.data.fileName);
      setStructureMap(res.data.structureMap);
      setInputs([]);
      setStep(2);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al procesar archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!structureMap) return;
    setLoading(true);
    try {
      const mapWithInputs = { ...structureMap };
      await api.put(`/program-files/${program.id}/config`, {
        fileName,
        structureMap: mapWithInputs,
        frequencyType,
        executionDay,
      });
      setStep(4);
      fetchConfig();
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const openPeriodRecord = async (period: string) => {
    try {
      const res = await api.get(`/program-files/${program.id}/records/${period}`);
      const summaries = await api.get(`/program-files/${program.id}/records/${period}/summary`).catch(() => ({ data: null }));
      setSelectedPeriod(period);
      setPeriodData((res.data.data as any)?.registros ? {} : res.data.data || {});
      setRegistros((res.data.data as any)?.registros || []);
      setRecordSummary(summaries.data);
      setEditingRecord(true);
    } catch {}
  };

  const savePeriodData = async () => {
    try {
      await api.post(`/program-files/${program.id}/records/${selectedPeriod}`, {
        data: periodData,
        status: "COMPLETADO",
        source: "MANUAL",
      });
      fetchRecords();
      setEditingRecord(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al guardar");
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPeriod) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`/program-files/${program.id}/records/${selectedPeriod}/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchRecords();
      setEditingRecord(false);
      alert("✅ Importado correctamente");
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al importar");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETADO": return "text-green-600";
      case "PENDIENTE": return "text-yellow-600";
      case "VENCIDO": return "text-red-600";
      default: return "text-slate-500";
    }
  };

  const numberToCell = (row: number, col: number): string => {
    let cell = "";
    for (; col > 0; col = Math.floor((col - 1) / 26)) {
      cell = String.fromCharCode(((col - 1) % 26) + 65) + cell;
    }
    return cell + row;
  };

  const renderGrid = () => {
    if (!structureMap) return null;
    return (
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="text-xs border-collapse">
          <tbody>
            {Array.from({ length: Math.min(structureMap.totalRows, 20) }, (_, r) => (
               <tr key={r}>
                {Array.from({ length: Math.min(structureMap.totalCols, 20) }, (_, c) => {
                  const addr = numberToCell(r + 1, c + 1);
                  const cell = structureMap.cells.find((ce) => ce.cell === addr);
                  return (
                    <td
                      key={c}
                      className="border border-slate-200 px-2 py-1 truncate max-w-[150px]"
                    >
                      {cell?.value || ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            📊 Config Excel - {program.name}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* Steps indicator */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 text-center py-2 rounded-lg text-sm font-medium ${
                step >= s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {s === 1 && "📤 Subir"}
              {s === 2 && "🎯 Inputs"}
              {s === 3 && "📅 Frecuencia"}
              {s === 4 && "📋 Históricoo"}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" id="excel-upload" />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-slate-600">Arrastra tu archivo .xlsx aquí</p>
                <p className="text-xs text-slate-400 mt-2">Solo hoja 1 - Máximo 5MB</p>
              </label>
            </div>
            {loading && <p className="text-center text-slate-500">Procesando...</p>}
          </div>
        )}

        {/* Step 2: Mark inputs */}
        {step === 2 && structureMap && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Vista previa del Excel (Mapeo automático por nombres de columna):
            </p>
            {renderGrid()}
            <button
              onClick={() => setStep(3)}
              className="w-full py-2 bg-brand-600 text-white rounded-lg"
            >
              Confirmar Diseño y Continuar
            </button>
          </div>
        )}

        {/* Step 3: Frequency */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frecuencia</label>
              <select
                value={frequencyType}
                onChange={(e) => setFrequencyType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="MENSUAL">Mensual</option>
                <option value="SEMANAL">Semanal</option>
                <option value="UNICA">Única</option>
              </select>
            </div>
            {frequencyType === "MENSUAL" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Día del mes esperado (1-31)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={executionDay}
                  onChange={(e) => setExecutionDay(parseInt(e.target.value))}
                  className="w-24 px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Cada día {executionDay} del mes se registrará este historial
                </p>
              </div>
            )}
            <button
              onClick={handleSaveConfig}
              disabled={loading}
              className="w-full py-2 bg-brand-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? "Guardando..." : "✅ Activar configuración"}
            </button>
          </div>
        )}

        {/* Step 4: History */}
        {step === 4 && !editingRecord && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">📅 Histórico de cargas</h3>
              <div className="flex gap-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => openPeriodRecord(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  {records.map((r) => (
                    <option key={r.period} value={r.period}>{r.period}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const today = new Date();
                    const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
                    setSelectedPeriod(period);
                    setPeriodData({});
                    setRegistros([]);
                    setEditingRecord(true);
                  }}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  + Importar nuevo
                </button>
              </div>
            </div>
            {records.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Sin registros</p>
            ) : (
              <div className="text-xs text-slate-500 mb-2">
                Selecciona un período del dropdown para ver sus datos
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full py-2 border border-slate-200 rounded-lg"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Edit period - Tabla de personas con status */}
        {editingRecord && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Período: {selectedPeriod}</h3>
              <button onClick={() => setEditingRecord(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            {/* Resumen */}
            {recordSummary && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <span className="font-medium">DNI:</span> {recordSummary.totalPersonas} personas
                  <div className="flex gap-2 mt-1">
                    <span className="text-green-600">✓ {recordSummary.dni?.vigentes || 0}</span>
                    <span className="text-yellow-600">⚠ {recordSummary.dni?.porVencer || 0}</span>
                    <span className="text-red-600">✕ {recordSummary.dni?.vencidos || 0}</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Brevete:</span>
                  <div className="flex gap-2 mt-1">
                    <span className="text-green-600">✓ {recordSummary.brevete?.vigentes || 0}</span>
                    <span className="text-yellow-600">⚠ {recordSummary.brevete?.porVencer || 0}</span>
                    <span className="text-red-600">✕ {recordSummary.brevete?.vencidos || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {registros.length > 0 ? (
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
                      <th className="px-2 py-1 text-left">Brevete</th>
                      <th className="px-2 py-1 text-left">Cat.</th>
                      <th className="px-2 py-1 text-left">F.V.</th>
                      <th className="px-2 py-1 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r) => (
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
                        <td className="px-2 py-1">{r.brevete || "-"}</td>
                        <td className="px-2 py-1">{r.categoria_brevete || "-"}</td>
                        <td className="px-2 py-1">{r.fv_brevete || "-"}</td>
                        <td className="px-2 py-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            r.status_brevete === "VENCIDO" ? "bg-red-100 text-red-700" :
                            r.status_brevete === "POR VENCER" ? "bg-yellow-100 text-yellow-700" :
                            r.status_brevete === "VIGENTE" ? "bg-green-100 text-green-700" :
                            "bg-slate-100 text-slate-500"
                          }`}>{r.status_brevete || "-"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2">
                {inputs.length > 0 ? (
                  inputs.map((inp) => (
                    <div key={inp.cell} className="flex items-center gap-2">
                      <label className="w-24 text-sm text-slate-600">{inp.label}</label>
                      <input
                        type="text"
                        value={periodData[inp.cell] || ""}
                        onChange={(e) =>
                          setPeriodData({ ...periodData, [inp.cell]: e.target.value })
                        }
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Sin datos disponibles</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleImportExcel}
                className="hidden"
                id="import-excel"
              />
              <label
                htmlFor="import-excel"
                className="flex-1 py-2 text-center border rounded-lg text-sm cursor-pointer"
              >
                📥 Importar Excel
              </label>
              <button
                onClick={savePeriodData}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm"
              >
                💾 Guardar
              </button>
              <button
                onClick={() => setEditingRecord(false)}
                className="flex-1 py-2 border rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}