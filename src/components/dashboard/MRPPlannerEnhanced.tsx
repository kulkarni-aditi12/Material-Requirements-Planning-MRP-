import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Factory,
  FileDown,
  Layers3,
  Package,
  PlusCircle,
  Search,
  ShieldAlert,
  ShoppingCart,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface Material {
  _id: string;
  name?: string;
  currentStock?: number;
  unit?: string;
  supplier?: string;
  minStock?: number;
  unitPrice?: number;
}

interface BOMRow {
  material?: string;
  materialName?: string;
  name?: string;
  itemName?: string;
  quantity?: number;
  qty?: number;
  unit?: string;
  unitCost?: number;
  unit_cost?: number;
  cost?: number;
  supplier?: string;
}

interface BOM {
  _id: string;
  productName?: string;
  product?: string;
  finishedGood?: string;
  name?: string;
  items?: BOMRow[];
  materials?: BOMRow[];
  requirements?: BOMRow[];
  components?: BOMRow[];
}

interface PlannedRow {
  materialId?: string;
  materialName: string;
  requiredQty: number;
  availableStock: number;
  shortage: number;
  remainingAfterProduction: number;
  unit: string;
  supplier: string;
  unitCost: number;
  estimatedCost: number;
  purchaseNeeded: boolean;
  existsInMaster: boolean;
}

