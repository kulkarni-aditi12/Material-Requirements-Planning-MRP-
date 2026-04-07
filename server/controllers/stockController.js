// server/controllers/stockController.js
import StockMovement from "../models/StockMovement.js";
import Material from "../models/Material.js";

/**
 * Create stock movement + update material stock
 * Emits real-time socket events
 */
export async function createMovementAndUpdateMaterial({
  materialId,
  materialName,
  type,
  quantity,
  source = "manual",
  note = "",
}) {
  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new Error("Quantity must be > 0");

  let material = null;

  if (materialId) material = await Material.findById(materialId);
  if (!material) material = await Material.findOne({ name: materialName });

  if (!material) {
    throw new Error("Material not found");
  }

  let newStock = material.currentStock || 0;
  newStock = type === "IN" ? newStock + qty : newStock - qty;

  const movement = await StockMovement.create({
    materialId: material._id,
    materialName: material.name,
    type,
    quantity: qty,
    balanceAfter: newStock,
    source,
    note,
  });

  material.currentStock = newStock;
  await material.save();

  /* 🔥 REAL-TIME STOCK UPDATE */
  if (global.io) {
    global.io.emit("stockUpdated", {
      materialId: material._id.toString(),
      currentStock: material.currentStock,
    });

    if (material.currentStock <= material.minStock) {
      global.io.emit("notification", {
        id: Date.now(),
        message: `⚠️ Low stock: ${material.name} (${material.currentStock} ${material.unit})`,
      });
    }
  }

  return movement;
}

/* Fetch stock movements */
export const getStockMovements = async (req, res) => {
  try {
    const list = await StockMovement.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* Create stock movement */
export const createStockMovement = async (req, res) => {
  try {
    const movement = await createMovementAndUpdateMaterial(req.body);
    res.status(201).json(movement);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
