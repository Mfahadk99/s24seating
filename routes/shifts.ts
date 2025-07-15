import express from "express";
import {
    createShift,
    getShifts,
    getShiftById,
    updateShift,
    deleteShift,
    getTimeSlots
} from "../controllers/shiftController";
import isLoggedIn from "../middlewares/auth/is-logged-in";

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(isLoggedIn);

// Create a new shift with time slots
router.post("/", createShift);

// Get all shifts for a restaurant
router.get("/restaurant/:restaurantId", getShifts);

// Get a single shift by ID
router.get("/:shiftId", getShiftById);

// Update a shift
router.put("/:shiftId", updateShift);

// Delete a shift
router.delete("/:shiftId", deleteShift);


router.get('/restaurant/shifts/:restaurantId', getTimeSlots as any);


export default router; 