const MRPPlanner: React.FC = () => {
  const { isDark } = useTheme();

  const [boms, setBoms] = useState<BOM[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedBomId, setSelectedBomId] = useState("");
  const [productionQty, setProductionQty] = useState<number | "">("");
  const [bomSearch, setBomSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [creatingPO, setCreatingPO] = useState(false);
  const [startingProduction, setStartingProduction] = useState(false);
  const [syncingMaterials, setSyncingMaterials] = useState(false);

  const API_BOM = "http://localhost:5000/api/bom";
  const API_MATERIALS = "http://localhost:5000/api/materials";
  const API_PO = "http://localhost:5000/api/pos";
  const API_PRODUCTION = "http://localhost:5000/api/production/start";
  const API_EXPORT_SHORTAGE = "http://localhost:5000/api/exports/shortage/latest";

  const pageCard = isDark
    ? "rounded-[24px] border border-gray-800 bg-[#111827]"
    : "rounded-[24px] border border-slate-200 bg-white shadow-sm";

  const softCard = isDark
    ? "rounded-[20px] border border-gray-800 bg-[#0f172a]"
    : "rounded-[20px] border border-slate-200 bg-slate-50";

  const inputClass = isDark
    ? "h-[56px] w-full rounded-2xl border border-gray-700 bg-[#0b1220] px-4 text-[15px] text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500"
    : "h-[56px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500";

  const searchInputClass = isDark
    ? "h-[56px] w-full rounded-2xl border border-gray-700 bg-[#0b1220] pl-11 pr-4 text-[15px] text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500"
    : "h-[56px] w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500";

  const fetchData = async () => {
    try {
      setLoading(true);

      const [bomRes, matRes] = await Promise.all([
        axios.get(API_BOM),
        axios.get(API_MATERIALS),
      ]);

      setBoms(
        Array.isArray(bomRes.data?.data)
          ? bomRes.data.data
          : Array.isArray(bomRes.data)
          ? bomRes.data
          : []
      );

      setMaterials(
        Array.isArray(matRes.data?.data)
          ? matRes.data.data
          : Array.isArray(matRes.data)
          ? matRes.data
          : []
      );
    } catch (error) {
      console.error("Error fetching MRP data:", error);
      setBoms([]);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getBomDisplayName = (bom: BOM) =>
    bom.productName || bom.product || bom.finishedGood || bom.name || "Unnamed Product";

  const getBomRows = (bom: BOM | null): BOMRow[] => {
    if (!bom) return [];
    if (Array.isArray(bom.materials) && bom.materials.length > 0) return bom.materials;
    if (Array.isArray(bom.items) && bom.items.length > 0) return bom.items;
    if (Array.isArray(bom.requirements) && bom.requirements.length > 0) return bom.requirements;
    if (Array.isArray(bom.components) && bom.components.length > 0) return bom.components;
    return [];
  };

  const filteredBoms = useMemo(() => {
    const search = bomSearch.trim().toLowerCase();
    if (!search) return boms;
    return boms.filter((bom) => getBomDisplayName(bom).toLowerCase().includes(search));
  }, [boms, bomSearch]);

  useEffect(() => {
    if (!selectedBomId && boms.length > 0) {
      setSelectedBomId(boms[0]._id);
    }
  }, [boms, selectedBomId]);

  const selectedBom = useMemo(() => {
    return boms.find((bom) => bom._id === selectedBomId) || null;
  }, [boms, selectedBomId]);

  const selectedBomName = selectedBom ? getBomDisplayName(selectedBom) : "";

  const plannedRows: PlannedRow[] = useMemo(() => {
    if (!selectedBom || productionQty === "" || Number(productionQty) <= 0) {
      return [];
    }

    const bomRows = getBomRows(selectedBom);

    return bomRows.map((row) => {
      const materialName =
        row.material || row.materialName || row.name || row.itemName || "Unknown Material";

      const matchedMaterial = materials.find(
        (m) => (m.name || "").trim().toLowerCase() === materialName.trim().toLowerCase()
      );

      const qtyPerUnit = Number(row.quantity ?? row.qty ?? 0);
      const requiredQty = qtyPerUnit * Number(productionQty);
      const availableStock = Number(matchedMaterial?.currentStock || 0);
      const shortage = Math.max(requiredQty - availableStock, 0);
      const remainingAfterProduction = Math.max(availableStock - requiredQty, 0);

      const unitCost = Number(
        matchedMaterial?.unitPrice ?? row.unitCost ?? row.unit_cost ?? row.cost ?? 0
      );

      return {
        materialId: matchedMaterial?._id,
        materialName,
        requiredQty,
        availableStock,
        shortage,
        remainingAfterProduction,
        unit: row.unit || matchedMaterial?.unit || "pcs",
        supplier: row.supplier || matchedMaterial?.supplier || "Unknown",
        unitCost,
        estimatedCost: shortage * unitCost,
        purchaseNeeded: shortage > 0,
        existsInMaster: !!matchedMaterial,
      };
    });
  }, [selectedBom, productionQty, materials]);

  const missingMasterRows = plannedRows.filter((row) => !row.existsInMaster);
  const shortageRows = plannedRows.filter((row) => row.shortage > 0);
  const readyRows = plannedRows.filter((row) => row.shortage === 0 && row.existsInMaster);

  const totalMaterials = plannedRows.length;
  const totalShortageItems = shortageRows.length;
  const totalShortageQty = shortageRows.reduce((sum, row) => sum + row.shortage, 0);
  const totalEstimatedPurchase = shortageRows.reduce((sum, row) => sum + row.estimatedCost, 0);

  const formatCurrency = (value: number) => `₹${Number(value || 0).toFixed(2)}`;

  const runMRP = () => {
    if (!selectedBomId) {
      alert("Please select a BOM product first.");
      return;
    }

    if (productionQty === "" || Number(productionQty) <= 0) {
      alert("Please enter a valid production quantity.");
      return;
    }

    setAnalysisStarted(true);
  };

  const syncMissingMaterialsToMaster = async () => {
    try {
      if (!selectedBom) {
        alert("Please select a BOM first.");
        return;
      }

      if (missingMasterRows.length === 0) {
        alert("All BOM materials already exist in Material Master.");
        return;
      }

      setSyncingMaterials(true);

      for (const row of missingMasterRows) {
        try {
          await axios.post(API_MATERIALS, {
            name: row.materialName,
            unit: row.unit || "pcs",
            supplier: row.supplier || "Unknown",
            minStock: 0,
            currentStock: 0,
            unitPrice: Number(row.unitCost || 0),
          });
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.response?.data?.error || "";
          if (!msg.toLowerCase().includes("exist")) {
            console.error(`Failed to create material ${row.materialName}:`, err);
          }
        }
      }

      await fetchData();
      alert("Missing BOM materials added to Material Master.");
    } catch (error) {
      console.error("Error syncing missing materials:", error);
      alert("Failed to sync missing materials.");
    } finally {
      setSyncingMaterials(false);
    }
  };

  const generateAutoPO = async () => {
    try {
      if (!selectedBom) {
        alert("Please select a BOM first.");
        return;
      }

      if (productionQty === "" || Number(productionQty) <= 0) {
        alert("Please enter a valid production quantity.");
        return;
      }

      if (shortageRows.length === 0) {
        alert("No shortage found. Auto PO is not required.");
        return;
      }

      setCreatingPO(true);

      const poNumber = `AUTO-PO-${Date.now()}`;
      const supplier = `Auto PO for ${selectedBomName}`;

      const payload = {
        poNumber,
        supplier,
        items: shortageRows.length,
        totalAmount: Number(totalEstimatedPurchase.toFixed(2)),
        status: "draft",
        date: new Date().toISOString().split("T")[0],
        deliveryDate: new Date().toISOString().split("T")[0],
        lineItems: shortageRows.map((row) => ({
          materialId: row.materialId || null,
          materialName: row.materialName,
          quantity: row.shortage,
          unit: row.unit,
          unitCost: row.unitCost,
          supplier: row.supplier,
        })),
      };

      await axios.post(API_PO, payload);

      alert(
        `Auto PO created successfully.\nPO Number: ${poNumber}\nItems: ${shortageRows.length}\nEstimated Amount: ${formatCurrency(totalEstimatedPurchase)}`
      );
    } catch (err: any) {
      console.error("Error generating PO:", err);
      alert(err?.response?.data?.message || err?.response?.data?.error || "Failed to create PO.");
    } finally {
      setCreatingPO(false);
    }
  };

  const startProduction = async () => {
    try {
      if (!selectedBomId) {
        alert("Please select a BOM first.");
        return;
      }

      if (productionQty === "" || Number(productionQty) <= 0) {
        alert("Please enter a valid production quantity.");
        return;
      }

      if (missingMasterRows.length > 0) {
        alert("Some BOM materials are missing in Material Master. Sync them first.");
        return;
      }

      if (shortageRows.length > 0) {
        alert("Cannot start production because shortage exists. Receive stock first.");
        return;
      }

      setStartingProduction(true);

      const res = await axios.post(API_PRODUCTION, {
        bomId: selectedBomId,
        productionQty: Number(productionQty),
      });

      const consumedText = (res.data?.consumed || [])
        .map((item: any) => `${item.materialName}: ${item.consumedQty}`)
        .join("\n");

      alert(`${res.data?.message || "Production started successfully"}\n\nConsumed:\n${consumedText}`);

      await fetchData();
      setAnalysisStarted(false);
      setProductionQty("");
    } catch (err: any) {
      console.error("Error starting production:", err);
      alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to start production."
      );
    } finally {
      setStartingProduction(false);
    }
  };

  const exportShortageReport = () => {
    window.open(API_EXPORT_SHORTAGE, "_blank");
  };

  const plannerReady = selectedBomId && productionQty !== "" && Number(productionQty) > 0;

  return (
    <div className="w-full">
      <div className={pageCard}>
        <div className="px-6 py-6 border-b border-slate-200 dark:border-gray-800 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center text-white bg-blue-600 h-14 w-14 rounded-2xl">
                <Layers3 className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-[34px] font-semibold leading-tight text-slate-900 dark:text-white">
                  MRP Planner
                </h2>
                <p className="max-w-3xl mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Select a BOM product, enter the quantity to manufacture, and check stock availability,
                  shortages, purchase requirement, and production readiness.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniStat label="BOMs" value={String(boms.length)} isDark={isDark} />
              <MiniStat label="Materials" value={String(materials.length)} isDark={isDark} />
              <MiniStat label="Ready" value={String(readyRows.length)} isDark={isDark} />
              <MiniStat label="Shortage" value={String(totalShortageItems)} isDark={isDark} />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className={softCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center text-blue-600 bg-blue-100 h-11 w-11 rounded-2xl dark:bg-blue-500/15 dark:text-blue-300">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[22px] font-semibold text-slate-900 dark:text-white">
                    Product Selection
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choose the finished product from BOM
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Search BOM Product
                  </label>
                  <div className="relative">
                    <Search className="absolute w-4 h-4 -translate-y-1/2 pointer-events-none left-4 top-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={bomSearch}
                      onChange={(e) => setBomSearch(e.target.value)}
                      placeholder="Search product from BOM..."
                      className={searchInputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Select Product from BOM
                  </label>
                  <select
                    value={selectedBomId}
                    onChange={(e) => setSelectedBomId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Choose BOM product</option>
                    {filteredBoms.map((bom) => (
                      <option key={bom._id} value={bom._id}>
                        {getBomDisplayName(bom)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    This dropdown is connected to your Bill of Materials module.
                  </p>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Production Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productionQty}
                    onChange={(e) =>
                      setProductionQty(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Enter product quantity"
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Example: enter 25 if you want to manufacture 25 finished units.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <SelectionInfo
                    label="Selected Product"
                    value={selectedBomName || "Not selected"}
                    isDark={isDark}
                  />
                  <SelectionInfo
                    label="Quantity"
                    value={String(productionQty || "Not entered")}
                    isDark={isDark}
                  />
                  <SelectionInfo
                    label="Status"
                    value={plannerReady ? "Ready to run" : "Waiting input"}
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>

            <div className={pageCard}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center text-orange-600 bg-orange-100 h-11 w-11 rounded-2xl dark:bg-orange-500/15 dark:text-orange-300">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[22px] font-semibold text-slate-900 dark:text-white">
                    Planner Actions
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Analyze, purchase, sync and produce
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-gray-800 dark:bg-[#0f172a]">
                <div className="flex flex-wrap items-center gap-2">
                  <ActionButton
                    onClick={runMRP}
                    icon={<ChevronRight className="w-4 h-4" />}
                    color="blue"
                    tooltip="Run material requirement planning"
                  >
                    Run MRP
                  </ActionButton>

                  <ActionButton
                    onClick={generateAutoPO}
                    disabled={creatingPO || shortageRows.length === 0}
                    icon={<ShoppingCart className="w-4 h-4" />}
                    color="orange"
                    tooltip="Create purchase order for shortages"
                  >
                    {creatingPO ? "Creating..." : "Auto PO"}
                  </ActionButton>

                  <ActionButton
                    onClick={syncMissingMaterialsToMaster}
                    disabled={syncingMaterials || missingMasterRows.length === 0}
                    icon={<PlusCircle className="w-4 h-4" />}
                    color="slate"
                    tooltip="Add missing BOM materials to Material Master"
                  >
                    {syncingMaterials ? "Syncing..." : "Sync Materials"}
                  </ActionButton>

                  <ActionButton
                    onClick={startProduction}
                    disabled={
                      startingProduction ||
                      shortageRows.length > 0 ||
                      missingMasterRows.length > 0
                    }
                    icon={<Factory className="w-4 h-4" />}
                    color="green"
                    tooltip="Start production and consume available materials"
                  >
                    {startingProduction ? "Starting..." : "Start Production"}
                  </ActionButton>

                  <ActionButton
                    onClick={exportShortageReport}
                    icon={<FileDown className="w-4 h-4" />}
                    color="violet"
                    tooltip="Download the latest shortage report"
                  >
                    Export Report
                  </ActionButton>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-gray-800 dark:bg-[#0f172a]">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Production Readiness
                </p>

                <div className="mt-3 space-y-2">
                  <StatusLine
                    label="Missing in Material Master"
                    value={String(missingMasterRows.length)}
                    danger={missingMasterRows.length > 0}
                    isDark={isDark}
                  />
                  <StatusLine
                    label="Shortage Items"
                    value={String(shortageRows.length)}
                    danger={shortageRows.length > 0}
                    isDark={isDark}
                  />
                  <StatusLine
                    label="Ready Materials"
                    value={String(readyRows.length)}
                    success={readyRows.length > 0}
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 py-16 text-center text-sm text-slate-500 dark:border-gray-800 dark:bg-[#0f172a] dark:text-gray-400">
              Loading planner data...
            </div>
          )}

          {!loading && !analysisStarted && (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-8 dark:border-gray-800 dark:bg-[#0f172a]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <GuideCard
                  title="1. Choose Product"
                  text="Select the product directly from your BOM list."
                  icon={<Boxes className="w-5 h-5" />}
                  isDark={isDark}
                />
                <GuideCard
                  title="2. Enter Quantity"
                  text="Enter how many finished units you want to manufacture."
                  icon={<Package className="w-5 h-5" />}
                  isDark={isDark}
                />
                <GuideCard
                  title="3. Run MRP"
                  text="See stock availability, shortages, cost, and production status."
                  icon={<CircleDollarSign className="w-5 h-5" />}
                  isDark={isDark}
                />
              </div>
            </div>
          )}

          {!loading && analysisStarted && plannedRows.length > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  isDark={isDark}
                  title="Total Materials"
                  value={String(totalMaterials)}
                  subtitle="Components checked"
                  icon={<Boxes className="w-5 h-5 text-blue-600" />}
                />
                <SummaryCard
                  isDark={isDark}
                  title="Shortage Items"
                  value={String(totalShortageItems)}
                  subtitle="Need stock action"
                  icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
                />
                <SummaryCard
                  isDark={isDark}
                  title="Shortage Qty"
                  value={String(totalShortageQty)}
                  subtitle="Units missing"
                  icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                />
                <SummaryCard
                  isDark={isDark}
                  title="Estimated Purchase"
                  value={formatCurrency(totalEstimatedPurchase)}
                  subtitle="Expected PO value"
                  icon={<CircleDollarSign className="w-5 h-5 text-green-600" />}
                />
              </div>

              {missingMasterRows.length > 0 && (
                <div className="rounded-[22px] border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-500/10">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-500" />
                    <div>
                      <h4 className="font-semibold text-orange-700 dark:text-orange-300">
                        Materials Missing in Material Master
                      </h4>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                        {missingMasterRows.map((row) => row.materialName).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className={pageCard}>
                <div className="px-6 py-5 border-b border-slate-200 dark:border-gray-800">
                  <h3 className="text-[22px] font-semibold text-slate-900 dark:text-white">
                    Requirement Breakdown
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {selectedBomName} · Production Qty: {productionQty || 0}
                  </p>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {plannedRows.map((row, index) => (
                      <MaterialCard
                        key={`${row.materialName}-${index}`}
                        row={row}
                        isDark={isDark}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && analysisStarted && plannedRows.length === 0 && (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 py-16 text-center text-slate-500 dark:border-gray-800 dark:bg-[#0f172a] dark:text-gray-400">
              No BOM items found for the selected product.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({
  children,
  onClick,
  disabled,
  icon,
  color,
  tooltip,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "violet" | "slate";
  tooltip?: string;
}) => {
  const styles = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20",
    green: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/20",
    orange: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20",
    violet: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20",
    slate: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-gray-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-gray-800",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`inline-flex h-[40px] items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[color]}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

const MiniStat = ({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) => {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        isDark
          ? "border-gray-800 bg-[#0f172a]"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
};

const SelectionInfo = ({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) => {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        isDark
          ? "border-gray-800 bg-[#111827]"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold break-words text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

const StatusLine = ({
  label,
  value,
  isDark,
  danger,
  success,
}: {
  label: string;
  value: string;
  isDark: boolean;
  danger?: boolean;
  success?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          danger
            ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
            : success
            ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
            : isDark
            ? "bg-gray-800 text-gray-200"
            : "bg-slate-100 text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
};

const GuideCard = ({
  title,
  text,
  icon,
  isDark,
}: {
  title: string;
  text: string;
  icon: React.ReactNode;
  isDark: boolean;
}) => {
  return (
    <div
      className={`rounded-[20px] border p-5 ${
        isDark
          ? "border-gray-800 bg-[#111827]"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-center text-blue-600 bg-blue-100 h-11 w-11 rounded-2xl dark:bg-blue-500/15 dark:text-blue-300">
        {icon}
      </div>
      <h4 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{title}</h4>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
};

const SummaryCard = ({
  isDark,
  title,
  value,
  subtitle,
  icon,
}: {
  isDark: boolean;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) => {
  return (
    <div
      className={`rounded-[22px] border p-5 ${
        isDark
          ? "border-gray-800 bg-[#111827]"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
        <div>{icon}</div>
      </div>
      <h3 className="mt-4 text-3xl font-semibold break-words text-slate-900 dark:text-white">
        {value}
      </h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
};

const MaterialCard = ({
  row,
  isDark,
  formatCurrency,
}: {
  row: PlannedRow;
  isDark: boolean;
  formatCurrency: (value: number) => string;
}) => {
  const status = !row.existsInMaster
    ? {
        label: "Missing in Master",
        classes:
          "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      }
    : row.purchaseNeeded
    ? {
        label: "Need to Purchase",
        classes: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
        icon: <ShieldAlert className="h-3.5 w-3.5" />,
      }
    : {
        label: "Ready",
        classes:
          "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      };

  return (
    <div
      className={`rounded-[22px] border p-5 ${
        isDark
          ? "border-gray-800 bg-[#0f172a]"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
            {row.materialName}
          </h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Supplier: {row.supplier}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5 md:grid-cols-3">
        <MetricBox label="Required" value={`${row.requiredQty} ${row.unit}`} isDark={isDark} />
        <MetricBox label="In Stock" value={`${row.availableStock} ${row.unit}`} isDark={isDark} />
        <MetricBox label="Shortage" value={`${row.shortage} ${row.unit}`} isDark={isDark} />
        <MetricBox
          label="After Production"
          value={`${row.remainingAfterProduction} ${row.unit}`}
          isDark={isDark}
        />
        <MetricBox label="Unit Cost" value={formatCurrency(row.unitCost)} isDark={isDark} />
        <MetricBox
          label="Purchase Cost"
          value={formatCurrency(row.estimatedCost)}
          isDark={isDark}
        />
      </div>
    </div>
  );
};

const MetricBox = ({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) => {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        isDark
          ? "border-gray-800 bg-[#111827]"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold break-words text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};

export default MRPPlanner;