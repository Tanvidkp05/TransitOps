import Expense from "../../models/Expense.js";
import Vehicle from "../../models/Vehicle.js";
import MaintenanceLog from "../../models/MaintenanceLog.js";
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

export const createExpense = async (req, res) => {
  try {
    const {
      vehicle_id,
      expense_type,
      amount,
      date,
      fuel_liters,
      odometer_reading,
      description,
      isActive,
    } = req.body;

    console.log("Received createExpense data:", req.body);

    // Validate vehicle exists
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(404).json({
        isOk: false,
        message: "Vehicle not found",
      });
    }

    const receiptImagePath = req.file ? req.file.path.replace(/\\/g, "/") : "";

    // Create Expense Log
    const expense = await Expense.create({
      vehicle_id,
      expense_type,
      amount: Number(amount),
      date: date || new Date(),
      fuel_liters: expense_type === "Fuel" && fuel_liters !== undefined ? Number(fuel_liters) : undefined,
      odometer_reading: expense_type === "Fuel" && odometer_reading !== undefined ? Number(odometer_reading) : undefined,
      description,
      receipt_image: receiptImagePath,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    res.status(201).json({
      isOk: true,
      message: "Expense log created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error in createExpense:", error);
    if (req.file) deleteFileSafe(req.file.path);
    res.status(500).json({
      isOk: false,
      message: "Error creating expense log",
      error: error.message,
    });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ isActive: true }).populate("vehicle_id");
    res.status(200).json({
      isOk: true,
      message: "Expense logs fetched successfully",
      data: expenses,
    });
  } catch (error) {
    console.error("Error in getAllExpenses:", error);
    res.status(500).json({
      isOk: false,
      message: "Error fetching expense logs",
      error: error.message,
    });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId).populate("vehicle_id");
    if (!expense) {
      return res.status(404).json({
        isOk: false,
        message: "Expense log not found",
      });
    }
    res.status(200).json({
      isOk: true,
      message: "Expense log fetched successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error in getExpenseById:", error);
    res.status(500).json({
      isOk: false,
      message: "Error fetching expense log",
      error: error.message,
    });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const {
      vehicle_id,
      expense_type,
      amount,
      date,
      fuel_liters,
      odometer_reading,
      description,
      isActive,
      removeImage,
    } = req.body;

    console.log("Received updateExpense data:", req.body);

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(404).json({
        isOk: false,
        message: "Expense log not found",
      });
    }

    // Validate new vehicle exists if changing
    const targetVehicleId = vehicle_id || expense.vehicle_id;
    const vehicle = await Vehicle.findById(targetVehicleId);
    if (!vehicle) {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(404).json({
        isOk: false,
        message: "Associated vehicle not found",
      });
    }

    // Handle receipt image upload/removal
    let receiptImagePath = expense.receipt_image;
    if (req.file) {
      if (expense.receipt_image) {
        deleteFileSafe(expense.receipt_image);
      }
      receiptImagePath = req.file.path.replace(/\\/g, "/");
    } else if (removeImage === "true" || removeImage === true) {
      if (expense.receipt_image) {
        deleteFileSafe(expense.receipt_image);
      }
      receiptImagePath = "";
    }

    // Update expense fields
    expense.vehicle_id = targetVehicleId;
    expense.expense_type = expense_type || expense.expense_type;
    expense.amount = amount !== undefined ? Number(amount) : expense.amount;
    expense.date = date || expense.date;

    const newType = expense_type || expense.expense_type;
    if (newType === "Fuel") {
      expense.fuel_liters = fuel_liters !== undefined ? Number(fuel_liters) : expense.fuel_liters;
      expense.odometer_reading = odometer_reading !== undefined ? Number(odometer_reading) : expense.odometer_reading;
    } else {
      expense.fuel_liters = undefined;
      expense.odometer_reading = undefined;
    }

    expense.description = description !== undefined ? description : expense.description;
    expense.receipt_image = receiptImagePath;
    expense.isActive = isActive !== undefined ? (isActive === "true" || isActive === true) : expense.isActive;

    await expense.save();

    res.status(200).json({
      isOk: true,
      message: "Expense log updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error in updateExpense:", error);
    if (req.file) deleteFileSafe(req.file.path);
    res.status(500).json({
      isOk: false,
      message: "Error updating expense log",
      error: error.message,
    });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        isOk: false,
        message: "Expense log not found",
      });
    }

    // Delete image file if exists
    if (expense.receipt_image) {
      deleteFileSafe(expense.receipt_image);
    }

    await Expense.findByIdAndDelete(expenseId);

    res.status(200).json({
      isOk: true,
      message: "Expense log deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteExpense:", error);
    res.status(500).json({
      isOk: false,
      message: "Error deleting expense log",
      error: error.message,
    });
  }
};

