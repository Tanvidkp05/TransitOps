import Vehicle from "../../models/Vehicle.js";
import VehicleDocument from "../../models/VehicleDocument.js";
import fs from "fs";
import path from "path";

// Helper to safely delete file
const deleteFileSafe = (filePath) => {
  if (!filePath) return;
  try {
	if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
	console.warn("Failed to delete file:", filePath, err.message);
  }
};

export const uploadDocument = async (req, res) => {
  try {
	const { vehicle_id, issueDate, expiryDate, docType } = req.body;

	const ALLOWED = ['driving_license','insurance','road_tax','registration_certificate'];
	if (docType && !ALLOWED.includes(docType)) {
	  if (req.file && req.file.path) deleteFileSafe(req.file.path);
	  return res.status(400).json({ isOk: false, message: 'Invalid document type' });
	}

	if (!vehicle_id) {
	  if (req.file && req.file.path) deleteFileSafe(req.file.path);
	  return res.status(400).json({ isOk: false, message: "vehicle_id is required" });
	}

	const vehicle = await Vehicle.findById(vehicle_id);
	if (!vehicle) {
	  if (req.file && req.file.path) deleteFileSafe(req.file.path);
	  return res.status(404).json({ isOk: false, message: "Vehicle not found" });
	}

	if (!req.file) {
	  return res.status(400).json({ isOk: false, message: "No file uploaded" });
	}

	const doc = await VehicleDocument.create({
	  vehicle_id,
		docType: docType || null,
	  filename: req.file.filename || path.basename(req.file.path),
	  originalName: req.file.originalname,
	  path: req.file.path.replace(/\\/g, "/"),
	  mimeType: req.file.mimetype,
	  size: req.file.size,
	  issueDate: issueDate ? new Date(issueDate) : null,
	  expiryDate: expiryDate ? new Date(expiryDate) : null,
	  uploadedBy: req.user?.id,
	});

	return res.status(201).json({ isOk: true, message: "Document uploaded", data: doc });
  } catch (error) {
	console.error("Error in uploadDocument:", error);
	if (req.file && req.file.path) deleteFileSafe(req.file.path);
	return res.status(500).json({ isOk: false, message: error.message });
  }
};

export const listByVehicle = async (req, res) => {
  try {
	const { vehicleId } = req.params;
	const docs = await VehicleDocument.find({ vehicle_id: vehicleId, isActive: true })
	  .sort({ createdAt: -1 })
	  .lean();

	return res.status(200).json({ isOk: true, data: docs });
  } catch (error) {
	console.error("Error in listByVehicle:", error);
	return res.status(500).json({ isOk: false, message: error.message });
  }
};

export const getDocument = async (req, res) => {
  try {
	const { docId } = req.params;
	const doc = await VehicleDocument.findById(docId).lean();
	if (!doc) return res.status(404).json({ isOk: false, message: "Document not found" });
	return res.status(200).json({ isOk: true, data: doc });
  } catch (error) {
	console.error("Error in getDocument:", error);
	return res.status(500).json({ isOk: false, message: error.message });
  }
};

export const downloadDocument = async (req, res) => {
  try {
	const { docId } = req.params;
	const doc = await VehicleDocument.findById(docId).lean();
	if (!doc) return res.status(404).json({ isOk: false, message: "Document not found" });

	const filePath = path.resolve(doc.path);
	if (!fs.existsSync(filePath)) {
	  return res.status(404).json({ isOk: false, message: "File not found on server" });
	}

	return res.download(filePath, doc.originalName);
  } catch (error) {
	console.error("Error in downloadDocument:", error);
	return res.status(500).json({ isOk: false, message: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
	const { docId } = req.params;
	const doc = await VehicleDocument.findById(docId);
	if (!doc) return res.status(404).json({ isOk: false, message: "Document not found" });

	// Delete file from disk
	deleteFileSafe(doc.path);

	await VehicleDocument.findByIdAndDelete(docId);

	return res.status(200).json({ isOk: true, message: "Document deleted" });
  } catch (error) {
	console.error("Error in deleteDocument:", error);
	return res.status(500).json({ isOk: false, message: error.message });
  }
};

export default {
  uploadDocument,
  listByVehicle,
  getDocument,
  downloadDocument,
  deleteDocument,
};
