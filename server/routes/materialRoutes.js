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

router.post("/edit-stock", editStock);

export default router;