export const listExpensesByParams = async (req, res) => {
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
          expense_type: 1,
          amount: 1,
          date: 1,
          fuel_liters: 1,
          odometer_reading: 1,
          description: 1,
          receipt_image: 1,
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
                expense_type: {
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

    const list = await Expense.aggregate(query);

    return res.status(200).json({
      isOk: true,
      data: list,
      status: 200,
    });
  } catch (error) {
    console.error("Error in listExpensesByParams:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};

export const getVehicleOperationalCosts = async (req, res) => {
  try {
    const list = await Vehicle.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "vehicle_id",
          as: "expenses",
        },
      },
      {
        $lookup: {
          from: "maintenancelogs",
          localField: "_id",
          foreignField: "vehicle_id",
          as: "maintenance_logs",
        },
      },
      {
        $project: {
          registration_number: 1,
          name_model: 1,
          status: 1,
          // Sum up fuel type expenses
          fuel_cost: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$expenses",
                    as: "exp",
                    cond: {
                      $and: [
                        { $eq: ["$$exp.expense_type", "Fuel"] },
                        { $eq: ["$$exp.isActive", true] }
                      ]
                    },
                  },
                },
                as: "item",
                in: "$$item.amount",
              },
            },
          },
          // Sum up other type expenses (Tolls, Permits, Insurance, etc.)
          other_cost: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$expenses",
                    as: "exp",
                    cond: {
                      $and: [
                        { $ne: ["$$exp.expense_type", "Fuel"] },
                        { $eq: ["$$exp.isActive", true] }
                      ]
                    },
                  },
                },
                as: "item",
                in: "$$item.amount",
              },
            },
          },
          // Sum up maintenance costs
          maintenance_cost: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$maintenance_logs",
                    as: "m",
                    cond: { $eq: ["$$m.isActive", true] }
                  }
                },
                as: "item",
                in: "$$item.cost"
              }
            },
          },
        },
      },
      {
        $project: {
          registration_number: 1,
          name_model: 1,
          status: 1,
          fuel_cost: 1,
          maintenance_cost: 1,
          other_cost: 1,
          total_operational_cost: {
            $add: ["$fuel_cost", "$maintenance_cost", "$other_cost"],
          },
        },
      },
      {
        $sort: { total_operational_cost: -1 },
      }
    ]);

    res.status(200).json({
      isOk: true,
      message: "Vehicle operational costs fetched successfully",
      data: list,
    });
  } catch (error) {
    console.error("Error in getVehicleOperationalCosts:", error);
    res.status(500).json({
      isOk: false,
      message: "Error fetching vehicle operational costs",
      error: error.message,
    });
  }
};

export const getLatestFuelByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const latestFuel = await Expense.findOne({
      vehicle_id: vehicleId,
      expense_type: "Fuel",
      isActive: true,
    }).sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      isOk: true,
      message: "Latest fuel log fetched successfully",
      data: latestFuel,
    });
  } catch (error) {
    console.error("Error in getLatestFuelByVehicle:", error);
    res.status(500).json({
      isOk: false,
      message: "Error fetching latest fuel log",
      error: error.message,
    });
  }
};
