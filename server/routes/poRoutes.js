import express from "express";
import { createPO, receivePO, getAllPOs, updatePO } from "../controllers/poController.js";

const router = express.Router();

router.get("/", getAllPOs);
router.post("/", createPO);
router.post("/receive", receivePO);
router.put("/:id", updatePO);

export default router;