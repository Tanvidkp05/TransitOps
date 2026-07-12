import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    licenseCategory: {
      type: String,
      required: true,
      trim: true,
    },
    licenseExpiryDate: {
      type: Date,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    safetyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Available", "On Trip", "Off Duty", "Suspended"],
      default: "Available",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Driver", DriverSchema);
