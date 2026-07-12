import mongoose from "mongoose";

const { Schema } = mongoose;

const TripSchema = new Schema(
  {
    trip_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    vehicle_id: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    driver_id: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    cargo_weight: {
      type: Number,
      required: true,
    },
    planned_distance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Dispatched", "Completed", "Cancelled"],
      default: "Draft",
      required: true,
    },
    dispatched_at: {
      type: Date,
    },
    completed_at: {
      type: Date,
    },
    cancelled_at: {
      type: Date,
    },
    cancellation_reason: {
      type: String,
      trim: true,
    },
    final_odometer: {
      type: Number,
    },
    fuel_consumed: {
      type: Number,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Trip", TripSchema);
