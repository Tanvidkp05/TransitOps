import api from "./index";
import { ENDPOINTS } from "./endpoints";

export const createDriver = async (data) => {
  return api.post(ENDPOINTS.DRIVERS.BASE, data);
};

export const getAllDrivers = async () => {
  return api.get(ENDPOINTS.DRIVERS.BASE);
};

export const getDriverById = async (id) => {
  return api.get(ENDPOINTS.DRIVERS.BY_ID(id));
};

export const updateDriver = async (id, data) => {
  return api.put(ENDPOINTS.DRIVERS.BY_ID(id), data);
};

export const deleteDriver = async (id) => {
  return api.delete(ENDPOINTS.DRIVERS.BY_ID(id));
};

export const searchDrivers = async (params) => {
  return api.post(ENDPOINTS.DRIVERS.SEARCH, params);
};

export default {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  searchDrivers,
};
