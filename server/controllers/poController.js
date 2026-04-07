import PO from "../models/PO.js";
import Material from "../models/Material.js";
import StockMovement from "../models/StockMovement.js";

/* =======================
   CREATE PO
======================= */
export const createPO = async (req, res) => {
  try {
    const {
      poNumber,
      supplier,
      items,
      totalAmount,
      status,
      date,
      deliveryDate,
      lineItems,
    } = req.body;

    if (!poNumber || !supplier || items === undefined || totalAmount === undefined) {
      return res.status(400).json({
        message: "poNumber, supplier, items and totalAmount are required",
      });
    }

    const normalizedLineItems = Array.isArray(lineItems)
      ? lineItems.map((item) => ({
          materialId: item.materialId || null,
          materialName: String(item.materialName || "").trim(),
          quantity: Number(item.quantity || 0),
          unit: item.unit || "pcs",
          unitCost: Number(item.unitCost || 0),
          supplier: item.supplier || "",
        }))
      : [];

    const newPO = new PO({
      poNumber,
      supplier,
      items: Number(items),
      totalAmount: Number(totalAmount),
      status: status || "draft",
      date: date || new Date(),
      deliveryDate: deliveryDate || new Date(),
      lineItems: normalizedLineItems,
    });

    const savedPO = await newPO.save();
    res.status(201).json(savedPO);
  } catch (err) {
    console.error("Create PO error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =======================
   RECEIVE PO → Stock IN
======================= */
export const receivePO = async (req, res) => {
  try {
    const { poId } = req.body;

    if (!poId) {
      return res.status(400).json({ message: "poId is required" });
    }

    const po = await PO.findById(poId);
    if (!po) {
      return res.status(404).json({ message: "PO not found" });
    }

    if (po.status === "received") {
      return res.status(400).json({ message: "PO already received" });
    }

    const updatedMaterials = [];

    if (Array.isArray(po.lineItems) && po.lineItems.length > 0) {
      for (const line of po.lineItems) {
        let material = null;

        if (line.materialId) {
          material = await Material.findById(line.materialId);
        }

        if (!material && line.materialName) {
          material = await Material.findOne({
            name: { $regex: new RegExp(`^${String(line.materialName).trim()}$`, "i") },
          });
        }

        const qtyToAdd = Number(line.quantity || 0);

        if (material) {
          material.currentStock = Number(material.currentStock || 0) + qtyToAdd;
          await material.save();

          await StockMovement.create({
            materialId: material._id,
            materialName: material.name,
            type: "IN",
            quantity: qtyToAdd,
            balanceAfter: material.currentStock,
            source: "purchase",
            note: `PO ${po.poNumber} received`,
          });

          updatedMaterials.push({
            materialId: material._id,
            materialName: material.name,
            addedQty: qtyToAdd,
            currentStock: material.currentStock,
          });

          if (global.io) {
            global.io.emit("stockUpdated", {
              materialId: material._id,
              materialName: material.name,
              currentStock: material.currentStock,
            });
          }
        } else {
          await StockMovement.create({
            materialId: null,
            materialName: line.materialName || "Unknown Material",
            type: "IN",
            quantity: qtyToAdd,
            balanceAfter: qtyToAdd,
            source: "purchase",
            note: `PO ${po.poNumber} received (no linked material found)`,
          });
        }
      }
    } else {
      const material = await Material.findOne({
        name: { $regex: new RegExp(`^${String(po.supplier).trim()}$`, "i") },
      });

      if (material) {
        const qtyToAdd = Number(po.items || 0);

        material.currentStock = Number(material.currentStock || 0) + qtyToAdd;
        await material.save();

        await StockMovement.create({
          materialId: material._id,
          materialName: material.name,
          type: "IN",
          quantity: qtyToAdd,
          balanceAfter: material.currentStock,
          source: "purchase",
          note: `PO ${po.poNumber} received`,
        });

        updatedMaterials.push({
          materialId: material._id,
          materialName: material.name,
          addedQty: qtyToAdd,
          currentStock: material.currentStock,
        });

        if (global.io) {
          global.io.emit("stockUpdated", {
            materialId: material._id,
            materialName: material.name,
            currentStock: material.currentStock,
          });
        }
      } else {
        await StockMovement.create({
          materialId: null,
          materialName: po.supplier,
          type: "IN",
          quantity: Number(po.items || 0),
          balanceAfter: Number(po.items || 0),
          source: "purchase",
          note: `PO ${po.poNumber} received (no linked material found)`,
        });
      }
    }

    po.status = "received";
    await po.save();

    if (global.io) {
      global.io.emit("poReceived", {
        poId: po._id,
        poNumber: po.poNumber,
        status: po.status,
      });
    }

    res.json({
      message: `PO ${po.poNumber} marked as received`,
      po,
      updatedMaterials,
    });
  } catch (err) {
    console.error("Receive PO error:", err);
    res.status(500).json({ message: "Error receiving PO", error: err.message });
  }
};

/* =======================
   GET all POs
======================= */
export const getAllPOs = async (req, res) => {
  try {
    const pos = await PO.find().sort({ createdAt: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =======================
   UPDATE PO
======================= */
export const updatePO = async (req, res) => {
  try {
    const updatedData = { ...req.body };

    if (updatedData.items !== undefined) {
      updatedData.items = Number(updatedData.items);
    }

    if (updatedData.totalAmount !== undefined) {
      updatedData.totalAmount = Number(updatedData.totalAmount);
    }

    if (Array.isArray(updatedData.lineItems)) {
      updatedData.lineItems = updatedData.lineItems.map((item) => ({
        materialId: item.materialId || null,
        materialName: String(item.materialName || "").trim(),
        quantity: Number(item.quantity || 0),
        unit: item.unit || "pcs",
        unitCost: Number(item.unitCost || 0),
        supplier: item.supplier || "",
      }));
    }

    const updatedPO = await PO.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPO) {
      return res.status(404).json({ message: "PO not found" });
    }

    res.json(updatedPO);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};