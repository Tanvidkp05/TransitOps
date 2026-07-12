import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { createSecureDocumentUpload } from "../../middlewares/secureUpload.js";
import {
  uploadDocument,
  listByVehicle,
  getDocument,
  downloadDocument,
  deleteDocument,
} from "../../controllers/v1/vehicleDocument.controller.js";

const router = express.Router();

const uploadDir = "uploads/vehicle-docs";

// Ensure upload dir exists
import fs from "fs";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const uploadMiddleware = createSecureDocumentUpload({ destination: uploadDir, fieldName: "file" });

router.post(
  "/vehicle-documents",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  uploadMiddleware,
  uploadDocument
);

router.get(
  "/vehicle-documents/vehicle/:vehicleId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listByVehicle
);

router.get(
  "/vehicle-documents/:docId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getDocument
);

router.get(
  "/vehicle-documents/:docId/download",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  downloadDocument
);

router.delete(
  "/vehicle-documents/:docId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteDocument
);

export default router;
