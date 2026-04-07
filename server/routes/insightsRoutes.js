import express from "express";
import {
  getOverviewSummary,
  getAnalyticsData,
} from "../controllers/insightsController.js";

const router = express.Router();

router.get("/overview", getOverviewSummary);
router.get("/analytics", getAnalyticsData);

export default router;