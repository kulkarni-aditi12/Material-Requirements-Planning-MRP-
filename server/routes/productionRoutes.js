import express from "express";
import { startProduction } from "../controllers/productionController.js";

const router = express.Router();

router.post("/start", startProduction);

export default router;