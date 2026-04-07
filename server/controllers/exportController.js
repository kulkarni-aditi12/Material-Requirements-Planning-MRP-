import PDFDocument from "pdfkit";
import BOM from "../models/BOM.js";
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

const generatePdfHeader = (doc, title) => {
  doc.fontSize(20).text(title, { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, {
    align: "right",
  });
  doc.moveDown();
};

export const exportBOMPdf = async (req, res) => {
  try {
    const { bomId } = req.params;
    const bom = await BOM.findById(bomId);

    if (!bom) {
      return res.status(404).json({ message: "BOM not found" });
    }

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bom-${String(bom.productName || "report").replace(/\s+/g, "-")}.pdf`
    );

    doc.pipe(res);
    generatePdfHeader(doc, "Bill of Materials Report");

    doc.fontSize(14).text(`Product: ${bom.productName}`);
    doc.moveDown();

    const rows = getBomRows(bom);
    rows.forEach((row, index) => {
      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${getMaterialName(row)} | Qty: ${getQtyPerUnit(row)} | Unit: ${
            row.unit || "pcs"
          } | Unit Cost: ${row.unitCost || 0} | Supplier: ${row.supplier || "-"}`
        );
    });

    doc.end();
  } catch (err) {
    console.error("Export BOM PDF error:", err);
    res.status(500).json({ message: "Failed to export BOM PDF", error: err.message });
  }
};

export const exportPOPdf = async (req, res) => {
  try {
    const { poId } = req.params;
    const po = await PO.findById(poId);

    if (!po) {
      return res.status(404).json({ message: "PO not found" });
    }

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=po-${po.poNumber}.pdf`
    );

    doc.pipe(res);
    generatePdfHeader(doc, "Purchase Order Report");

    doc.fontSize(14).text(`PO Number: ${po.poNumber}`);
    doc.text(`Supplier: ${po.supplier}`);
    doc.text(`Items: ${po.items}`);
    doc.text(`Amount: ₹${po.totalAmount}`);
    doc.text(`Status: ${po.status}`);
    doc.text(`Date: ${new Date(po.date).toLocaleDateString()}`);
    doc.text(`Delivery Date: ${new Date(po.deliveryDate).toLocaleDateString()}`);

    doc.end();
  } catch (err) {
    console.error("Export PO PDF error:", err);
    res.status(500).json({ message: "Failed to export PO PDF", error: err.message });
  }
};

export const exportMRPRunPdf = async (req, res) => {
  try {
    const { mrpRunId } = req.params;
    const run = await MRPRun.findById(mrpRunId);

    if (!run) {
      return res.status(404).json({ message: "MRP run not found" });
    }

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=mrp-run-${run.productName}.pdf`
    );

    doc.pipe(res);
    generatePdfHeader(doc, "MRP Run Report");

    doc.fontSize(14).text(`Product: ${run.productName}`);
    doc.text(`Demand Quantity: ${run.demandQuantity}`);
    doc.text(`Status: ${run.status}`);
    doc.moveDown();

    run.results.forEach((r, index) => {
      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${r.materialName} | Required: ${r.requiredQty} | Stock: ${
            r.currentStock
          } | Shortage: ${r.shortage} | Estimated Cost: ₹${r.estimatedPurchaseCost || 0}`
        );
    });

    doc.end();
  } catch (err) {
    console.error("Export MRP PDF error:", err);
    res.status(500).json({ message: "Failed to export MRP PDF", error: err.message });
  }
};

export const exportShortagePdf = async (req, res) => {
  try {
    const latestRun = await MRPRun.findOne().sort({ createdAt: -1 });

    if (!latestRun) {
      return res.status(404).json({ message: "No MRP runs found" });
    }

    const shortages = latestRun.results.filter((r) => Number(r.shortage) > 0);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=shortage-report.pdf");

    doc.pipe(res);
    generatePdfHeader(doc, "Shortage Report");

    doc.fontSize(14).text(`Product: ${latestRun.productName}`);
    doc.text(`Demand Quantity: ${latestRun.demandQuantity}`);
    doc.moveDown();

    if (shortages.length === 0) {
      doc.text("No shortages found.");
    } else {
      shortages.forEach((r, index) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. ${r.materialName} | Required: ${r.requiredQty} | Available: ${
              r.currentStock
            } | Shortage: ${r.shortage} | Suggested Purchase Cost: ₹${
              r.estimatedPurchaseCost || 0
            }`
          );
      });
    }

    doc.end();
  } catch (err) {
    console.error("Export shortage PDF error:", err);
    res.status(500).json({ message: "Failed to export shortage PDF", error: err.message });
  }
};