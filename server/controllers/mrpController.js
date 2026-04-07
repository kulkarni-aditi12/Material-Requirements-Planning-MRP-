import BOM from "../models/BOM.js";
import Material from "../models/Material.js";
import PO from "../models/PO.js";
import MRPRun from "../models/MRPRun.js";

const getBomRows = (bom) => {
  if (!bom) return [];
  if (Array.isArray(bom.materials) && bom.materials.length > 0) return bom.materials;
  if (Array.isArray(bom.items) && bom.items.length > 0) return bom.items;
  if (Array.isArray(bom.requirements) && bom.requirements.length > 0) return bom.requirements;
  if (Array.isArray(bom.components) && bom.components.length > 0) return bom.components;
  return [];
};

const getMaterialName = (row) =>
  row.name || row.material || row.materialName || row.itemName || "";

const getQtyPerUnit = (row) => Number(row.quantity ?? row.qty ?? 0);

export const runMRP = async (req, res) => {
  try {
    const { productName, demandQuantity } = req.body;

    if (!productName || demandQuantity === undefined) {
      return res.status(400).json({
        message: "productName and demandQuantity are required",
      });
    }

    const qty = Number(demandQuantity);

    if (qty <= 0) {
      return res.status(400).json({
        message: "demandQuantity must be greater than 0",
      });
    }

    const bom = await BOM.findOne({
      productName: { $regex: new RegExp(`^${String(productName).trim()}$`, "i") },
    });

    if (!bom) {
      return res.status(404).json({
        message: `No BOM found for product: ${productName}`,
      });
    }

    const bomRows = getBomRows(bom);

    if (bomRows.length === 0) {
      return res.status(400).json({
        message: `BOM exists but has no material rows for ${productName}`,
      });
    }

    const results = [];
    const missingMaterials = [];

    for (const row of bomRows) {
      const materialName = getMaterialName(row).trim();
      const qtyPerUnit = getQtyPerUnit(row);

      if (!materialName || qtyPerUnit <= 0) continue;

      const requiredQty = qtyPerUnit * qty;

      const material = await Material.findOne({
        name: { $regex: new RegExp(`^${materialName}$`, "i") },
      });

      if (!material) {
        missingMaterials.push(materialName);
      }

      const currentStock = material ? Number(material.currentStock || 0) : 0;
      const shortage = Math.max(requiredQty - currentStock, 0);
      const unitCost = Number(material?.unitPrice || row.unitCost || 0);
      const estimatedPurchaseCost = shortage * unitCost;

      results.push({
        materialId: material?._id || null,
        materialName,
        requiredQty,
        currentStock,
        shortage,
        enoughStock: shortage === 0,
        suggestedOrderQty: shortage,
        unitCost,
        estimatedPurchaseCost,
      });
    }

    const savedRun = await MRPRun.create({
      productName,
      demandQuantity: qty,
      results,
      status: "planned",
    });

    if (global.io) {
      global.io.emit("mrpRunCompleted", {
        productName,
        demandQuantity: qty,
        totalMaterials: results.length,
      });
    }

    res.status(201).json({
      message: "MRP run completed successfully",
      mrpRun: savedRun,
      missingMaterials,
      summary: {
        totalMaterials: results.length,
        shortageCount: results.filter((r) => r.shortage > 0).length,
        totalShortageQty: results.reduce((sum, r) => sum + Number(r.shortage || 0), 0),
        estimatedPurchaseCost: results.reduce(
          (sum, r) => sum + Number(r.estimatedPurchaseCost || 0),
          0
        ),
        canProduceFully: results.every((r) => r.shortage === 0),
      },
    });
  } catch (err) {
    console.error("Run MRP error:", err);
    res.status(500).json({
      message: "Failed to run MRP",
      error: err.message,
    });
  }
};

export const getAllMRPRuns = async (req, res) => {
  try {
    const runs = await MRPRun.find().sort({ createdAt: -1 });
    res.json(runs);
  } catch (err) {
    console.error("Get MRP runs error:", err);
    res.status(500).json({
      message: "Failed to fetch MRP runs",
      error: err.message,
    });
  }
};

export const createPOsFromMRP = async (req, res) => {
  try {
    const { mrpRunId } = req.body;

    if (!mrpRunId) {
      return res.status(400).json({ message: "mrpRunId is required" });
    }

    const mrpRun = await MRPRun.findById(mrpRunId);

    if (!mrpRun) {
      return res.status(404).json({ message: "MRP run not found" });
    }

    const shortages = mrpRun.results.filter((r) => Number(r.shortage) > 0);

    if (shortages.length === 0) {
      return res.status(400).json({
        message: "No shortages found. Purchase order not required.",
      });
    }

    const createdPOs = [];

    for (const item of shortages) {
      const po = await PO.create({
        poNumber: `AUTO-PO-${Date.now()}${Math.floor(Math.random() * 1000)}`,
        supplier: `Auto PO for ${mrpRun.productName}`,
        items: Number(item.shortage),
        totalAmount: Number(item.estimatedPurchaseCost || 0),
        status: "draft",
        date: new Date(),
        deliveryDate: new Date(),
      });

      createdPOs.push(po);
    }

    mrpRun.status = "po_created";
    await mrpRun.save();

    if (global.io) {
      global.io.emit("poSuggestionsCreated", {
        mrpRunId: mrpRun._id,
        count: createdPOs.length,
      });
    }

    res.status(201).json({
      message: "Purchase orders created from MRP shortages",
      createdPOs,
    });
  } catch (err) {
    console.error("Create PO from MRP error:", err);
    res.status(500).json({
      message: "Failed to create POs from MRP",
      error: err.message,
    });
  }
};