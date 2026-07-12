import Trip from "../../models/Trip.js";
import Vehicle from "../../models/Vehicle.js";
import Driver from "../../models/Driver.js";
import mongoose from "mongoose";

// Create a new Trip (Saves as Draft)
export const createTrip = async (req, res) => {
  try {
    const {
      source,
      destination,
      vehicle_id,
      driver_id,
      cargo_weight,
      planned_distance,
      notes,
    } = req.body;

    // Validate vehicle exists and is active
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({
        isOk: false,
        message: "Vehicle not found or inactive",
      });
    }

    // Validate driver exists and is active
    const driver = await Driver.findById(driver_id);
    if (!driver || !driver.isActive) {
      return res.status(404).json({
        isOk: false,
        message: "Driver not found or inactive",
      });
    }

    // Validate cargo weight
    if (Number(cargo_weight) > vehicle.max_load_capacity) {
      return res.status(422).json({
        isOk: false,
        message: `Cargo weight (${cargo_weight} kg) exceeds vehicle maximum load capacity (${vehicle.max_load_capacity} kg)`,
      });
    }

    // Validate planned distance
    if (Number(planned_distance) <= 0) {
      return res.status(422).json({
        isOk: false,
        message: "Planned distance must be greater than zero",
      });
    }

    // Generate unique trip number: TRP-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await Trip.countDocuments();
    const trip_number = `TRP-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    const trip = await Trip.create({
      trip_number,
      source,
      destination,
      vehicle_id,
      driver_id,
      cargo_weight: Number(cargo_weight),
      planned_distance: Number(planned_distance),
      notes,
      status: "Draft",
    });

    return res.status(201).json({
      isOk: true,
      message: "Trip draft created successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Error in createTrip:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

// Get all trips (unpopulated)
export const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      isOk: true,
      data: trips,
    });
  } catch (error) {
    console.error("Error in getAllTrips:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

// Get single trip by ID (populated)
export const getTripById = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId)
      .populate("vehicle_id")
      .populate("driver_id")
      .lean();

    if (!trip) {
      return res.status(404).json({
        isOk: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      isOk: true,
      data: trip,
    });
  } catch (error) {
    console.error("Error in getTripById:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

// Update Trip (Draft only)
export const updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        isOk: false,
        message: "Trip not found",
      });
    }

    if (trip.status !== "Draft") {
      return res.status(400).json({
        isOk: false,
        message: "Only Draft trips can be updated",
      });
    }

    const {
      source,
      destination,
      vehicle_id,
      driver_id,
      cargo_weight,
      planned_distance,
      notes,
    } = req.body;

    // Validate new vehicle capacity if vehicle_id or cargo_weight changed
    const targetVehicleId = vehicle_id || trip.vehicle_id;
    const targetCargoWeight = cargo_weight !== undefined ? Number(cargo_weight) : trip.cargo_weight;

    const vehicle = await Vehicle.findById(targetVehicleId);
    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({
        isOk: false,
        message: "Vehicle not found or inactive",
      });
    }

    if (targetCargoWeight > vehicle.max_load_capacity) {
      return res.status(422).json({
        isOk: false,
        message: `Cargo weight (${targetCargoWeight} kg) exceeds vehicle maximum load capacity (${vehicle.max_load_capacity} kg)`,
      });
    }

    // Validate driver
    const targetDriverId = driver_id || trip.driver_id;
    const driver = await Driver.findById(targetDriverId);
    if (!driver || !driver.isActive) {
      return res.status(404).json({
        isOk: false,
        message: "Driver not found or inactive",
      });
    }

    // Update fields
    if (source) trip.source = source;
    if (destination) trip.destination = destination;
    if (vehicle_id) trip.vehicle_id = vehicle_id;
    if (driver_id) trip.driver_id = driver_id;
    if (cargo_weight !== undefined) trip.cargo_weight = Number(cargo_weight);
    if (planned_distance !== undefined) trip.planned_distance = Number(planned_distance);
    if (notes !== undefined) trip.notes = notes;

    await trip.save();

    return res.status(200).json({
      isOk: true,
      message: "Trip updated successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Error in updateTrip:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

// Dispatch Trip (Draft -> Dispatched)
export const dispatchTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        isOk: false,
        message: "Trip not found",
      });
    }

    if (trip.status !== "Draft") {
      return res.status(400).json({
        isOk: false,
        message: "Only Draft trips can be dispatched",
      });
    }

    // Validate Vehicle availability
    const vehicle = await Vehicle.findById(trip.vehicle_id);
    if (!vehicle || !vehicle.isActive) {
      return res.status(404).json({
        isOk: false,
        message: "Vehicle not found or inactive",
      });
    }
    if (vehicle.status !== "Available") {
      return res.status(409).json({
        isOk: false,
        message: `Vehicle is not available. Current status: ${vehicle.status}`,
      });
    }

    // Validate Driver availability & License
    const driver = await Driver.findById(trip.driver_id);
    if (!driver || !driver.isActive) {
      return res.status(404).json({
        isOk: false,
        message: "Driver not found or inactive",
      });
    }
    if (driver.status !== "Available") {
      return res.status(409).json({
        isOk: false,
        message: `Driver is not available. Current status: ${driver.status}`,
      });
    }

    // Check license expiration
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      return res.status(422).json({
        isOk: false,
        message: `Driver's license expired on ${new Date(driver.licenseExpiryDate).toLocaleDateString()}. Cannot assign.`,
      });
    }

    // Dispatch transition
    trip.status = "Dispatched";
    trip.dispatched_at = new Date();
    await trip.save();

    // Mark vehicle and driver as On Trip
    vehicle.status = "On Trip";
    await vehicle.save();

    driver.status = "On Trip";
    await driver.save();

    return res.status(200).json({
      isOk: true,
      message: "Trip dispatched successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Error in dispatchTrip:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

// Complete Trip (Dispatched -> Completed)
export const completeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { final_odometer, fuel_consumed } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        isOk: false,
        message: "Trip not found",
      });
    }

    if (trip.status !== "Dispatched") {
      return res.status(400).json({
        isOk: false,
        message: "Only Dispatched trips can be completed",
      });
    }

    const vehicle = await Vehicle.findById(trip.vehicle_id);
    if (!vehicle) {
      return res.status(404).json({
        isOk: false,
        message: "Vehicle associated with this trip not found",
      });
    }

    // Validate odometer reading
    if (Number(final_odometer) <= vehicle.odometer) {
      return res.status(422).json({
        isOk: false,
        message: `Final odometer (${final_odometer}) must be greater than current reading (${vehicle.odometer})`,
      });
    }

    const driver = await Driver.findById(trip.driver_id);

    // Save completion fields
    trip.status = "Completed";
    trip.completed_at = new Date();
    trip.final_odometer = Number(final_odometer);
    if (fuel_consumed !== undefined && fuel_consumed !== "") {
      trip.fuel_consumed = Number(fuel_consumed);
    }
    await trip.save();

    // Update vehicle odometer and status to Available
    vehicle.odometer = Number(final_odometer);
    vehicle.status = "Available";
    await vehicle.save();

    // Update driver status to Available
    if (driver) {
      driver.status = "Available";
      await driver.save();
    }

    return res.status(200).json({
      isOk: true,
      message: "Trip completed successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Error in completeTrip:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

// Cancel Trip (Draft or Dispatched -> Cancelled)
export const cancelTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { cancellation_reason } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        isOk: false,
        message: "Trip not found",
      });
    }

    if (trip.status === "Completed" || trip.status === "Cancelled") {
      return res.status(400).json({
        isOk: false,
        message: `Trip is already ${trip.status} and cannot be cancelled`,
      });
    }

    const originalStatus = trip.status;

    trip.status = "Cancelled";
    trip.cancelled_at = new Date();
    trip.cancellation_reason = cancellation_reason || "";
    await trip.save();

    // If it was Dispatched, release the vehicle and driver back to Available
    if (originalStatus === "Dispatched") {
      const vehicle = await Vehicle.findById(trip.vehicle_id);
      if (vehicle) {
        vehicle.status = "Available";
        await vehicle.save();
      }

      const driver = await Driver.findById(trip.driver_id);
      if (driver) {
        driver.status = "Available";
        await driver.save();
      }
    }

    return res.status(200).json({
      isOk: true,
      message: "Trip cancelled successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Error in cancelTrip:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

// Delete Trip (Draft only)
export const deleteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        isOk: false,
        message: "Trip not found",
      });
    }

    if (trip.status !== "Draft") {
      return res.status(400).json({
        isOk: false,
        message: "Only Draft trips can be deleted",
      });
    }

    await Trip.findByIdAndDelete(tripId);

    return res.status(200).json({
      isOk: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteTrip:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
    });
  }
};

