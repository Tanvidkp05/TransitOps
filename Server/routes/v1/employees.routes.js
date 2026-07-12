import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeById,
  listAllEmployees,
  listEmployeesByParams,
  listAllEmployeesByDepartment,
  loginEmployee,
  getCurrentUser,
  resetPassword,
  logoutUser,
  verifySession,
} from "../../controllers/v1/employee.controller.js";
// ============ SECURITY IMPORTS ============
import { authRateLimiter, searchRateLimiter, passwordResetRateLimiter } from "../../middlewares/rateLimiter.js";
import {
  loginValidation,
  searchValidation,
  createEmployeeValidation,
  allowOnlyFields,
  allowedLoginFields,
  allowedEmployeeFields,
  allowedSearchFields
} from "../../middlewares/inputValidator.js";

const router = express.Router();

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployee'
 *     responses:
 *       200:
 *         description: Employee created successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/employees",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  createEmployee,
);

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: List all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isOk:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 */
router.get(
  "/employees",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listAllEmployees,
);

/**
 * @swagger
 * /employees/{employeeId}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Employee not found
 */
router.get(
  "/employees/:employeeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getEmployeeById,
);

/**
 * @swagger
 * /employees/{employeeId}:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployee'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 */
router.put(
  "/employees/:employeeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  updateEmployee,
);

/**
 * @swagger
 * /employees/{employeeId}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 */
router.delete(
  "/employees/:employeeId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteEmployee,
);

/**
 * @swagger
 * /employees/search:
 *   post:
 *     summary: Search employees with pagination
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SearchParams'
 *     responses:
 *       200:
 *         description: Paginated list of employees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.post(
  "/employees/search",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listEmployeesByParams,
);

/**
 * @swagger
 * /employees/department/{departmentId}:
 *   post:
 *     summary: List all employees by department with pagination
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SearchParams'
 *     responses:
 *       200:
 *         description: Paginated list of employees by department
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get(
  "/employees/department/:departmentId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  listAllEmployeesByDepartment,
);

/**
 * @swagger
 * /employees/{employeeId}/reset-password:
 *   post:
 *     summary: Reset employee password
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: Employee not found
 */
router.post(
  "/employees/:employeeId/reset-password",
  authMiddleware(["ADMIN"]),
  resetPassword,
);

/**
 * @swagger
 * /auth/employee/login:
 *   post:
 *     summary: Employee login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
// SECURITY: Rate limit + field whitelist + input validation on login
router.post(
  "/auth/employee/login",
  authRateLimiter,                          // Strict rate limiting (5 attempts/15 min)
  allowOnlyFields(allowedLoginFields),      // Reject unexpected fields
  loginValidation,                          // Validate & sanitize input
  loginEmployee
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Unauthorized
 */
router.get("/auth/me", authMiddleware(["ADMIN", "EMPLOYEE"]), getCurrentUser);

// ============ LOGOUT ROUTE ============

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/auth/logout", authMiddleware(["ADMIN", "EMPLOYEE"]), logoutUser);

/**
 * @swagger
 * /auth/verify-session:
 *   get:
 *     summary: Verify if session is valid
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isOk:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *       401:
 *         description: Session invalid or expired
 */
router.get("/auth/verify-session", authMiddleware(["ADMIN", "EMPLOYEE"]), verifySession);

// ============ LOGIN ATTEMPT LIMITATION ROUTES ============
import authService from "../../services/authService.js";

/**
 * @swagger
 * /auth/login-status/{userId}:
 *   get:
 *     summary: Get login attempt status for a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to check status
 *     responses:
 *       200:
 *         description: Login attempt status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attemptCount:
 *                   type: number
 *                 isLocked:
 *                   type: boolean
 *                 lockUntil:
 *                   type: string
 *                   format: date-time
 *                 remainingTime:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/auth/login-status/:userId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  async (req, res) => {
    try {
      const status = await authService.getLoginAttemptStatus(req.params.userId);
      res.status(200).json({
        isOk: true,
        data: status,
        status: 200,
      });
    } catch (error) {
      res.status(500).json({
        isOk: false,
        message: error.message,
        status: 500,
      });
    }
  }
);

/**
 * @swagger
 * /auth/login-status-by-email:
 *   post:
 *     summary: Get login attempt status by email (for login form)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login attempt status
 */
