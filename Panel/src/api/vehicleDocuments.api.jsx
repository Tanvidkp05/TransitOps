/**
 * Vehicle Documents API Service
 */
import api from "./index";
import { ENDPOINTS } from "./endpoints";

export const uploadDocument = async ({ vehicleId, docType, issueDate, expiryDate, file }) => {
	const form = new FormData();
	form.append("vehicle_id", vehicleId);
	if (docType) form.append("docType", docType);
	if (issueDate) form.append("issueDate", issueDate);
	if (expiryDate) form.append("expiryDate", expiryDate);
	form.append("file", file);

	return api.post(ENDPOINTS.VEHICLE_DOCUMENTS.BASE, form, {
		headers: { "Content-Type": "multipart/form-data" },
	});
};

export const listDocuments = async (vehicleId) => {
	return api.get(ENDPOINTS.VEHICLE_DOCUMENTS.BY_VEHICLE(vehicleId));
};

export const getDocument = async (id) => {
	return api.get(ENDPOINTS.VEHICLE_DOCUMENTS.BY_ID(id));
};

export const downloadDocument = async (id) => {
	return api.get(ENDPOINTS.VEHICLE_DOCUMENTS.DOWNLOAD(id), { responseType: "blob" });
};

export const deleteDocument = async (id) => {
	return api.delete(ENDPOINTS.VEHICLE_DOCUMENTS.BY_ID(id));
};

export default { uploadDocument, listDocuments, getDocument, downloadDocument, deleteDocument };
