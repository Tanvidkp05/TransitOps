import mongoose from "mongoose";

const { Schema } = mongoose;

const MaintenanceLogSchema = new Schema(
  {
    vehicle_id: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    issue_type: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
      required: true,
    },
    opened_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    closed_at: {
      type: Date,
    },
    image: {
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

export default mongoose.model("MaintenanceLog", MaintenanceLogSchema);
