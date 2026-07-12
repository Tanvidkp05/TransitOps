/**
 * Expenses API Service
 * Handles all expense-related API calls
 */
import api from "./index";
import { ENDPOINTS } from "./endpoints";

/**
 * Create a new expense
 * @param {FormData} data - Expense data with receipt file
 * @returns {Promise}
 */
export const createExpense = async (data) => {
    return api.post(ENDPOINTS.EXPENSES.BASE, data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

/**
 * Get all active expenses
 * @returns {Promise}
 */
export const getAllExpenses = async () => {
    return api.get(ENDPOINTS.EXPENSES.BASE);
};

/**
 * Get expense by ID
 * @param {string} id - Expense ID
 * @returns {Promise}
 */
export const getExpenseById = async (id) => {
    return api.get(ENDPOINTS.EXPENSES.BY_ID(id));
};

/**
 * Update expense
 * @param {string} id - Expense ID
 * @param {FormData} data - Updated expense data
 * @returns {Promise}
 */
export const updateExpense = async (id, data) => {
    return api.put(ENDPOINTS.EXPENSES.BY_ID(id), data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

/**
 * Delete expense
 * @param {string} id - Expense ID
 * @returns {Promise}
 */
export const deleteExpense = async (id) => {
    return api.delete(ENDPOINTS.EXPENSES.BY_ID(id));
};

/**
 * Search expenses with pagination/filters
 * @param {Object} params - Search parameters
 * @returns {Promise}
 */
export const searchExpenses = async (params) => {
    return api.post(ENDPOINTS.EXPENSES.SEARCH, params);
};

/**
 * Get vehicle costs summary (Fuel + Maintenance + Tolls)
 * @returns {Promise}
 */
export const getVehicleCosts = async () => {
    return api.get(ENDPOINTS.EXPENSES.VEHICLE_COSTS);
};

/**
 * Get latest fuel log for a vehicle
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise}
 */
export const getLatestFuelByVehicle = async (vehicleId) => {
    return api.get(ENDPOINTS.EXPENSES.LATEST_FUEL(vehicleId));
};

export default {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    searchExpenses,
    getVehicleCosts,
    getLatestFuelByVehicle,
};
