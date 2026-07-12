import mongoose from "mongoose";

const { Schema } = mongoose;

const VehicleDocumentSchema = new Schema(
  {
	vehicle_id: {
	  type: Schema.Types.ObjectId,
	  ref: "Vehicle",
	  required: true,
	},
	docType: {
	  type: String,
	  enum: [
		'driving_license',
		'insurance',
		'road_tax',
		'registration_certificate',
	  ],
	  required: false,
	},
	filename: { type: String, required: true }, // stored filename on disk
	originalName: { type: String, required: true },
	path: { type: String, required: true },
	mimeType: { type: String, required: true },
	size: { type: Number, required: true },
	issueDate: { type: Date },
	expiryDate: { type: Date, index: true },
	uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
	isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

VehicleDocumentSchema.index({ vehicle_id: 1, createdAt: -1 });

export default mongoose.model("VehicleDocument", VehicleDocumentSchema);
