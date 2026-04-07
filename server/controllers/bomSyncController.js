import BOM from "../models/BOM.js";
import Material from "../models/Material.js";

export const runBomSync = async (req, res) => {
  try {
    const boms = await BOM.find();
    let createdCount = 0;

    for (const bom of boms) {
      const materials = Array.isArray(bom.materials) ? bom.materials : [];

      for (const item of materials) {
        const name = String(item.name || "").trim();
        if (!name) continue;

        const exists = await Material.findOne({ name });
        if (exists) continue;

        await Material.create({
          name,
          unit: item.unit || "pcs",
          supplier: item.supplier || "Unknown",
          minStock: 0,
          currentStock: 0,
          unitPrice: Number(item.unitCost || 0),
        });

        createdCount++;
      }
    }

    res.json({
      message: "BOM materials synced to Material Master",
      createdCount,
    });
  } catch (err) {
    console.error("BOM sync error:", err);
    res.status(500).json({
      message: "Failed to sync BOM materials",
      error: err.message,
    });
  }
};