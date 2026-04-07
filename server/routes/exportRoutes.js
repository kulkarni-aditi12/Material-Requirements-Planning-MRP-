import express from "express";
import {
  exportBOMPdf,
  exportPOPdf,
  exportMRPRunPdf,
  exportShortagePdf,
} from "../controllers/exportController.js";

const router = express.Router();

router.get("/bom/:bomId", exportBOMPdf);
router.get("/po/:poId", exportPOPdf);
router.get("/mrp/:mrpRunId", exportMRPRunPdf);
router.get("/shortage/latest", exportShortagePdf);

export default router;