import express from "express";
import {
  addStock,
  clearAllHistory,
  clearStock,
  confirmStock,
  deleteHistoryLog,
  distributeStock,
  editHistoryLog,
  getAdminList,
  getDashboardMetrics,
  getInventory,
  getInventoryHistory,
  resetStock
} from "../controllers/inventoryController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getInventory);
router.get("/dashboard", getDashboardMetrics);
router.get("/admins", authorizeRoles("admin"), getAdminList);
router.post("/add", authorizeRoles("admin"), addStock);
router.post("/distribute", authorizeRoles("admin"), distributeStock);
router.post("/reset", authorizeRoles("admin"), resetStock);
router.post("/clear", authorizeRoles("admin"), clearStock);
router.get("/history", getInventoryHistory);
router.delete("/history/clear-all", authorizeRoles("admin"), clearAllHistory);
router.post("/history/:id/confirm", authorizeRoles("admin"), confirmStock);
router.put("/history/:id", authorizeRoles("admin"), editHistoryLog);
router.delete("/history/:id", authorizeRoles("admin"), deleteHistoryLog);

export default router;
