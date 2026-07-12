import MaintenanceLog from "../../models/MaintenanceLog.js";
import Vehicle from "../../models/Vehicle.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Helper function to safely delete files
const deleteFileSafe = (filePath) => {
  if (!filePath) return;
  try {
    const absolutePath = path.join(filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`[FILE] Deleted file: ${absolutePath}`);
    }
  } catch (err) {
    console.error(`[FILE] Error deleting file ${filePath}:`, err.message);
  }
};

export const createMaintenanceLog = async (req, res) => {
  try {
    const {
      vehicle_id,
      issue_type,
      description,
      cost,
      status,
      opened_at,
      closed_at,
      isActive,
    } = req.body;

    console.log("Received createMaintenanceLog data:", req.body);

    // Validate vehicle exists
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(404).json({
        isOk: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.status === "On Trip") {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(409).json({
        isOk: false,
        message: "Cannot create maintenance log for a vehicle currently On Trip",
      });
    }

    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : "";

    // Create Maintenance Log
    const maintenanceLog = await MaintenanceLog.create({
      vehicle_id,
      issue_type,
      description,
      cost: cost !== undefined ? Number(cost) : 0,
      status: status || "In Shop",
      opened_at: opened_at || new Date(),
      closed_at: status === "Completed" ? (closed_at || new Date()) : undefined,
      image: imagePath,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    // If maintenance log is active, automatically change vehicle status to "In Shop"
    if (maintenanceLog.status === "In Shop") {
      vehicle.status = "In Shop";
      await vehicle.save();
    }

    res.status(201).json({
      isOk: true,
      message: "Maintenance log created successfully",
      data: maintenanceLog,
    });
  } catch (error) {
    console.error("Error in createMaintenanceLog:", error);
    if (req.file) deleteFileSafe(req.file.path);
    res.status(500).json({
      isOk: false,
      message: "Error creating maintenance log",
      error: error.message,
    });
  }
};

export const getAllMaintenanceLogs = async (req, res) => {
  try {
    const logs = await MaintenanceLog.find({ isActive: true }).populate("vehicle_id");
    res.status(200).json({
      isOk: true,
      message: "Maintenance logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    console.error("Error in getAllMaintenanceLogs:", error);
    res.status(500).json({
      isOk: false,
      message: "Error fetching maintenance logs",
      error: error.message,
    });
  }
};

export const getMaintenanceLogById = async (req, res) => {
  try {
    const { maintenanceLogId } = req.params;
    const log = await MaintenanceLog.findById(maintenanceLogId).populate("vehicle_id");
    if (!log) {
      return res.status(404).json({
        isOk: false,
        message: "Maintenance log not found",
      });
    }
    res.status(200).json({
      isOk: true,
      message: "Maintenance log fetched successfully",
      data: log,
    });
  } catch (error) {
    console.error("Error in getMaintenanceLogById:", error);
    res.status(500).json({
      isOk: false,
      message: "Error fetching maintenance log",
      error: error.message,
    });
  }
};

export const updateMaintenanceLog = async (req, res) => {
  try {
    const { maintenanceLogId } = req.params;
    const {
      vehicle_id,
      issue_type,
      description,
      cost,
      status,
      opened_at,
      closed_at,
      isActive,
      removeImage,
    } = req.body;

    console.log("Received updateMaintenanceLog data:", req.body);

    const log = await MaintenanceLog.findById(maintenanceLogId);
    if (!log) {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(404).json({
        isOk: false,
        message: "Maintenance log not found",
      });
    }

    // Validate new vehicle exists if changing
    const targetVehicleId = vehicle_id || log.vehicle_id;
    const vehicle = await Vehicle.findById(targetVehicleId);
    if (!vehicle) {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(404).json({
        isOk: false,
        message: "Associated vehicle not found",
      });
    }

    // Handle image upload/removal
    let imagePath = log.image;
    if (req.file) {
      if (log.image) {
        deleteFileSafe(log.image);
      }
      imagePath = req.file.path.replace(/\\/g, "/");
    } else if (removeImage === "true" || removeImage === true) {
      if (log.image) {
        deleteFileSafe(log.image);
      }
      imagePath = "";
    }

    // Determine status changes
    const previousStatus = log.status;
    const newStatus = status || log.status;
    const previousVehicleId = log.vehicle_id.toString();
    const newVehicleId = targetVehicleId.toString();

    // Check status/vehicle transitions
    if (previousVehicleId !== newVehicleId) {
      // Vehicle has changed. 
      // 1. If previous log was In Shop, restore previous vehicle to Available (unless retired)
      if (previousStatus === "In Shop") {
        const prevVehicle = await Vehicle.findById(previousVehicleId);
        if (prevVehicle && prevVehicle.status !== "Retired") {
          prevVehicle.status = "Available";
          await prevVehicle.save();
        }
      }
      // 2. If new log status is In Shop, set new vehicle to In Shop
      if (newStatus === "In Shop") {
        vehicle.status = "In Shop";
        await vehicle.save();
      }
    } else {
      // Vehicle is the same, check status change
      if (previousStatus === "In Shop" && newStatus === "Completed") {
        // Closing maintenance restores the vehicle to Available (unless retired)
        if (vehicle.status !== "Retired") {
          vehicle.status = "Available";
          await vehicle.save();
        }
      } else if (previousStatus === "Completed" && newStatus === "In Shop") {
        // Reopening maintenance switches vehicle status to In Shop
        vehicle.status = "In Shop";
        await vehicle.save();
      }
    }

    // Update maintenance log fields
    log.vehicle_id = targetVehicleId;
    log.issue_type = issue_type || log.issue_type;
    log.description = description !== undefined ? description : log.description;
    log.cost = cost !== undefined ? Number(cost) : log.cost;
    log.status = newStatus;
    log.opened_at = opened_at || log.opened_at;
    
    if (newStatus === "Completed") {
      log.closed_at = closed_at || log.closed_at || new Date();
    } else {
      log.closed_at = undefined; // unset closed_at if reopened
    }

    log.image = imagePath;
    log.isActive = isActive !== undefined ? (isActive === "true" || isActive === true) : log.isActive;

    await log.save();

    res.status(200).json({
      isOk: true,
      message: "Maintenance log updated successfully",
      data: log,
    });
  } catch (error) {
    console.error("Error in updateMaintenanceLog:", error);
    if (req.file) deleteFileSafe(req.file.path);
    res.status(500).json({
      isOk: false,
      message: "Error updating maintenance log",
      error: error.message,
    });
  }
};

export const deleteMaintenanceLog = async (req, res) => {
  try {
    const { maintenanceLogId } = req.params;
    const log = await MaintenanceLog.findById(maintenanceLogId);
    if (!log) {
      return res.status(404).json({
        isOk: false,
        message: "Maintenance log not found",
      });
    }

    // Delete image file if exists
    if (log.image) {
      deleteFileSafe(log.image);
    }

    // If log was Active, restore vehicle to Available (unless retired)
    if (log.status === "Active") {
      const vehicle = await Vehicle.findById(log.vehicle_id);
      if (vehicle && vehicle.status !== "Retired") {
        vehicle.status = "Available";
        await vehicle.save();
      }
    }

    await MaintenanceLog.findByIdAndDelete(maintenanceLogId);

    res.status(200).json({
      isOk: true,
      message: "Maintenance log deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteMaintenanceLog:", error);
    res.status(500).json({
      isOk: false,
      message: "Error deleting maintenance log",
      error: error.message,
    });
  }
};

export const listMaintenanceLogsByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive } = req.body;

    let matchCondition = {};
    if (isActive !== undefined && isActive !== null && isActive !== "") {
      matchCondition.isActive = isActive === "true" || isActive === true;
    }

    let query = [
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle_id",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      {
        $unwind: {
          path: "$vehicle",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          vehicle_id: 1,
          vehicle_registration_number: "$vehicle.registration_number",
          vehicle_name_model: "$vehicle.name_model",
          issue_type: 1,
          description: 1,
          cost: 1,
          status: 1,
          opened_at: 1,
          closed_at: 1,
          image: 1,
          isActive: 1,
          createdAt: 1,
        },
      },
      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          stage2: [{ $skip: skip || 0 }, { $limit: per_page || 10 }],
        },
      },
      {
        $unwind: {
          path: "$stage1",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          count: { $ifNull: ["$stage1.count", 0] },
          data: "$stage2",
        },
      },
    ];

    if (match) {
      query = [
        {
          $match: {
            $or: [
              {
                vehicle_registration_number: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                vehicle_name_model: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                issue_type: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                description: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                status: {
                  $regex: match,
                  $options: "i",
                },
              },
            ],
          },
        },
      ].concat(query);
    }

    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir === "desc" ? -1 : 1;
      query = [{ $sort: sort }].concat(query);
    } else {
      query = [{ $sort: { createdAt: -1 } }].concat(query);
    }

    const list = await MaintenanceLog.aggregate(query);

    return res.status(200).json({
      isOk: true,
      data: list,
      status: 200,
    });
  } catch (error) {
    console.error("Error in listMaintenanceLogsByParams:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};
