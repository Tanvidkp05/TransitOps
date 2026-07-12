import CompanyMasterModels from "../../models/CompanyMaster.js";
import EmployeeModels from "../../models/Employee.js";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import authService from "../../services/authService.js";

export const createCompanyMaster = async (req, res) => {
  try {
    const {
      companyName,
      email,
      password,
      mobileNumber,
      gstNumber,
      countryId,
      stateId,
      cityId,
      address,
      pincode,
      website,
      isActive,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const companyMaster = new CompanyMasterModels({
      companyName,
      email,
      password: hashedPassword,
      mobileNumber,
      gstNumber,
      countryId,
      stateId,
      cityId,
      address,
      pincode,
      website,
      isActive,
    });

    // Handle file uploads
    if (req.files && req.files.logo) {
      companyMaster.logo = req.files.logo[0].path;
    }

    if (req.files && req.files.favicon) {
      companyMaster.favicon = req.files.favicon[0].path;
    }

    await companyMaster.save();

    return res.status(201).json({
      isOk: true,
      message: "Company Master created successfully",
    });
  } catch (error) {
    console.log("Error in createCompanyMaster", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

export const updateCompanyMaster = async (req, res) => {
  try {
    const companyId = req.params.id;
    const companyMaster = await CompanyMasterModels.findById(companyId);

    if (!companyMaster) {
      return res.status(404).json({
        isOk: false,
        message: "Company Master not found",
      });
    }

    const updateFields = [
      "companyName",
      "email",
      "contactPersonName",
      "contactNumber",
      "mobileNumber",
      "gstNumber",
      "countryId",
      "stateId",
      "cityId",
      "address",
      "pincode",
      "isActive",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        companyMaster[field] = req.body[field];
      }
    });

    // Handle file updates
    if (req.files && req.files.logo) {
      if (companyMaster.logo) {
        const oldLogoPath = path.join(companyMaster.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      companyMaster.logo = req.files.logo[0].path;
    }

    if (req.files && req.files.favicon) {
      if (companyMaster.favicon) {
        const oldFaviconPath = path.join(companyMaster.favicon);
        if (fs.existsSync(oldFaviconPath)) {
          fs.unlinkSync(oldFaviconPath);
        }
      }
      companyMaster.favicon = req.files.favicon[0].path;
    }

    await companyMaster.save();

    return res.status(200).json({
      isOk: true,
      message: "Company Master updated successfully",
    });
  } catch (error) {
    console.error("Error in updateCompanyMaster", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

export const loginCompany = async (req, res) => {
  try {
    const { email, password, locationConsent, ipConsent, clientLatitude, clientLongitude } = req.body;

    // Get IP address: prefer client-provided (from frontend), fallback to server-detected
    const ipAddress = req.ip ||
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      "unknown";

    // Get client location from headers/body (sent by frontend after user consent)
    const clientLocation = {
      latitude: clientLatitude || req.headers["x-client-latitude"] || null,
      longitude: clientLongitude || req.headers["x-client-longitude"] || null,
    };

    // Log the received security information
    console.log(`Login attempt from IP: ${ipAddress}, Location: ${JSON.stringify(clientLocation)}`);

    // Validate consent checkboxes
    if (!locationConsent || !ipConsent) {
      return res.status(400).json({
        isOk: false,
        message: "Please accept both location and IP address tracking consent to continue",
        error: "Consent required",
        status: 400,
      });
    }

    let user = null;
    let role = null;
    let userId = null;
    let userModel = null;

    const companyMaster = await CompanyMasterModels.findOne({
      email,
      isActive: true,
    })
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .exec();

    const employee = await EmployeeModels.findOne({
      emailOffice: email,
      isActive: true,
    })
      .populate("departmentId")
      .populate("stateId")
      .populate("cityId")
      .exec();

    if (companyMaster) {
      user = companyMaster;
      userId = companyMaster._id;
      role = "ADMIN";
      userModel = "CompanyMaster";
    } else if (employee) {
      user = employee;
      userId = employee._id;
      role = "EMPLOYEE";
      userModel = "Employee";
    }

    if (!user) {
      return res.status(404).json({
        isOk: false,
        message: "User not found",
        status: 404,
      });
    }

    // Check if account is locked BEFORE password verification
    const isLocked = await authService.isAccountLocked(userId, email);
    if (isLocked) {
      const status = await authService.getLoginAttemptStatus(userId, email);
      return res.status(423).json({
        isOk: false,
        message: "Account locked due to multiple failed login attempts",
        error: "Account locked",
        lockedUntil: status.lockUntil,
        remainingTimeMs: status.remainingTime,
        status: 423,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      // Record failed attempt with client-provided location
      const attemptResult = await authService.recordFailedAttempt(
        userId,
        email,
        ipAddress,
        clientLocation
      );

      // Check if account just got locked
      if (attemptResult.isLocked) {
        return res.status(423).json({
          isOk: false,
          message: "Account locked due to multiple failed login attempts",
          error: "Account locked",
          lockedUntil: attemptResult.lockUntil,
          remainingTimeMs: 24 * 60 * 60 * 1000, // 24 hours
          status: 423,
        });
      }

      // Return 401 with remaining attempts
      const warningMessage = attemptResult.attemptsRemaining <= 1
        ? "Warning: One more failed attempt will lock your account"
        : null;

      return res.status(401).json({
        isOk: false,
        message: "Invalid email or password",
        error: "Invalid credentials",
        attemptsRemaining: attemptResult.attemptsRemaining,
        warning: warningMessage,
        status: 401,
      });
    }

    // Successful login - record it and reset attempt count with IP and location
    await authService.recordSuccessfulLogin(userId, email, ipAddress, clientLocation);

    const company = await CompanyMasterModels.findOne({ isSuperAdmin: false });

    const dataToSend = user.toObject ? user.toObject() : user;

    if (employee && role === "EMPLOYEE") {
      dataToSend.companyName = company ? company.companyName : "";
    }

    // Store user data in express session (in-memory)
    req.session.user = {
      id: userId.toString(),
      role: role,
      email: user.email || user.emailOffice,
      name: user.companyName || user.employeeName,
    };

    return res.status(200).json({
      isOk: true,
      message: "Login successful",
      data: dataToSend,
      role: role,
    });
  } catch (error) {
    console.error("Error in loginCompany:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

/**
 * Get current user details using session ID
 * No ID parameter needed - uses req.user.id from session middleware
 */
export const getCurrentUserDetails = async (req, res) => {
  try {
    // Get user ID from session (set by authMiddleware)
    const userId = req.user.id;

    let user = null;
    let role = null;

    const companyMaster = await CompanyMasterModels.findById(userId)
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .exec();

    const employee = await EmployeeModels.findById(userId)
      .populate("departmentId")
      .populate("countryId")
      .populate("stateId")
      .populate("cityId")
      .exec();

    if (!companyMaster && !employee) {
      return res.status(404).json({
        isOk: false,
        message: "Company or Employee not found",
        status: 404,
      });
    }

    if (!companyMaster) {
      user = employee;
      role = "EMPLOYEE";
    }

    if (!employee) {
      user = companyMaster;
      role = "ADMIN";
    }

    const company = await CompanyMasterModels.findOne({
      isSuperAdmin: false,
    });

    if (employee) {
      user.companyName = company ? company.companyName : "";
    }

    return res.status(200).json({
      isOk: true,
      data: user,
      role: role,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};
