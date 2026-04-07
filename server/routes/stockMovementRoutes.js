import express from "express";
import { getAllStockMovements } from "../controllers/stockMovementController.js";

const router = express.Router();

router.get("/", getAllStockMovements);

export default router;