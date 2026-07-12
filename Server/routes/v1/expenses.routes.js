import express from "express";
import fs from "fs";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { createSecureImageUpload } from "../../middlewares/secureUpload.js";
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  listExpensesByParams,
  getVehicleOperationalCosts,
  getLatestFuelByVehicle,
} from "../../controllers/v1/expense.controller.js";

const router = express.Router();

const expensesUploadDir = "uploads/expenses";

// Ensure upload directory exists
if (!fs.existsSync(expensesUploadDir)) {
  fs.mkdirSync(expensesUploadDir, { recursive: true });
}

// Secure upload middleware for receipt images
const secureExpenseUpload = createSecureImageUpload({
  destination: expensesUploadDir,
  fieldName: "receipt_image",
  maxSize: 5 * 1024 * 1024, // 5MB limit
  compress: true,
  quality: 85,
});

// ============ EXPENSE ENDPOINTS ============

router.post(
  "/expenses",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  secureExpenseUpload,
  createExpense
);

router.get(
  "/expenses",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getAllExpenses
);

router.get(
  "/expenses/vehicle-costs",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getVehicleOperationalCosts
);

router.get(
  "/expenses/latest-fuel/:vehicleId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getLatestFuelByVehicle
);

router.get(
  "/expenses/:expenseId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getExpenseById
);

router.put(
  "/expenses/:expenseId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  secureExpenseUpload,
  updateExpense
);

router.delete(
  "/expenses/:expenseId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteExpense
);

router.post(
  "/expenses/search",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listExpensesByParams
);

export default router;
