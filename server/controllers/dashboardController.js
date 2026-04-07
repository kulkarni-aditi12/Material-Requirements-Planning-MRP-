import Material from "../models/Material.js";
import StockMovement from "../models/StockMovement.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalMaterials = await Material.countDocuments();

    const lowStockItems = await Material.countDocuments({
      $expr: { $lte: ["$currentStock", "$minStock"] }
    });

    const totalStockIn = await StockMovement.aggregate([
      { $match: { type: "IN" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    const totalStockOut = await StockMovement.aggregate([
      { $match: { type: "OUT" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    res.json({
      totalMaterials,
      lowStockItems,
      stockIn: totalStockIn[0]?.total || 0,
      stockOut: totalStockOut[0]?.total || 0
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Dashboard stats error" });
  }
};

export const getLowStockAlerts = async (req, res) => {
  try {
    const materials = await Material.find({
      $expr: { $lte: ["$currentStock", "$minStock"] }
    }).select("name currentStock minStock");

    const alerts = materials.map(m => ({
      material: m.name,
      currentStock: m.currentStock,
      minStock: m.minStock
    }));

    res.json({ alerts });

  } catch (error) {
    console.error("Alert fetch error:", error);
    res.status(500).json({ message: "Alert fetch error" });
  }
};
