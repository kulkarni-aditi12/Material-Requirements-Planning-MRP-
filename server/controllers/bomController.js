import BOM from "../models/BOM.js";
import Material from "../models/Material.js";
import StockMovement from "../models/StockMovement.js";

export const createBOM = async (req, res) => {
  try {
    const bom = new BOM(req.body);
    await bom.save();
    res.status(201).json(bom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllBOMs = async (req, res) => {
  try {
    const boms = await BOM.find();
    res.json(boms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBOMById = async (req, res) => {
  try {
    const bom = await BOM.findById(req.params.id);
    if (!bom) return res.status(404).json({ message: "BOM not found" });
    res.json(bom);
  } catch (error) {
    res.status(400).json({ message: "Invalid BOM ID" });
  }
};

export const updateBOM = async (req, res) => {
  try {
    const bom = await BOM.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bom) return res.status(404).json({ message: "BOM not found" });
    res.json(bom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBOM = async (req, res) => {
  try {
    const bom = await BOM.findByIdAndDelete(req.params.id);
    if (!bom) return res.status(404).json({ message: "BOM not found" });
    res.json({ message: "BOM deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const executeProduction = async (req, res) => {
  try {
    const { bomId, quantity } = req.body;

    if (!bomId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "bomId and valid quantity required" });
    }

    const bom = await BOM.findById(bomId);
    if (!bom) {
      return res.status(404).json({ message: "BOM not found" });
    }

    for (const item of bom.materials) {
      const material = await Material.findOne({ name: item.name });
      if (!material) {
        return res.status(400).json({ message: `Material ${item.name} not found` });
      }

      const requiredQty = item.quantity * quantity;
      if (material.currentStock < requiredQty) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.name}`
        });
      }
    }

    for (const item of bom.materials) {
      const material = await Material.findOne({ name: item.name });
      const usedQty = item.quantity * quantity;

      material.currentStock -= usedQty;
      await material.save();

      await StockMovement.create({
        materialId: material._id,
        materialName: material.name,
        type: "OUT",
        quantity: usedQty,
        balanceAfter: material.currentStock,
        source: "bom",
        note: `Production for ${bom.productName}`
      });
    }

    res.json({
      message: "Production executed successfully",
      product: bom.productName,
      quantity
    });

  } catch (error) {
    console.error("Execute production error:", error);
    res.status(500).json({ message: "Production execution failed" });
  }
};
