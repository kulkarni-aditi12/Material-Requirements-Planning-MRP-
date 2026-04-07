// server/routes/materialRoutes.js
import express from "express";
import {
  getAllMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  editStock
} from "../controllers/materialController.js";

const router = express.Router();

router.get("/", getAllMaterials);
router.post("/", addMaterial);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

/* 🔥 Phase-1 stock edit route */
router.post("/edit-stock", editStock);

export default router;
