/**
 * Trips API Service
 * Handles all trip-related API calls
 */
import api from "./index";
import { ENDPOINTS } from "./endpoints";

export const createTrip = async (data) => {
    return api.post(ENDPOINTS.TRIPS.BASE, data);
};

export const getAllTrips = async () => {
    return api.get(ENDPOINTS.TRIPS.BASE);
};

export const getTripById = async (id) => {
    return api.get(ENDPOINTS.TRIPS.BY_ID(id));
};

export const updateTrip = async (id, data) => {
    return api.put(ENDPOINTS.TRIPS.BY_ID(id), data);
};

export const deleteTrip = async (id) => {
    return api.delete(ENDPOINTS.TRIPS.BY_ID(id));
};

export const searchTrips = async (params) => {
    return api.post(ENDPOINTS.TRIPS.SEARCH, params);
};

export const dispatchTrip = async (id) => {
    return api.patch(ENDPOINTS.TRIPS.DISPATCH(id));
};

export const completeTrip = async (id, data) => {
    return api.patch(ENDPOINTS.TRIPS.COMPLETE(id), data);
};

export const cancelTrip = async (id, data) => {
    return api.patch(ENDPOINTS.TRIPS.CANCEL(id), data);
};
