import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import BOM from "../models/BOM.js";

import {
  createBOM,
  getAllBOMs,
  getBOMById,
  updateBOM,
  deleteBOM,
  executeProduction
} from "../controllers/bomController.js";

import { runBomSync } from "../controllers/bomSyncController.js";

const router = express.Router();
const upload = multer({ dest: path.join(process.cwd(), "tmp_uploads") });

router.post("/execute", executeProduction);
router.post("/sync", runBomSync);

router.get("/", getAllBOMs);
router.post("/", createBOM);

router.get("/:id", getBOMById);
router.put("/:id", updateBOM);
router.delete("/:id", deleteBOM);

router.get("/export/pdf/:id", async (req, res) => {
  try {
    const bom = await BOM.findById(req.params.id).lean();
    if (!bom) return res.status(404).json({ message: "BOM not found" });

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="BOM_${bom.productName.replace(/[^a-z0-9]/gi, "_")}.pdf"`
    );
    doc.pipe(res);

    doc.fontSize(20).text("Sunrise Technologies", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(`BOM Report: ${bom.productName}`);
    doc.text(`Version: ${bom.version || "-"}`);
    doc.text(`Last Updated: ${new Date(bom.lastUpdated).toLocaleString()}`);
    doc.text(`Total Cost: ${bom.totalCost}`);
    doc.moveDown();

    doc.fontSize(14).text("Materials", { underline: true });
    doc.moveDown(0.2);

    bom.materials.forEach((m) => {
      doc.fontSize(12).text(`Name: ${m.name}`);
      doc.text(`Qty: ${m.quantity} ${m.unit}`);
      doc.text(`Unit Cost: ${m.unitCost} | Total: ${m.totalCost}`);
      doc.text(`Supplier: ${m.supplier}`);
      doc.text("----------------------------");
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;