import express from "express";
import {
  startProduction,
  getProductionRuns,
} from "../controllers/manufacturingController.js";

const router = express.Router();

router.post("/start", startProduction);
router.get("/", getProductionRuns);

export default router;