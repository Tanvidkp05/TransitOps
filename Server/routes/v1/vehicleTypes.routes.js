import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
  createVehicleType,
  updateVehicleType,
  deleteVehicleType,
  getVehicleTypeById,
  listVehicleTypes,
  listVehicleTypeByParams,
} from "../../controllers/v1/vehicleType.controller.js";

const router = express.Router();

router.post(
  "/vehicle-types",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  createVehicleType
);

router.get(
  "/vehicle-types",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listVehicleTypes
);

router.get(
  "/vehicle-types/:vehicleTypeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getVehicleTypeById
);

router.put(
  "/vehicle-types/:vehicleTypeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  updateVehicleType
);

router.delete(
  "/vehicle-types/:vehicleTypeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteVehicleType
);

router.post(
  "/vehicle-types/search",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listVehicleTypeByParams
);

export default router;
