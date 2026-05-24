import express from "express";
import { getMonthlyReport, getMonthlyTrends } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/monthly", getMonthlyReport);
router.get("/trends", getMonthlyTrends);

export default router;

