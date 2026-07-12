/**
 * Analytics API Service
 * Handles all analytics-related API calls
 */
import api from "./index";
import { ENDPOINTS } from "./endpoints";

/**
 * Get fleet analytics summary and detailed report
 * @returns {Promise}
 */
export const getAnalyticsSummary = async () => {
    return api.get(ENDPOINTS.ANALYTICS.SUMMARY);
};

export default {
    getAnalyticsSummary,
};