// Paginated search with filters
export const listTripsByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, isActive, status, vehicle_id, driver_id } = req.body;

    let matchCondition = {};
    if (isActive !== undefined && isActive !== null && isActive !== "") {
      matchCondition.isActive = isActive === "true" || isActive === true;
    }
    if (status) {
      matchCondition.status = status;
    }
    if (vehicle_id) {
      matchCondition.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);
    }
    if (driver_id) {
      matchCondition.driver_id = new mongoose.Types.ObjectId(driver_id);
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
        $lookup: {
          from: "drivers",
          localField: "driver_id",
          foreignField: "_id",
          as: "driver",
        },
      },
      {
        $unwind: {
          path: "$driver",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          trip_number: 1,
          source: 1,
          destination: 1,
          cargo_weight: 1,
          planned_distance: 1,
          status: 1,
          dispatched_at: 1,
          completed_at: 1,
          cancelled_at: 1,
          cancellation_reason: 1,
          final_odometer: 1,
          fuel_consumed: 1,
          notes: 1,
          isActive: 1,
          createdAt: 1,
          vehicle_id: "$vehicle",
          driver_id: "$driver",
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
          stage2: [{ $skip: skip || 0 }, { $limit: per_page || 100 }],
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
      const matchRegex = { $regex: match, $options: "i" };
      query = [
        {
          $match: {
            $or: [
              { trip_number: matchRegex },
              { source: matchRegex },
              { destination: matchRegex },
              { status: matchRegex },
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

    const list = await Trip.aggregate(query);

    return res.status(200).json({
      isOk: true,
      data: list,
      status: 200,
    });
  } catch (error) {
    console.error("Error in listTripsByParams:", error);
    return res.status(500).json({
      isOk: false,
      message: error.message,
      status: 500,
    });
  }
};