router.post("/auth/login-status-by-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        isOk: false,
        message: "Email is required",
        status: 400,
      });
    }
    const status = await authService.getLoginAttemptStatus(null, email);
    res.status(200).json({
      isOk: true,
      data: status,
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
});

/**
 * @swagger
 * /admin/auth/reset-attempts:
 *   post:
 *     summary: Admin - Reset login attempts for a user
 *     tags: [Admin - Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attempts reset successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/admin/auth/reset-attempts",
  authMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          isOk: false,
          message: "userId is required",
          status: 400,
        });
      }

      await authService.resetLoginAttempts(userId);
      const status = await authService.getLoginAttemptStatus(userId);

      res.status(200).json({
        isOk: true,
        message: "Login attempts reset successfully",
        data: status,
        status: 200,
      });
    } catch (error) {
      res.status(500).json({
        isOk: false,
        message: error.message,
        status: 500,
      });
    }
  }
);

/**
 * @swagger
 * /admin/auth/unlock:
 *   post:
 *     summary: Admin - Unlock a locked user account
 *     tags: [Admin - Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account unlocked successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/admin/auth/unlock",
  authMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          isOk: false,
          message: "userId is required",
          status: 400,
        });
      }

      await authService.unlockAccount(userId);
      const status = await authService.getLoginAttemptStatus(userId);

      res.status(200).json({
        isOk: true,
        message: "Account unlocked successfully",
        data: status,
        status: 200,
      });
    } catch (error) {
      res.status(500).json({
        isOk: false,
        message: error.message,
        status: 500,
      });
    }
  }
);

/**
 * @swagger
 * /admin/auth/login-attempts:
 *   post:
 *     summary: Admin - List all login attempts with pagination
 *     tags: [Admin - Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skip:
 *                 type: number
 *               per_page:
 *                 type: number
 *               match:
 *                 type: string
 *               sorton:
 *                 type: string
 *               sortdir:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of login attempts
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/admin/auth/login-attempts",
  authMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const { skip = 0, per_page = 10, match, sorton, sortdir } = req.body;
      const LoginAttempt = (await import("../../models/LoginAttempt.js")).default;

      // Build match query
      let matchQuery = {};
      if (match) {
        matchQuery = {
          $or: [
            { userEmail: { $regex: match, $options: "i" } },
            { ipAddress: { $regex: match, $options: "i" } },
            { "locationCoordinates.city": { $regex: match, $options: "i" } },
            { "locationCoordinates.country": { $regex: match, $options: "i" } },
          ],
        };
      }

      // Build sort query
      let sortQuery = { lastLoginAttempt: -1 }; // Default: most recent first
      if (sorton && sortdir) {
        sortQuery = { [sorton]: sortdir === "desc" ? -1 : 1 };
      }

      // Get total count
      const totalCount = await LoginAttempt.countDocuments(matchQuery);

      // Get paginated data - first get raw data without populate
      const attempts = await LoginAttempt.find(matchQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(per_page)
        .lean();

      // Import models for lookup
      const Employee = (await import("../../models/Employee.js")).default;
      const CompanyMaster = (await import("../../models/CompanyMaster.js")).default;

      // Format the response with proper user lookup
      const formattedAttempts = await Promise.all(attempts.map(async (attempt) => {
        // Try to find user in Employee collection first, then CompanyMaster
        let employeeName = "Unknown";
        let foundUser = null;
        let isActive = true; // Default to true if user not found

        if (attempt.userId) {
          foundUser = await Employee.findById(attempt.userId).select("employeeName isActive").lean();
          if (foundUser) {
            employeeName = foundUser.employeeName || "Unknown";
            isActive = foundUser.isActive;
          } else {
            // Try CompanyMaster
            const company = await CompanyMaster.findById(attempt.userId).select("companyName email isActive").lean();
            if (company) {
              employeeName = company.companyName || company.email || "Admin";
              isActive = company.isActive;
            }
          }
        }

        return {
          _id: attempt._id,
          userId: attempt.userId, // This is the raw ObjectId, not populated
          employeeName: employeeName,
          userEmail: attempt.userEmail,
          attemptCount: attempt.attemptCount,
          isLocked: attempt.isLocked,
          lockUntil: attempt.lockUntil,
          lastLoginAttempt: attempt.lastLoginAttempt,
          lastLoggedIn: attempt.lastLoggedIn,
          ipAddress: attempt.ipAddress,
          city: attempt.locationCoordinates?.city || "-",
          country: attempt.locationCoordinates?.country || "-",
          latitude: attempt.locationCoordinates?.latitude || null,
          longitude: attempt.locationCoordinates?.longitude || null,
          isActive: isActive,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        };
      }));

      res.status(200).json({
        isOk: true,
        data: [
          {
            count: totalCount,
            data: formattedAttempts,
          },
        ],
        status: 200,
      });
    } catch (error) {
      console.error("Error fetching login attempts:", error);
      res.status(500).json({
        isOk: false,
        message: error.message,
        status: 500,
      });
    }
  }
);

/**
 * @swagger
 * /admin/auth/block:
 *   post:
 *     summary: Admin - Block a user account
 *     tags: [Admin - Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account blocked successfully
 *       404:
 *         description: User not found
 */
