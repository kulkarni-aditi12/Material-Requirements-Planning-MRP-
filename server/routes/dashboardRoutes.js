// server/routes/dashboardRoutes.js
import express from "express";
import {
  getDashboardStats,
  getLowStockAlerts
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", getDashboardStats);
router.get("/alerts", getLowStockAlerts);

export default router;
