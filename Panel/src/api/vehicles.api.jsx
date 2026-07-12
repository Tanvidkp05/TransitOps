/**
 * Vehicles API Service
 * Handles all vehicle-related API calls
 */
import api from "./index";
import { ENDPOINTS } from "./endpoints";

/**
 * Create a new vehicle
 * @param {FormData} data - Vehicle data with image file
 * @returns {Promise}
 */
export const createVehicle = async (data) => {
    return api.post(ENDPOINTS.VEHICLES.BASE, data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

/**
 * Get all active vehicles
 * @returns {Promise}
 */
export const getAllVehicles = async () => {
    return api.get(ENDPOINTS.VEHICLES.BASE);
};

/**
 * Get vehicle by ID
 * @param {string} id - Vehicle ID
 * @returns {Promise}
 */
export const getVehicleById = async (id) => {
    return api.get(ENDPOINTS.VEHICLES.BY_ID(id));
};

/**
 * Update vehicle
 * @param {string} id - Vehicle ID
 * @param {FormData} data - Updated vehicle data
 * @returns {Promise}
 */
export const updateVehicle = async (id, data) => {
    return api.put(ENDPOINTS.VEHICLES.BY_ID(id), data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

/**
 * Delete vehicle
 * @param {string} id - Vehicle ID
 * @returns {Promise}
 */
export const deleteVehicle = async (id) => {
    return api.delete(ENDPOINTS.VEHICLES.BY_ID(id));
};

/**
 * Search vehicles with pagination/filters
 * @param {Object} params - Search parameters
 * @returns {Promise}
 */
export const searchVehicles = async (params) => {
    return api.post(ENDPOINTS.VEHICLES.SEARCH, params);
};

export default {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    searchVehicles,
};
