import mongoose from "mongoose";

const VehicleTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("VehicleType", VehicleTypeSchema);
