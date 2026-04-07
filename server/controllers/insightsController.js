import Material from "../models/Material.js";
import PO from "../models/PO.js";
import StockMovement from "../models/StockMovement.js";
import MRPRun from "../models/MRPRun.js";

export const getOverviewSummary = async (req, res) => {
  try {
    const totalMaterials = await Material.countDocuments();

    const lowStockMaterials = await Material.find({
      $expr: { $lt: ["$currentStock", "$minStock"] },
    });

    const pendingPOs = await PO.countDocuments({
      status: { $in: ["draft", "pending", "sent", "approved"] },
    });

    const receivedPOs = await PO.countDocuments({ status: "received" });

    const stockInCount = await StockMovement.countDocuments({ type: "IN" });
    const stockOutCount = await StockMovement.countDocuments({ type: "OUT" });

    const lastMRPRun = await MRPRun.findOne().sort({ createdAt: -1 });

    res.json({
      totalMaterials,
      lowStockCount: lowStockMaterials.length,
      lowStockMaterials,
      pendingPOs,
      receivedPOs,
      stockInCount,
      stockOutCount,
      lastMRPRun: lastMRPRun
        ? {
            id: lastMRPRun._id,
            productName: lastMRPRun.productName,
            demandQuantity: lastMRPRun.demandQuantity,
            shortageCount: lastMRPRun.results.filter((r) => Number(r.shortage) > 0).length,
            totalShortageQty: lastMRPRun.results.reduce(
              (sum, r) => sum + Number(r.shortage || 0),
              0
            ),
            canProduceFully: lastMRPRun.results.every((r) => Number(r.shortage) === 0),
            createdAt: lastMRPRun.createdAt,
          }
        : null,
    });
  } catch (err) {
    console.error("Overview summary error:", err);
    res.status(500).json({ message: "Failed to fetch overview summary", error: err.message });
  }
};

export const getAnalyticsData = async (req, res) => {
  try {
    const movements = await StockMovement.find().sort({ createdAt: 1 });
    const pos = await PO.find();
    const materials = await Material.find();
    const mrpRuns = await MRPRun.find().sort({ createdAt: -1 }).limit(20);

    // 1) Monthly Stock Movements
    const monthlyMap = {};
    for (const mv of movements) {
      const date = new Date(mv.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: key, stockIn: 0, stockOut: 0 };
      }
      if (mv.type === "IN") monthlyMap[key].stockIn += Number(mv.quantity || 0);
      if (mv.type === "OUT") monthlyMap[key].stockOut += Number(mv.quantity || 0);
    }
    const monthlyStockMovements = Object.values(monthlyMap);

    // 2) PO Status Distribution
    const poStatusMap = {};
    for (const po of pos) {
      const key = po.status || "unknown";
      poStatusMap[key] = (poStatusMap[key] || 0) + 1;
    }
    const poStatusData = Object.entries(poStatusMap).map(([status, count]) => ({
      status,
      count,
    }));

    // 3) Shortage Materials from latest MRP run
    const latestMRP = await MRPRun.findOne().sort({ createdAt: -1 });
    const shortageMaterials = latestMRP
      ? latestMRP.results
          .filter((r) => Number(r.shortage) > 0)
          .map((r) => ({
            materialName: r.materialName,
            shortage: Number(r.shortage || 0),
          }))
      : [];

    // 4) Top Costly Materials
    const topCostlyMaterials = materials
      .map((m) => ({
        materialName: m.name,
        unitPrice: Number(m.unitPrice || 0),
      }))
      .sort((a, b) => b.unitPrice - a.unitPrice)
      .slice(0, 5);

    // 5) MRP trend summary
    const mrpHistory = mrpRuns.map((run) => ({
      productName: run.productName,
      demandQuantity: run.demandQuantity,
      shortageCount: run.results.filter((r) => Number(r.shortage) > 0).length,
      createdAt: run.createdAt,
    }));

    res.json({
      monthlyStockMovements,
      poStatusData,
      shortageMaterials,
      topCostlyMaterials,
      mrpHistory,
    });
  } catch (err) {
    console.error("Analytics data error:", err);
    res.status(500).json({ message: "Failed to fetch analytics data", error: err.message });
  }
};