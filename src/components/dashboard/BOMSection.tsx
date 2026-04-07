import React, { useEffect, useRef, useState } from "react";
import { FileText, Plus, Edit, Trash2, Download, Upload, Printer } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import axios from "../../api/axiosInstance";

type MaterialMasterItem = {
  _id?: string;
  name: string;
  unit: string;
  supplier: string;
  minStock?: number;
  currentStock?: number;
  unitPrice?: number;
};

type Material = {
  _id?: string;
  name: string;
  quantity: number;
  unit?: string;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  leadTimeDays: number;
};

type BOM = {
  _id?: string;
  productName: string;
  version?: string;
  lastUpdated?: string;
  totalCost: number;
  materials: Material[];
};

const emptyMaterial = (): Material => ({
  name: "",
  quantity: 0,
  unit: "",
  unitCost: 0,
  totalCost: 0,
  supplier: "",
  leadTimeDays: 0,
});

const BOMSection: React.FC = () => {
  const { isDark } = useTheme();
  const [boms, setBoms] = useState<BOM[]>([]);
  const [selectedBOMId, setSelectedBOMId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BOM>({
    productName: "",
    version: "",
    totalCost: 0,
    materials: [],
  });

  const [materialsMaster, setMaterialsMaster] = useState<MaterialMasterItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    initLoad();
  }, []);

  async function initLoad() {
    await loadBOMs();
    await loadMaterialMaster();
    await syncBOMMaterialsToMaster();
    await loadMaterialMaster();
  }

  async function syncBOMMaterialsToMaster() {
    try {
      await axios.post("/bom/sync");
    } catch (err) {
      console.error("Failed to sync BOM materials to master", err);
    }
  }

  async function loadBOMs() {
    setLoading(true);
    try {
      const res = await axios.get("/bom");
      const data = res.data?.data || res.data || [];
      setBoms(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        setSelectedBOMId(data[0]._id ?? null);
      } else {
        setSelectedBOMId(null);
      }
    } catch (err) {
      console.error("BOM Load Error:", err);
      setBoms([]);
      setSelectedBOMId(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMaterialMaster() {
    try {
      const res = await axios.get("/materials");
      const data = res.data?.data || res.data || [];
      setMaterialsMaster(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load material master", err);
    }
  }

  const currentBOM =
    boms.find((b) => b._id === selectedBOMId) || {
      productName: "No BOM",
      version: "",
      totalCost: 0,
      materials: [],
    };

  const startCreate = () => {
    setForm({ productName: "", version: "", totalCost: 0, materials: [] });
    setEditing(true);
  };

  const startEdit = (bom?: BOM) => {
    const copy = bom
      ? {
          ...bom,
          totalCost: Number(bom.totalCost || 0),
          materials: (bom.materials || []).map((m) => ({
            ...m,
            quantity: Number(m.quantity || 0),
            unitCost: Number(m.unitCost || 0),
            totalCost: Number(m.totalCost || 0),
            leadTimeDays: Number(m.leadTimeDays || 0),
          })),
        }
      : { productName: "", version: "", totalCost: 0, materials: [] };

    setForm(copy);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const addMaterialRow = () =>
    setForm((prev) => ({ ...prev, materials: [...prev.materials, emptyMaterial()] }));

  const removeMaterialRow = (i: number) =>
    setForm((prev) => {
      const materials = prev.materials.slice();
      materials.splice(i, 1);
      const totalCost = materials.reduce((s, m) => s + Number(m.totalCost || 0), 0);
      return { ...prev, materials, totalCost };
    });

  const onSelectMaterialFromMaster = (i: number, materialName: string) => {
    const master = materialsMaster.find((mm) => mm.name === materialName);
    setForm((prev) => {
      const materials = prev.materials.slice();
      const item = { ...(materials[i] || emptyMaterial()) } as any;
      item.name = materialName;
      if (master) {
        item.unit = master.unit || item.unit;
        item.unitCost = Number(master.unitPrice || item.unitCost || 0);
        item.supplier = master.supplier || item.supplier || "";
      }
      item.totalCost = parseFloat(((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)).toFixed(2));
      materials[i] = item;
      const totalCost = materials.reduce((s, m) => s + Number(m.totalCost || 0), 0);
      return { ...prev, materials, totalCost };
    });
  };

  const updateMaterialField = (i: number, field: keyof Material, value: any) => {
    setForm((prev) => {
      const materials = prev.materials.slice();
      const item = { ...(materials[i] || emptyMaterial()) } as any;

      if (["quantity", "unitCost", "leadTimeDays"].includes(field)) {
        item[field] = Number(value || 0);
      } else {
        item[field] = value;
      }

      item.totalCost = parseFloat(((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)).toFixed(2));
      materials[i] = item;
      const totalCost = materials.reduce((s, m) => s + Number(m.totalCost || 0), 0);
      return { ...prev, materials, totalCost };
    });
  };

  const saveBOM = async () => {
    try {
      if (!form.productName || form.productName.trim() === "") {
        alert("Please provide a product name.");
        return;
      }

      const cleanedMaterials = (form.materials || []).map((m) => ({
        name: (m.name || "").toString().trim(),
        quantity: Number(m.quantity || 0),
        unit: (m.unit || "").toString(),
        unitCost: Number(m.unitCost || 0),
        totalCost:
          Number(m.totalCost || 0) ||
          parseFloat((Number(m.quantity || 0) * Number(m.unitCost || 0)).toFixed(2)),
        supplier: (m.supplier || "").toString(),
        leadTimeDays: Number(m.leadTimeDays || 0),
      }));

      const payload = {
        productName: form.productName || "Unnamed Product",
        version: form.version || "",
        lastUpdated: new Date(),
        totalCost: cleanedMaterials.reduce((sum, x) => sum + Number(x.totalCost || 0), 0),
        materials: cleanedMaterials,
      };

      if (form._id) {
        await axios.put(`/bom/${form._id}`, payload);
      } else {
        await axios.post("/bom", payload);
      }

      await loadBOMs();
      await syncBOMMaterialsToMaster();
      await loadMaterialMaster();
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed. See console for details.");
    }
  };

  const handleDeleteBOM = async (id?: string) => {
    if (!id) return;
    if (!confirm("Delete this BOM?")) return;
    try {
      await axios.delete(`/bom/${id}`);
      await loadBOMs();
      setSelectedBOMId((prev) => (prev === id ? null : prev));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const exportBOMToCSV = (bomToExport?: BOM) => {
    const bom = bomToExport || (editing ? form : currentBOM);
    if (!bom) {
      alert("No BOM selected to export.");
      return;
    }

    const headers = [
      "productName",
      "version",
      "materialName",
      "quantity",
      "unit",
      "unitCost",
      "totalCost",
      "supplier",
      "leadTimeDays",
    ];
    const rows: string[] = [];

    bom.materials.forEach((m) => {
      const row = [
        csvEscape(bom.productName || ""),
        csvEscape(bom.version || ""),
        csvEscape(m.name || ""),
        (m.quantity || 0).toString(),
        csvEscape(m.unit || ""),
        Number(m.unitCost || 0).toString(),
        Number(m.totalCost || 0).toString(),
        csvEscape(m.supplier || ""),
        Number(m.leadTimeDays || 0).toString(),
      ];
      rows.push(row.join(","));
    });

    const csv = `${headers.join(",")}\n${rows.join("\n")}`;
    downloadString(csv, `${(bom.productName || "bom").replace(/\s+/g, "_")}.csv`, "text/csv");
  };

  const handleImportCSVFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = String(e.target?.result || "");
      try {
        const parsed = parseCSVToBOM(text);
        if (!parsed) {
          alert("Failed to parse CSV or CSV empty.");
          return;
        }
        setForm(parsed);
        setEditing(true);
      } catch (err) {
        console.error("CSV parse error", err);
        alert("CSV import failed (see console).");
      }
    };
    reader.readAsText(file);
  };

  function parseCSVToBOM(csvText: string): BOM | null {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length < 2) return null;
    const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1);
    const materials: Material[] = [];
    let productName = "";
    let version = "";

    for (const line of rows) {
      const cols = splitCsvLine(line);
      const map: Record<string, string> = {};
      for (let i = 0; i < header.length; i++) {
        map[header[i]] = cols[i] ? cols[i].replace(/^"|"$/g, "") : "";
      }
      productName = map["productName"] || productName || map["product"] || productName;
      version = map["version"] || version || "";
      const mName = map["materialName"] || map["name"] || "";
      if (!mName) continue;
      const qty = Number(map["quantity"] || "0") || 0;
      const unit = map["unit"] || "";
      const uc = Number(map["unitCost"] || map["unitPrice"] || "0") || 0;
      const totalCost = Number(map["totalCost"] || (qty * uc).toString()) || 0;
      const supplier = map["supplier"] || "";
      const lead = Number(map["leadTimeDays"] || "0") || 0;
      materials.push({
        name: mName,
        quantity: qty,
        unit,
        unitCost: uc,
        totalCost,
        supplier,
        leadTimeDays: lead,
      });
    }

    return {
      productName: productName || "Imported BOM",
      version: version || "",
      totalCost: materials.reduce((s, m) => s + Number(m.totalCost || 0), 0),
      materials,
    };
  }

  function csvEscape(val: string) {
    if (val == null) return '""';
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  function splitCsvLine(line: string): string[] {
    const res: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        res.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    res.push(cur);
    return res;
  }

  function downloadString(content: string, filename: string, mime = "text/plain") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const onClickImport = () => {
    fileInputRef.current?.click();
  };

  const printBOM = (bomToPrint?: BOM) => {
    const bom = bomToPrint || (editing ? form : currentBOM);
    if (!bom) {
      alert("No BOM to print");
      return;
    }
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      alert("Unable to open print window (popup blocked).");
      return;
    }
    const html = renderBomHtmlForPrint(bom);
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 500);
  };

  function renderBomHtmlForPrint(bom: BOM) {
    const rows = bom.materials
      .map(
        (m) =>
          `<tr>
            <td style="padding:6px;border:1px solid #ddd">${escapeHtml(m.name)}</td>
            <td style="padding:6px;border:1px solid #ddd;text-align:right">${m.quantity}</td>
            <td style="padding:6px;border:1px solid #ddd">${escapeHtml(m.unit || "")}</td>
            <td style="padding:6px;border:1px solid #ddd;text-align:right">${Number(m.unitCost || 0).toFixed(2)}</td>
            <td style="padding:6px;border:1px solid #ddd;text-align:right">${Number(m.totalCost || 0).toFixed(2)}</td>
            <td style="padding:6px;border:1px solid #ddd">${escapeHtml(m.supplier || "")}</td>
            <td style="padding:6px;border:1px solid #ddd;text-align:right">${m.leadTimeDays}</td>
          </tr>`
      )
      .join("\n");

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Print BOM - ${escapeHtml(bom.productName)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; color: #111 }
            h1 { margin: 0 0 8px 0; font-size: 20px }
            table { border-collapse: collapse; width: 100%; margin-top: 12px }
            th { padding:8px; border:1px solid #ddd; text-align:left; background:#f7f7f7 }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(bom.productName)}</h1>
          <div>Version: ${escapeHtml(bom.version || "")}</div>
          <div style="margin-top:8px">Total Cost: <strong>₹${Number(bom.totalCost || 0).toFixed(2)}</strong></div>
          <table>
            <thead>
              <tr>
                <th>Material</th><th>Qty</th><th>Unit</th><th>Unit Cost</th><th>Total</th><th>Supplier</th><th>Lead</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td style="padding:6px;border:1px solid #ddd" colspan="7">No materials</td></tr>`}
            </tbody>
          </table>
        </body>
      </html>`;
  }

  function escapeHtml(s: string) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c] || c));
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(n) || 0);

  const formatLead = (d: number) => `${Number(d || 0)} days`;

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold">Bill of Materials (BOM)</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage product compositions and material requirements</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button onClick={startCreate} className="flex items-center px-3 py-2 text-white bg-green-600 rounded shadow">
              <Plus className="w-4 h-4 mr-2" /> New BOM
            </button>

            <button onClick={() => { if (selectedBOMId) startEdit(boms.find(b => b._id === selectedBOMId)); }} className="flex items-center px-3 py-2 text-white bg-blue-600 rounded shadow">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </button>

            <button onClick={() => exportBOMToCSV()} className="flex items-center px-3 py-2 text-white bg-indigo-600 rounded shadow">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>

            <button onClick={onClickImport} className="flex items-center px-3 py-2 text-white rounded shadow bg-slate-600">
              <Upload className="w-4 h-4 mr-2" /> Import CSV
            </button>

            <button onClick={() => printBOM()} className="flex items-center px-3 py-2 text-white bg-gray-600 rounded shadow">
              <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
            </button>

            <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={(e) => handleImportCSVFile(e.target.files?.[0] ?? null)} className="hidden" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {loading ? <div>Loading...</div> : boms.map(bom => (
            <button key={bom._id} onClick={() => setSelectedBOMId(bom._id ?? null)} className={`p-3 text-left rounded border ${selectedBOMId === bom._id ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="font-semibold">{bom.productName}</div>
              <div className="text-xs text-gray-600">{bom.version}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={`p-6 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        {!editing ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{currentBOM.productName}</h2>
                <div className="text-sm text-gray-600">Version: {currentBOM.version} • Total: {formatCurrency(currentBOM.totalCost)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(currentBOM)} className="px-3 py-2 text-white bg-blue-500 rounded"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteBOM(currentBOM._id)} className="px-3 py-2 text-white bg-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Material</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Unit Cost</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-left">Supplier</th>
                    <th className="p-2 text-left">Lead</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentBOM.materials || []).map((m, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2">{m.name}</td>
                      <td className="p-2">{m.quantity}</td>
                      <td className="p-2">{m.unit}</td>
                      <td className="p-2">{formatCurrency(m.unitCost)}</td>
                      <td className="p-2 font-semibold text-green-600">{formatCurrency(m.totalCost)}</td>
                      <td className="p-2">{m.supplier}</td>
                      <td className="p-2">{formatLead(m.leadTimeDays)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Product name" className="px-3 py-2 border rounded w-72" />
                <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="Version" className="px-3 py-2 border rounded w-36" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveBOM} className="px-3 py-2 text-white bg-green-600 rounded">Save</button>
                <button onClick={cancelEdit} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
              </div>
            </div>

            <div className="mb-3">
              <button onClick={addMaterialRow} className="inline-flex items-center px-3 py-2 text-white bg-blue-600 rounded"><Plus className="w-4 h-4 mr-2" /> Add Material</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Material (choose from master)</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Unit Cost</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2 text-left">Supplier</th>
                    <th className="p-2 text-left">Lead (days)</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(form.materials || []).map((m, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">
                        <input
                          list="materials-list"
                          value={m.name}
                          onChange={(e) => onSelectMaterialFromMaster(idx, e.target.value)}
                          placeholder="Material name"
                          className="w-full px-2 py-1 border rounded"
                        />
                        <datalist id="materials-list">
                          {materialsMaster.map((mm) => (
                            <option key={mm._id} value={mm.name} />
                          ))}
                        </datalist>
                      </td>

                      <td className="p-2">
                        <input type="number" className="w-20 px-2 py-1 border rounded" value={m.quantity} onChange={(e) => updateMaterialField(idx, "quantity", e.target.value)} />
                      </td>

                      <td className="p-2">
                        <input className="px-2 py-1 border rounded w-28" value={m.unit} onChange={(e) => updateMaterialField(idx, "unit", e.target.value)} />
                      </td>

                      <td className="p-2">
                        <input type="number" step="0.01" className="w-32 px-2 py-1 border rounded" value={m.unitCost} onChange={(e) => updateMaterialField(idx, "unitCost", e.target.value)} />
                      </td>

                      <td className="p-2 font-semibold">{formatCurrency(m.totalCost)}</td>

                      <td className="p-2">
                        <input className="px-2 py-1 border rounded w-36" value={m.supplier} onChange={(e) => updateMaterialField(idx, "supplier", e.target.value)} />
                      </td>

                      <td className="p-2">
                        <input type="number" className="w-24 px-2 py-1 border rounded" value={m.leadTimeDays} onChange={(e) => updateMaterialField(idx, "leadTimeDays", e.target.value)} />
                      </td>

                      <td className="p-2">
                        <button onClick={() => removeMaterialRow(idx)} className="text-red-600">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-right">
              Total: <strong>
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                }).format(form.totalCost)}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BOMSection;