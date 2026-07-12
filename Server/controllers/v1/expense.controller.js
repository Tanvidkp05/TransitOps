import Expense from "../../models/Expense.js";
import Vehicle from "../../models/Vehicle.js";
import MaintenanceLog from "../../models/MaintenanceLog.js";
import fs from "fs";
import path from "path";

// Helper function to safely delete files
const deleteFileSafe = (filePath) => {
  if (!filePath) return;
  try {
    const absolutePath = path.resolve(filePath);
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

    const receiptPath = req.file ? req.file.path.replace(/\\/g, "/") : "";

    const expense = await Expense.create({
      vehicle_id,
      expense_type,
      amount: Number(amount),
      date: new Date(date),
      fuel_liters: fuel_liters ? Number(fuel_liters) : null,
      odometer_reading: odometer_reading ? Number(odometer_reading) : null,
      description: description || "",
      receipt_image: receiptPath,
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    // If it's a fuel log with odometer reading, let's also update the vehicle's odometer!
    if (expense_type === "Fuel" && odometer_reading) {
      const vehicle = await Vehicle.findById(vehicle_id);
      if (vehicle && Number(odometer_reading) > vehicle.odometer) {
        vehicle.odometer = Number(odometer_reading);
        await vehicle.save();
      }
    }

    res.status(201).json({
      isOk: true,
      status: 201,
      message: "Expense logged successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error in createExpense:", error);
    if (req.file) deleteFileSafe(req.file.path);
    res.status(500).json({
      isOk: false,
      status: 500,
      message: "Error creating expense log",
      error: error.message,
    });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate("vehicle_id", "registration_number name_model").sort({ date: -1 }).lean();
    res.status(200).json({
      isOk: true,
      status: 200,
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    console.error("Error in getAllExpenses:", error);
    res.status(500).json({
      isOk: false,
      status: 500,
      message: "Error fetching expenses",
      error: error.message,
    });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId).populate("vehicle_id", "registration_number name_model").lean();
    if (!expense) {
      return res.status(404).json({
        isOk: false,
        status: 404,
        message: "Expense record not found",
      });
    }
    res.status(200).json({
      isOk: true,
      status: 200,
      message: "Expense fetched successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error in getExpenseById:", error);
    res.status(500).json({
      isOk: false,
      status: 500,
      message: "Error fetching expense details",
      error: error.message,
    });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      if (req.file) deleteFileSafe(req.file.path);
      return res.status(404).json({
        isOk: false,
        status: 404,
        message: "Expense record not found",
      });
    }

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

    if (vehicle_id !== undefined) expense.vehicle_id = vehicle_id;
    if (expense_type !== undefined) expense.expense_type = expense_type;
    if (amount !== undefined) expense.amount = Number(amount);
    if (date !== undefined) expense.date = new Date(date);
    if (fuel_liters !== undefined) expense.fuel_liters = fuel_liters ? Number(fuel_liters) : null;
    if (odometer_reading !== undefined) expense.odometer_reading = odometer_reading ? Number(odometer_reading) : null;
    if (description !== undefined) expense.description = description;
    if (isActive !== undefined) expense.isActive = isActive === "true" || isActive === true;

    // Handle receipt image removal
    if (removeImage === "true" || removeImage === true) {
      if (expense.receipt_image) {
        deleteFileSafe(expense.receipt_image);
        expense.receipt_image = "";
      }
    }

    // Handle new receipt image upload
    if (req.file) {
      if (expense.receipt_image) {
        deleteFileSafe(expense.receipt_image);
      }
      expense.receipt_image = req.file.path.replace(/\\/g, "/");
    }

    await expense.save();

    // Update vehicle's odometer if odometer_reading is increased in a fuel log
    if (expense.expense_type === "Fuel" && expense.odometer_reading) {
      const vehicle = await Vehicle.findById(expense.vehicle_id);
      if (vehicle && Number(expense.odometer_reading) > vehicle.odometer) {
        vehicle.odometer = Number(expense.odometer_reading);
        await vehicle.save();
      }
    }

    res.status(200).json({
      isOk: true,
      status: 200,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error in updateExpense:", error);
    if (req.file) deleteFileSafe(req.file.path);
    res.status(500).json({
      isOk: false,
      status: 500,
      message: "Error updating expense",
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
        status: 404,
        message: "Expense record not found",
      });
    }

    if (expense.receipt_image) {
      deleteFileSafe(expense.receipt_image);
    }

    await Expense.findByIdAndDelete(expenseId);
    res.status(200).json({
      isOk: true,
      status: 200,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteExpense:", error);
    res.status(500).json({
      isOk: false,
      status: 500,
      message: "Error deleting expense",
      error: error.message,
    });
  }
};

export const listExpensesByParams = async (req, res) => {
  try {
    let { skip = 0, per_page = 100, sorton, sortdir, match, isActive } = req.body;

    skip = Number(skip) || 0;
    per_page = Number(per_page) || 100;

    const matchCondition = {};
    if (isActive !== undefined && isActive !== null && isActive !== "") {
      matchCondition.isActive = isActive === "true" || isActive === true;
    }

    // Build the query pipeline
    let pipeline = [
      { $match: matchCondition },
      // Lookup vehicle information to populate details and do regex matches
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle_id",
          foreignField: "_id",
          as: "vehicle_details",
        },
      },
      {
        $unwind: {
          path: "$vehicle_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Map registration number into root so we can sort and match easily
      {
        $addFields: {
          vehicle_registration_number: "$vehicle_details.registration_number",
        },
      },
    ];

    if (match) {
      pipeline.push({
        $match: {
          $or: [
            { expense_type: { $regex: match, $options: "i" } },
            { vehicle_registration_number: { $regex: match, $options: "i" } },
            { description: { $regex: match, $options: "i" } },
          ],
        },
      });
    }

    // Sorting
    if (sorton && sortdir) {
      const sort = {};
      sort[sorton] = sortdir === "desc" ? -1 : 1;
      pipeline.push({ $sort: sort });
    } else {
      pipeline.push({ $sort: { date: -1 } });
    }

    pipeline.push({
      $facet: {
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [{ $skip: skip }, { $limit: per_page }],
      },
    });

    pipeline.push({ $unwind: "$stage1" });
    pipeline.push({
      $project: {
        count: "$stage1.count",
        data: "$stage2",
      },
    });

    const result = await Expense.aggregate(pipeline);

    res.status(200).json({
      isOk: true,
      status: 200,
      data: result,
    });
  } catch (error) {
    console.error("Error in listExpensesByParams:", error);
    res.status(500).json({
      isOk: false,
      status: 500,
      message: "Error fetching expense list",
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
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      isOk: true,
      status: 200,
      data: latestFuel,
    });
  } catch (error) {
    console.error("Error in getLatestFuelByVehicle:", error);
    res.status(500).json({
      isOk: false,
      status: 500,
      message: "Error fetching latest fuel details",
      error: error.message,
    });
  }
};

export const getVehicleCosts = async (req, res) => {
  try {
    // 1. Get all vehicles
    const vehicles = await Vehicle.find().lean();
    const result = [];

    for (const vehicle of vehicles) {
      // 2. Aggregate Fuel Costs (expense_type = "Fuel")
      const fuelCostAgg = await Expense.aggregate([
        { $match: { vehicle_id: vehicle._id, expense_type: "Fuel", isActive: true } },
        { 
          $group: { 
            _id: null, 
            total: { $sum: "$amount" },
            liters: { $sum: "$fuel_liters" }
          } 
        }
      ]);
      const fuel_cost = fuelCostAgg[0]?.total || 0;
      const fuel_liters = fuelCostAgg[0]?.liters || 0;

      // 3. Aggregate Other Costs (expense_type IN ["Toll", "Insurance", "Permit", "Other"])
      const otherCostAgg = await Expense.aggregate([
        { 
          $match: { 
            vehicle_id: vehicle._id, 
            expense_type: { $in: ["Toll", "Insurance", "Permit", "Other"] }, 
            isActive: true 
          } 
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      const other_cost = otherCostAgg[0]?.total || 0;

      // 4. Aggregate Maintenance Costs (Completed MaintenanceLogs)
      const maintenanceCostAgg = await MaintenanceLog.aggregate([
        { $match: { vehicle_id: vehicle._id, status: "Completed" } },
        { $group: { _id: null, total: { $sum: "$cost" } } }
      ]);
      const maintenance_cost = maintenanceCostAgg[0]?.total || 0;

      const total_operational_cost = fuel_cost + other_cost + maintenance_cost;

      result.push({
        _id: vehicle._id,
        registration_number: vehicle.registration_number,
        name_model: vehicle.name_model,
        status: vehicle.status,
        fuel_cost,
        fuel_liters,
        maintenance_cost,
        other_cost,
        total_operational_cost,
      });
    }

    res.status(200).json({
      isOk: true,
      status: 200,
      data: result,
    });
  } catch (error) {
    console.error("Error in getVehicleCosts:", error);
    res.status(500).json({
      isOk: false,
      status: 500,
      message: "Error calculating vehicle costs summary",
      error: error.message,
    });
  }
};
