import BOM from "../models/BOM.js";
import Material from "../models/Material.js";
import StockMovement from "../models/StockMovement.js";

export const startProduction = async (req, res) => {
  try {
    const { bomId, productionQty } = req.body;

    if (!bomId) {
      return res.status(400).json({ message: "bomId is required" });
    }

    const qty = Number(productionQty);
    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "Valid productionQty is required" });
    }

    const bom = await BOM.findById(bomId);
    if (!bom) {
      return res.status(404).json({ message: "BOM not found" });
    }

    const materials = Array.isArray(bom.materials) ? bom.materials : [];
    if (materials.length === 0) {
      return res.status(400).json({ message: "No materials found in BOM" });
    }

    const consumed = [];

    for (const item of materials) {
      const materialName = String(item.name || "").trim();
      const requiredPerUnit = Number(item.quantity || 0);
      const requiredQty = requiredPerUnit * qty;

      const material = await Material.findOne({ name: materialName });
      if (!material) {
        return res.status(404).json({
          message: `Material not found in master: ${materialName}`,
        });
      }

      const currentStock = Number(material.currentStock || 0);
      if (currentStock < requiredQty) {
        return res.status(400).json({
          message: `Insufficient stock for ${materialName}. Required ${requiredQty}, available ${currentStock}`,
        });
      }
    }

    for (const item of materials) {
      const materialName = String(item.name || "").trim();
      const requiredPerUnit = Number(item.quantity || 0);
      const requiredQty = requiredPerUnit * qty;

      const material = await Material.findOne({ name: materialName });
      material.currentStock = Number(material.currentStock || 0) - requiredQty;
      await material.save();

      await StockMovement.create({
        materialId: material._id,
        materialName: material.name,
        type: "OUT",
        quantity: requiredQty,
        balanceAfter: material.currentStock,
        source: "production",
        note: `Production started for ${bom.productName} x ${qty}`,
      });

      consumed.push({
        materialId: material._id,
        materialName: material.name,
        consumedQty: requiredQty,
        unit: material.unit,
        balanceAfter: material.currentStock,
      });

      if (global.io) {
        global.io.emit("stockUpdated", {
          materialId: material._id,
          materialName: material.name,
          currentStock: material.currentStock,
        });
      }
    }

    if (global.io) {
      global.io.emit("productionStarted", {
        productName: bom.productName,
        quantity: qty,
      });
    }

    res.json({
      message: "Production started successfully",
      productName: bom.productName,
      quantity: qty,
      consumed,
    });
  } catch (err) {
    console.error("Production start error:", err);
    res.status(500).json({
      message: "Failed to start production",
      error: err.message,
    });
  }
};