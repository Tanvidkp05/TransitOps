import mongoose from "mongoose";

const { Schema } = mongoose;

const ExpenseSchema = new Schema(
  {
    vehicle_id: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    expense_type: {
      type: String,
      enum: ["Fuel", "Toll", "Insurance", "Permit", "Other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Fuel-specific details (only applicable when expense_type === "Fuel")
    fuel_liters: {
      type: Number,
      min: 0,
    },
    odometer_reading: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    receipt_image: {
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

export default mongoose.model("Expense", ExpenseSchema);
