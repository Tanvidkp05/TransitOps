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
  getLatestFuelByVehicle,
  getVehicleCosts,
} from "../../controllers/v1/expense.controller.js";
import {
  createExpenseValidation,
  updateExpenseValidation,
  searchValidation,
  allowOnlyFields,
  allowedExpenseFields,
  allowedExpenseSearchFields,
} from "../../middlewares/inputValidator.js";

const router = express.Router();

const receiptsUploadDir = "uploads/receipts";

// Ensure upload directory exists
if (!fs.existsSync(receiptsUploadDir)) {
  fs.mkdirSync(receiptsUploadDir, { recursive: true });
}

// Secure upload middleware for expense receipt images
const secureReceiptUpload = createSecureImageUpload({
  destination: receiptsUploadDir,
  fieldName: "receipt_image",
  maxSize: 5 * 1024 * 1024, // 5MB limit
  compress: true,
  quality: 85,
});

// ============ EXPENSE ENDPOINTS ============

router.post(
  "/expenses",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  secureReceiptUpload,
  allowOnlyFields(allowedExpenseFields),
  createExpenseValidation,
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
  getVehicleCosts
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
  secureReceiptUpload,
  allowOnlyFields(allowedExpenseFields),
  updateExpenseValidation,
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
  allowOnlyFields(allowedExpenseSearchFields),
  searchValidation,
  listExpensesByParams
);

export default router;
