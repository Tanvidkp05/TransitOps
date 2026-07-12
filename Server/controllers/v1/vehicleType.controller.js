import VehicleType from "../../models/VehicleType.js";
import Vehicle from "../../models/Vehicle.js";

export const createVehicleType = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Vehicle type name is required",
        isOk: false,
        status: 400,
      });
    }

    const existingType = await VehicleType.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingType) {
      return res.status(400).json({
        message: "Vehicle type already exists",
        isOk: false,
        status: 400,
      });
    }

    const vehicleType = new VehicleType({
      name: name.trim(),
      isActive: isActive !== undefined ? isActive : true,
    });

    await vehicleType.save();

    return res.status(201).json({
      message: "Vehicle type created successfully",
      isOk: true,
      status: 201,
      data: vehicleType,
    });
  } catch (error) {
    console.error("Error in createVehicleType", error);
    return res.status(500).json({
      message: "Internal server error",
      isOk: false,
      status: 500,
    });
  }
};

export const updateVehicleType = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const { vehicleTypeId } = req.params;

    const vehicleType = await VehicleType.findById(vehicleTypeId);

    if (!vehicleType) {
      return res.status(404).json({
        message: "Vehicle type not found",
        isOk: false,
        status: 404,
      });
    }

    if (name && name.trim().toLowerCase() !== vehicleType.name.toLowerCase()) {
      const existingType = await VehicleType.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      if (existingType) {
        return res.status(400).json({
          message: "Vehicle type already exists",
          isOk: false,
          status: 400,
        });
      }
    }

    const oldName = vehicleType.name;

    if (name !== undefined) vehicleType.name = name.trim();
    if (isActive !== undefined) vehicleType.isActive = isActive;

    await vehicleType.save();

    // If the name changed, optionally we could update referencing vehicles,
    // but typically we keep them as is or update them.
    if (name && name.trim() !== oldName) {
      await Vehicle.updateMany({ type: oldName }, { type: name.trim() });
    }

    return res.status(200).json({
      message: "Vehicle type updated successfully",
      isOk: true,
      status: 200,
      data: vehicleType,
    });
  } catch (error) {
    console.error("Error in updateVehicleType", error);
    return res.status(500).json({
      message: "Internal server error",
      isOk: false,
      status: 500,
    });
  }
};

export const deleteVehicleType = async (req, res) => {
  try {
    const { vehicleTypeId } = req.params;

    const vehicleType = await VehicleType.findById(vehicleTypeId);

    if (!vehicleType) {
      return res.status(404).json({
        message: "Vehicle type not found",
        isOk: false,
        status: 404,
      });
    }

    // Check if vehicles are using this vehicle type name
    const count = await Vehicle.countDocuments({ type: vehicleType.name });

    if (count > 0) {
      return res.status(409).json({
        message: "Cannot delete vehicle type. It is being used by other records.",
        isOk: false,
        status: 409,
        totalReferences: count,
        references: [{ model: "Vehicle", path: "type", count }],
        formattedMessage: `This record is referenced by: ${count} record(s) in Vehicle (field: type)`,
      });
    }

    await VehicleType.findByIdAndDelete(vehicleTypeId);

    return res.status(200).json({
      message: "Vehicle type deleted successfully",
      isOk: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error in deleteVehicleType", error);
    return res.status(500).json({
      message: "Internal server error",
      isOk: false,
      status: 500,
      error: error.message,
    });
  }
};

export const getVehicleTypeById = async (req, res) => {
  try {
    const { vehicleTypeId } = req.params;

    const vehicleType = await VehicleType.findById(vehicleTypeId);

    if (!vehicleType) {
      return res.status(404).json({
        message: "Vehicle type not found",
        isOk: false,
        status: 404,
      });
    }

    return res.status(200).json({
      message: "Vehicle type found",
      data: vehicleType,
      isOk: true,
      status: 200,
    });
  } catch (error) {
    console.error("Error in getVehicleTypeById", error);
    return res.status(500).json({
      message: "Internal server error",
      isOk: false,
      status: 500,
    });
  }
};

export const listVehicleTypes = async (req, res) => {
  try {
    const vehicleTypes = await VehicleType.find({ isActive: true }).sort({ name: 1 });

    return res.status(200).json({
      isOk: true,
      data: vehicleTypes,
      status: 200,
    });
  } catch (error) {
    console.error("Error in listVehicleTypes:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

export const listVehicleTypeByParams = async (req, res) => {
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
            name: {
              $regex: match,
              $options: "i",
            },
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

    const list = await VehicleType.aggregate(query);

    return res.status(200).json({
      isOk: true,
      data: list,
      status: 200,
    });
  } catch (error) {
    console.error("Error in listVehicleTypeByParams:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};
