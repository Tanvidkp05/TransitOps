import express from "express";
import fs from "fs";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { createSecureImageUpload } from "../../middlewares/secureUpload.js";
import {
  createMaintenanceLog,
  getAllMaintenanceLogs,
  getMaintenanceLogById,
  updateMaintenanceLog,
  deleteMaintenanceLog,
  listMaintenanceLogsByParams,
} from "../../controllers/v1/maintenanceLog.controller.js";

const router = express.Router();

const maintenanceUploadDir = "uploads/maintenance";

// Ensure upload directory exists
if (!fs.existsSync(maintenanceUploadDir)) {
  fs.mkdirSync(maintenanceUploadDir, { recursive: true });
}

// Secure upload middleware for maintenance log images (e.g. receipts/photos)
const secureMaintenanceUpload = createSecureImageUpload({
  destination: maintenanceUploadDir,
  fieldName: "image",
  maxSize: 5 * 1024 * 1024, // 5MB limit
  compress: true,
  quality: 85,
});

// ============ MAINTENANCE LOG ENDPOINTS ============

router.post(
  "/maintenance-logs",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  secureMaintenanceUpload,
  createMaintenanceLog
);

router.get(
  "/maintenance-logs",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getAllMaintenanceLogs
);

router.get(
  "/maintenance-logs/:maintenanceLogId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getMaintenanceLogById
);

router.put(
  "/maintenance-logs/:maintenanceLogId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  secureMaintenanceUpload,
  updateMaintenanceLog
);

router.delete(
  "/maintenance-logs/:maintenanceLogId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteMaintenanceLog
);

router.post(
  "/maintenance-logs/search",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listMaintenanceLogsByParams
);

export default router;
