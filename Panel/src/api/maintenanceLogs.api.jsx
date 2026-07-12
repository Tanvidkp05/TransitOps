/**
 * Maintenance Logs API Service
 * Handles all maintenance-related API calls
 */
import api from "./index";
import { ENDPOINTS } from "./endpoints";

/**
 * Create a new maintenance log
 * @param {FormData} data - Maintenance log data with image file
 * @returns {Promise}
 */
export const createMaintenanceLog = async (data) => {
    return api.post(ENDPOINTS.MAINTENANCE_LOGS.BASE, data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

/**
 * Get all active maintenance logs
 * @returns {Promise}
 */
export const getAllMaintenanceLogs = async () => {
    return api.get(ENDPOINTS.MAINTENANCE_LOGS.BASE);
};

/**
 * Get maintenance log by ID
 * @param {string} id - Maintenance Log ID
 * @returns {Promise}
 */
export const getMaintenanceLogById = async (id) => {
    return api.get(ENDPOINTS.MAINTENANCE_LOGS.BY_ID(id));
};

/**
 * Update maintenance log
 * @param {string} id - Maintenance Log ID
 * @param {FormData} data - Updated maintenance log data
 * @returns {Promise}
 */
export const updateMaintenanceLog = async (id, data) => {
    return api.put(ENDPOINTS.MAINTENANCE_LOGS.BY_ID(id), data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

/**
 * Delete maintenance log
 * @param {string} id - Maintenance Log ID
 * @returns {Promise}
 */
export const deleteMaintenanceLog = async (id) => {
    return api.delete(ENDPOINTS.MAINTENANCE_LOGS.BY_ID(id));
};

/**
 * Search maintenance logs with pagination/filters
 * @param {Object} params - Search parameters
 * @returns {Promise}
 */
export const searchMaintenanceLogs = async (params) => {
    return api.post(ENDPOINTS.MAINTENANCE_LOGS.SEARCH, params);
};

export default {
    createMaintenanceLog,
    getAllMaintenanceLogs,
    getMaintenanceLogById,
    updateMaintenanceLog,
    deleteMaintenanceLog,
    searchMaintenanceLogs,
};
