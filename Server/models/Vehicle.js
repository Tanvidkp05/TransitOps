import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
  {
    registration_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name_model: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    max_load_capacity: {
      type: Number,
      required: true,
    },
    odometer: {
      type: Number,
      required: true,
    },
    acquisition_cost: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Available", "On Trip", "In Shop", "Retired"],
      default: "Available",
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", VehicleSchema);
