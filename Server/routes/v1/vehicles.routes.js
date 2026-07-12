import express from "express";
import fs from "fs";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { createSecureImageUpload } from "../../middlewares/secureUpload.js";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  listVehiclesByParams,
} from "../../controllers/v1/vehicle.controller.js";

const router = express.Router();

const vehicleUploadDir = "uploads/vehicles";

// Ensure upload directory exists
if (!fs.existsSync(vehicleUploadDir)) {
  fs.mkdirSync(vehicleUploadDir, { recursive: true });
}

// Secure upload middleware for vehicle images
const secureVehicleUpload = createSecureImageUpload({
  destination: vehicleUploadDir,
  fieldName: "image",
  maxSize: 5 * 1024 * 1024, // 5MB limit
  compress: true,
  quality: 85,
});

// ============ VEHICLE ENDPOINTS ============

router.post(
  "/vehicles",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  secureVehicleUpload,
  createVehicle
);

router.get(
  "/vehicles",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getAllVehicles
);

router.get(
  "/vehicles/:vehicleId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getVehicleById
);

router.put(
  "/vehicles/:vehicleId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  secureVehicleUpload,
  updateVehicle
);

router.delete(
  "/vehicles/:vehicleId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteVehicle
);

router.post(
  "/vehicles/search",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listVehiclesByParams
);

export default router;
