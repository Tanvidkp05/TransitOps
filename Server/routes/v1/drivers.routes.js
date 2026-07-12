import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { searchRateLimiter } from "../../middlewares/rateLimiter.js";
import {
  allowOnlyFields,
  allowedDriverFields,
  allowedSearchFields,
  createDriverValidation,
  updateDriverValidation,
  searchValidation,
} from "../../middlewares/inputValidator.js";
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  listDriversByParams,
} from "../../controllers/v1/driver.controller.js";

const router = express.Router();

router.post(
  "/drivers",
  authMiddleware(["ADMIN"]),
  allowOnlyFields(allowedDriverFields),
  createDriverValidation,
  createDriver,
);

router.get(
  "/drivers",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getAllDrivers,
);

router.get(
  "/drivers/:driverId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getDriverById,
);

router.put(
  "/drivers/:driverId",
  authMiddleware(["ADMIN"]),
  allowOnlyFields(allowedDriverFields),
  updateDriverValidation,
  updateDriver,
);

router.delete(
  "/drivers/:driverId",
  authMiddleware(["ADMIN"]),
  deleteDriver,
);

router.post(
  "/drivers/search",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  searchRateLimiter,
  allowOnlyFields(allowedSearchFields),
  searchValidation,
  listDriversByParams,
);

export default router;
