import BOM from "../models/BOM.js";
import Material from "../models/Material.js";
import StockMovement from "../models/StockMovement.js";

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

export const startProduction = async (req, res) => {
  try {
    const { productName, quantity } = req.body;

    if (!productName || quantity === undefined) {
      return res.status(400).json({
        message: "productName and quantity are required",
      });
    }

    const productionQty = Number(quantity);
    if (productionQty <= 0) {
      return res.status(400).json({ message: "quantity must be greater than 0" });
    }

    const bom = await BOM.findOne({
      productName: { $regex: new RegExp(`^${String(productName).trim()}$`, "i") },
    });

    if (!bom) {
      return res.status(404).json({ message: `No BOM found for ${productName}` });
    }

    const bomRows = getBomRows(bom);
    if (bomRows.length === 0) {
      return res.status(400).json({ message: "BOM has no items" });
    }

    // First validate stock for all materials
    const stockChecks = [];

    for (const row of bomRows) {
      const materialName = getMaterialName(row).trim();
      const qtyPerUnit = getQtyPerUnit(row);
      if (!materialName || qtyPerUnit <= 0) continue;

      const requiredQty = qtyPerUnit * productionQty;
      const material = await Material.findOne({
        name: { $regex: new RegExp(`^${materialName}$`, "i") },
      });

      if (!material) {
        return res.status(400).json({
          message: `Material not found in master: ${materialName}`,
        });
      }

      if (Number(material.currentStock || 0) < requiredQty) {
        return res.status(400).json({
          message: `Insufficient stock for ${materialName}`,
          materialName,
          requiredQty,
          available: Number(material.currentStock || 0),
        });
      }

      stockChecks.push({ row, material, requiredQty });
    }

    // Then consume stock
    const consumedMaterials = [];

    for (const item of stockChecks) {
      item.material.currentStock = Number(item.material.currentStock || 0) - item.requiredQty;
      await item.material.save();

      await StockMovement.create({
        materialId: item.material._id,
        materialName: item.material.name,
        type: "OUT",
        quantity: item.requiredQty,
        balanceAfter: item.material.currentStock,
        source: "production",
        note: `Consumed for production of ${productName}`,
      });

      consumedMaterials.push({
        materialId: item.material._id,
        materialName: item.material.name,
        consumedQty: item.requiredQty,
        balanceAfter: item.material.currentStock,
      });

      if (global.io) {
        global.io.emit("stockUpdated", {
          materialId: item.material._id,
          materialName: item.material.name,
          currentStock: item.material.currentStock,
        });
      }
    }

    const productionRun = await ProductionRun.create({
      productName,
      quantity: productionQty,
      consumedMaterials,
      status: "completed",
    });

    if (global.io) {
      global.io.emit("productionStarted", {
        productName,
        quantity: productionQty,
      });
    }

    res.status(201).json({
      message: `Production completed for ${productName}`,
      productionRun,
    });
  } catch (err) {
    console.error("Start production error:", err);
    res.status(500).json({
      message: "Failed to start production",
      error: err.message,
    });
  }
};

export const getProductionRuns = async (req, res) => {
  try {
    const runs = await ProductionRun.find().sort({ createdAt: -1 });
    res.json(runs);
  } catch (err) {
    console.error("Get production runs error:", err);
    res.status(500).json({
      message: "Failed to fetch production runs",
      error: err.message,
    });
  }
};