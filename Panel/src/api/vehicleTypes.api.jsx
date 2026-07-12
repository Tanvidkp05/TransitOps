/**
 * Vehicle Types API Service
 * Handles all vehicle type-related API calls
 */
import api from "./index";
import { ENDPOINTS } from "./endpoints";

/**
 * Create a new vehicle type
 * @param {Object} data - Vehicle type data
 * @returns {Promise}
 */
export const createVehicleType = async (data) => {
    return api.post(ENDPOINTS.VEHICLE_TYPES.BASE, data);
};

/**
 * Get all active vehicle types
 * @returns {Promise}
 */
export const getAllVehicleTypes = async () => {
    return api.get(ENDPOINTS.VEHICLE_TYPES.BASE);
};

/**
 * Get vehicle type by ID
 * @param {string} id - Vehicle type ID
 * @returns {Promise}
 */
export const getVehicleTypeById = async (id) => {
    return api.get(ENDPOINTS.VEHICLE_TYPES.BY_ID(id));
};

/**
 * Update vehicle type
 * @param {string} id - Vehicle type ID
 * @param {Object} data - Updated vehicle type data
 * @returns {Promise}
 */
export const updateVehicleType = async (id, data) => {
    return api.put(ENDPOINTS.VEHICLE_TYPES.BY_ID(id), data);
};

/**
 * Delete vehicle type
 * @param {string} id - Vehicle type ID
 * @returns {Promise}
 */
export const deleteVehicleType = async (id) => {
    return api.delete(ENDPOINTS.VEHICLE_TYPES.BY_ID(id));
};

/**
 * Search vehicle types with filters
 * @param {Object} params - Search parameters
 * @returns {Promise}
 */
export const searchVehicleTypes = async (params) => {
    return api.post(ENDPOINTS.VEHICLE_TYPES.SEARCH, params);
};

export default {
    createVehicleType,
    getAllVehicleTypes,
    getVehicleTypeById,
    updateVehicleType,
    deleteVehicleType,
    searchVehicleTypes,
};
