import fs from "fs";
import path from "path";
import Driver from "../../models/Driver.js";

const DRIVER_SELECT = {
  name: 1,
  licenseNumber: 1,
  licenseCategory: 1,
  licenseExpiryDate: 1,
  contactNumber: 1,
  safetyScore: 1,
  status: 1,
  createdAt: 1,
  updatedAt: 1,
};

const DRIVER_RESPONSE_FIELDS = [
  "name",
  "licenseNumber",
  "licenseCategory",
  "licenseExpiryDate",
  "contactNumber",
  "safetyScore",
  "status",
];

const buildDriverPayload = (driver) => {
  if (!driver) return null;

  return DRIVER_RESPONSE_FIELDS.reduce((acc, field) => {
    acc[field] = driver[field];
    return acc;
  }, { _id: driver._id });
};

const removeFileIfExists = (filePath) => {
  if (!filePath) return;

  try {
    const resolvedPath = path.resolve(filePath);
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
  } catch (error) {
    console.warn("Failed to delete file:", filePath, error.message);
  }
};

const cleanupRequestFiles = (req) => {
  if (req.file?.path) {
    removeFileIfExists(req.file.path);
  }

  if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach((fileList) => {
      if (Array.isArray(fileList)) {
        fileList.forEach((file) => removeFileIfExists(file?.path));
      }
    });
  }
};

const findDuplicateLicense = async (licenseNumber, excludeId = null) => {
  if (!licenseNumber) return null;

  const query = { licenseNumber: licenseNumber.trim() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Driver.findOne(query).lean();
};

export const createDriver = async (req, res) => {
  try {
    const {
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
      status,
    } = req.body;

    const duplicate = await findDuplicateLicense(licenseNumber);
    if (duplicate) {
      return res.status(409).json({
        isOk: false,
        status: 409,
        message: "Driver with this license number already exists",
      });
    }

    const driver = await Driver.create({
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
      status,
    });

    return res.status(201).json({
      isOk: true,
      status: 201,
      message: "Driver created successfully",
      data: buildDriverPayload(driver),
    });
  } catch (error) {
    console.error("Error in createDriver:", error);
    cleanupRequestFiles(req);
    return res.status(500).json({
      isOk: false,
      status: 500,
      message: error.message,
    });
  }
};

export const getAllDrivers = async (_req, res) => {
  try {
    const drivers = await Driver.find({}, DRIVER_SELECT).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      isOk: true,
      status: 200,
      message: "Drivers fetched successfully",
      data: drivers.map((driver) => buildDriverPayload(driver)),
    });
  } catch (error) {
    console.error("Error in getAllDrivers:", error);
    return res.status(500).json({
      isOk: false,
      status: 500,
      message: error.message,
    });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await Driver.findById(driverId, DRIVER_SELECT).lean();

    if (!driver) {
      return res.status(404).json({
        isOk: false,
        status: 404,
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      isOk: true,
      status: 200,
      message: "Driver fetched successfully",
      data: buildDriverPayload(driver),
    });
  } catch (error) {
    console.error("Error in getDriverById:", error);
    return res.status(500).json({
      isOk: false,
      status: 500,
      message: error.message,
    });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        isOk: false,
        status: 404,
        message: "Driver not found",
      });
    }

    const updatableFields = [
      "name",
      "licenseNumber",
      "licenseCategory",
      "licenseExpiryDate",
      "contactNumber",
      "safetyScore",
      "status",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        driver[field] = req.body[field];
      }
    });

    if (req.body.licenseNumber !== undefined) {
      const duplicate = await findDuplicateLicense(req.body.licenseNumber, driverId);
      if (duplicate) {
        return res.status(409).json({
          isOk: false,
          status: 409,
          message: "Driver with this license number already exists",
        });
      }
    }

    await driver.save();

    return res.status(200).json({
      isOk: true,
      status: 200,
      message: "Driver updated successfully",
      data: buildDriverPayload(driver.toObject()),
    });
  } catch (error) {
    console.error("Error in updateDriver:", error);
    cleanupRequestFiles(req);
    return res.status(500).json({
      isOk: false,
      status: 500,
      message: error.message,
    });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        isOk: false,
        status: 404,
        message: "Driver not found",
      });
    }

    await Driver.findByIdAndDelete(driverId);

    return res.status(200).json({
      isOk: true,
      status: 200,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteDriver:", error);
    cleanupRequestFiles(req);
    return res.status(500).json({
      isOk: false,
      status: 500,
      message: error.message,
    });
  }
};

export const listDriversByParams = async (req, res) => {
  try {
    let { skip = 0, per_page = 100, sorton, sortdir, match, status } = req.body;

    skip = Number(skip) || 0;
    per_page = Number(per_page) || 100;

    const matchCondition = {};
    if (status) {
      matchCondition.status = status;
    }

    let query = [
      { $match: matchCondition },
    ];

    if (match) {
      query.push({
        $match: {
          $or: [
            { name: { $regex: match, $options: "i" } },
            { licenseNumber: { $regex: match, $options: "i" } },
            { licenseCategory: { $regex: match, $options: "i" } },
            { contactNumber: { $regex: match, $options: "i" } },
            { status: { $regex: match, $options: "i" } },
          ],
        },
      });
    }

    if (sorton && sortdir) {
      const sort = {};
      sort[sorton] = sortdir === "desc" ? -1 : 1;
      query.push({ $sort: sort });
    } else {
      query.push({ $sort: { createdAt: -1 } });
    }

    query.push({
      $facet: {
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [{ $skip: skip }, { $limit: per_page }],
      },
    });

    query.push({ $unwind: "$stage1" });
    query.push({
      $project: {
        count: "$stage1.count",
        data: "$stage2",
      },
    });

    const list = await Driver.aggregate(query);

    return res.status(200).json({
      isOk: true,
      status: 200,
      data: list,
    });
  } catch (error) {
    console.error("Error in listDriversByParams:", error);
    cleanupRequestFiles(req);
    return res.status(500).json({
      isOk: false,
      status: 500,
      message: error.message,
    });
  }
};