router.post(
  "/admin/auth/block",
  authMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          isOk: false,
          message: "userId is required",
          status: 400,
        });
      }

      const Employee = (await import("../../models/Employee.js")).default;
      const CompanyMaster = (await import("../../models/CompanyMaster.js")).default;

      // Try to find and block in Employee first
      let user = await Employee.findByIdAndUpdate(userId, { isActive: false });
      let userType = "Employee";

      // If not found, try CompanyMaster
      if (!user) {
        user = await CompanyMaster.findByIdAndUpdate(userId, { isActive: false });
        userType = "Company";
      }

      if (!user) {
        return res.status(404).json({
          isOk: false,
          message: "User not found",
          status: 404,
        });
      }

      res.status(200).json({
        isOk: true,
        message: `${userType} account blocked successfully`,
        status: 200,
      });
    } catch (error) {
      console.error("Error blocking account:", error);
      res.status(500).json({
        isOk: false,
        message: error.message,
        status: 500,
      });
    }
  }
);

/**
 * @swagger
 * /admin/auth/unblock:
 *   post:
 *     summary: Admin - Unblock a user account
 *     tags: [Admin - Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account unblocked successfully
 *       404:
 *         description: User not found
 */
router.post(
  "/admin/auth/unblock",
  authMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({
          isOk: false,
          message: "userId is required",
          status: 400,
        });
      }

      const Employee = (await import("../../models/Employee.js")).default;
      const CompanyMaster = (await import("../../models/CompanyMaster.js")).default;

      // Try to find and unblock in Employee first
      let user = await Employee.findByIdAndUpdate(userId, { isActive: true });
      let userType = "Employee";

      // If not found, try CompanyMaster
      if (!user) {
        user = await CompanyMaster.findByIdAndUpdate(userId, { isActive: true });
        userType = "Company";
      }

      if (!user) {
        return res.status(404).json({
          isOk: false,
          message: "User not found",
          status: 404,
        });
      }

      res.status(200).json({
        isOk: true,
        message: `${userType} account unblocked successfully`,
        status: 200,
      });
    } catch (error) {
      console.error("Error unblocking account:", error);
      res.status(500).json({
        isOk: false,
        message: error.message,
        status: 500,
      });
    }
  }
);

export default router;

