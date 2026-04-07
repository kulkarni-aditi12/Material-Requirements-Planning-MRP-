import express from "express";
import {
  runMRP,
  getAllMRPRuns,
  createPOsFromMRP,
} from "../controllers/mrpController.js";

const router = express.Router();

router.post("/run", runMRP);
router.get("/", getAllMRPRuns);
router.post("/create-pos", createPOsFromMRP);

export default router;