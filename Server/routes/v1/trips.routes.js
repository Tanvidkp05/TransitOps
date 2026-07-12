import express from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { searchRateLimiter } from "../../middlewares/rateLimiter.js";
import {
  allowOnlyFields,
  allowedTripFields,
  allowedTripSearchFields,
  createTripValidation,
  updateTripValidation,
  completeTripValidation,
  cancelTripValidation,
  searchValidation,
} from "../../middlewares/inputValidator.js";
import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  deleteTrip,
  listTripsByParams,
} from "../../controllers/v1/trip.controller.js";

const router = express.Router();

router.post(
  "/trips",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  allowOnlyFields(allowedTripFields),
  createTripValidation,
  createTrip
);

router.get(
  "/trips",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getAllTrips
);

router.get(
  "/trips/:tripId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  getTripById
);

router.put(
  "/trips/:tripId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  allowOnlyFields(allowedTripFields),
  updateTripValidation,
  updateTrip
);

router.delete(
  "/trips/:tripId",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  deleteTrip
);

router.post(
  "/trips/search",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  searchRateLimiter,
  allowOnlyFields(allowedTripSearchFields),
  searchValidation,
  listTripsByParams
);

router.patch(
  "/trips/:tripId/dispatch",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  dispatchTrip
);

router.patch(
  "/trips/:tripId/complete",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  completeTripValidation,
  completeTrip
);

router.patch(
  "/trips/:tripId/cancel",
  authMiddleware(["ADMIN", "EMPLOYEE"]),
  cancelTripValidation,
  cancelTrip
);

export default router;
