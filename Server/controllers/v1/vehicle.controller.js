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

export const createVehicle = async (req, res) => {
  try {
    const {
      registration_number,
      name_model,
      type,
      max_load_capacity,
      odometer,
      acquisition_cost,
      status,
      region,
      isActive,
    } = req.body;

    // Check if registration_number is unique
    const existing = await Vehicle.findOne({ registration_number });
    if (existing) {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(400).json({
        isOk: false,
        message: "Registration number must be unique",
      });
    }

    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : "";

    const vehicle = await Vehicle.create({
      registration_number,
      name_model,
      type,
      max_load_capacity: Number(max_load_capacity),
      odometer: Number(odometer),
      acquisition_cost: Number(acquisition_cost),
      status: status || "Available",
      region,
      image: imagePath,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    res.status(201).json({
      isOk: true,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Error in createVehicle:", error);
    if (req.file) deleteFileSafe(req.file.path);
    res.status(500).json({
      isOk: false,
      message: "Error creating vehicle",
      error: error.message,
    });
  }
};

export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true });
    res.status(200).json({
      isOk: true,
      message: "Vehicles fetched successfully",
      data: vehicles,
    });
  } catch (error) {
    console.error("Error in getAllVehicles:", error);
    res.status(500).json({
      isOk: false,
      message: "Error fetching vehicles",
      error: error.message,
    });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        isOk: false,
        message: "Vehicle not found",
      });
    }
    res.status(200).json({
      isOk: true,
      message: "Vehicle fetched successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Error in getVehicleById:", error);
    res.status(500).json({
      isOk: false,
      message: "Error fetching vehicle",
      error: error.message,
    });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const {
      registration_number,
      name_model,
      type,
      max_load_capacity,
      odometer,
      acquisition_cost,
      status,
      region,
      isActive,
      removeImage,
    } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(404).json({
        isOk: false,
        message: "Vehicle not found",
      });
    }

    // Check unique registration number if changed
    if (registration_number && registration_number !== vehicle.registration_number) {
      const existing = await Vehicle.findOne({ registration_number });
      if (existing) {
        if (req.file) deleteFileSafe(req.file.path);
        return res.status(400).json({
          isOk: false,
          message: "Registration number must be unique",
        });
      }
    }

    let imagePath = vehicle.image;

    if (req.file) {
      // Delete old image if exists
      if (vehicle.image) {
        deleteFileSafe(vehicle.image);
      }
      imagePath = req.file.path.replace(/\\/g, "/");
    } else if (removeImage === "true" || removeImage === true) {
      if (vehicle.image) {
        deleteFileSafe(vehicle.image);
      }
      imagePath = "";
    }

    vehicle.registration_number = registration_number || vehicle.registration_number;
    vehicle.name_model = name_model || vehicle.name_model;
    vehicle.type = type || vehicle.type;
    vehicle.max_load_capacity = max_load_capacity !== undefined ? Number(max_load_capacity) : vehicle.max_load_capacity;
    vehicle.odometer = odometer !== undefined ? Number(odometer) : vehicle.odometer;
    vehicle.acquisition_cost = acquisition_cost !== undefined ? Number(acquisition_cost) : vehicle.acquisition_cost;
    vehicle.status = status || vehicle.status;
    vehicle.region = region || vehicle.region;
    vehicle.image = imagePath;
    vehicle.isActive = isActive !== undefined ? (isActive === "true" || isActive === true) : vehicle.isActive;

    await vehicle.save();

    res.status(200).json({
      isOk: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("Error in updateVehicle:", error);
    if (req.file) deleteFileSafe(req.file.path);
    res.status(500).json({
      isOk: false,
      message: "Error updating vehicle",
      error: error.message,
    });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        isOk: false,
        message: "Vehicle not found",
      });
    }

    // Delete image if exists
    if (vehicle.image) {
      deleteFileSafe(vehicle.image);
    }

    await Vehicle.findByIdAndDelete(vehicleId);

    res.status(200).json({
      isOk: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteVehicle:", error);
    res.status(500).json({
      isOk: false,
      message: "Error deleting vehicle",
      error: error.message,
    });
  }
};

export const listVehiclesByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive, type, status } = req.body;

    let matchCondition = {};
    if (isActive !== undefined && isActive !== null && isActive !== "") {
      matchCondition.isActive = isActive === "true" || isActive === true;
    }
    if (type && (!Array.isArray(type) || type.length > 0)) {
      matchCondition.type = { $in: Array.isArray(type) ? type : [type] };
    }
    if (status && (!Array.isArray(status) || status.length > 0)) {
      matchCondition.status = { $in: Array.isArray(status) ? status : [status] };
    }

    let query = [
      {
        $match: matchCondition,
      },
      {
        $project: {
          registration_number: 1,
          name_model: 1,
          type: 1,
          max_load_capacity: 1,
          odometer: 1,
          acquisition_cost: 1,
          status: 1,
          region: 1,
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
                registration_number: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                name_model: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                type: {
                  $regex: match,
                  $options: "i",
                },
              },
              {
                region: {
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

    const list = await Vehicle.aggregate(query);

    return res.status(200).json({
      isOk: true,
      data: list,
      status: 200,
    });
  } catch (error) {
    console.error("Error in listVehiclesByParams:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};
