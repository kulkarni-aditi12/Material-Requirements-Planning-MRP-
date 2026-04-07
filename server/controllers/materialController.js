import Material from "../models/Material.js";
import StockMovement from "../models/StockMovement.js";

/* GET all materials */
export const getAllMaterials = async (req, res) => {
  const materials = await Material.find().sort({ name: 1 });
  res.json(materials);
};

/* ADD material */
export const addMaterial = async (req, res) => {
  const material = await Material.create(req.body);
  res.status(201).json(material);
};

/* UPDATE material (NON-STOCK fields only) */
export const updateMaterial = async (req, res) => {
  const { currentStock, ...safeUpdates } = req.body;

  const material = await Material.findByIdAndUpdate(
    req.params.id,
    safeUpdates,
    { new: true }
  );

  res.json(material);
};

/* DELETE material */
export const deleteMaterial = async (req, res) => {
  await Material.findByIdAndDelete(req.params.id);
  res.json({ message: "Material deleted" });
};

/* 🔥 MANUAL STOCK EDIT (PHASE-1 CORE FEATURE) */
export const editStock = async (req, res) => {
  const { materialId, newStock, note } = req.body;

  const material = await Material.findById(materialId);
  if (!material) {
    return res.status(404).json({ message: "Material not found" });
  }

  const diff = newStock - material.currentStock;

  if (diff === 0) {
    return res.json({ message: "No stock change" });
  }

  const movementType = diff > 0 ? "IN" : "OUT";

  material.currentStock = newStock;
  await material.save();

  await StockMovement.create({
    materialId: material._id,
    materialName: material.name,
    type: movementType,
    quantity: Math.abs(diff),
    balanceAfter: newStock,
    source: "manual",
    note: note || "Manual stock edit"
  });

  res.json({
    message: "Stock updated & logged",
    material
  });
};
