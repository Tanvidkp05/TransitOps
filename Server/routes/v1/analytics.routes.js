import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { getFleetAnalytics } from "../../controllers/v1/analytics.controller.js";

const router = express.Router();

// ============ ANALYTICS SUMMARY ENDPOINTS ============

router.get(
  "/analytics/summary",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getFleetAnalytics
);

export default router;
