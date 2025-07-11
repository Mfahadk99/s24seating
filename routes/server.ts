import express from "express";
import {
  createServer,
  getServersByRestaurant,
  updateServer,
  deleteServer,
  assignServerToReservation,
  removeServerFromReservation,
} from "../controllers/server.controller";
// import { isLoggedIn } from "../middlewares/auth/is-logged-in";

const router = express.Router();

// Protect all routes with authentication
// router.use(isLoggedIn);

// Create new server (waiter)
router.post("/", createServer as any);

// Get all servers for a specific restaurant
router.get("/restaurant/:restaurantId", getServersByRestaurant as any);

// Update server details
router.put("/:serverId", updateServer as any);

// Delete server (soft delete)
router.delete("/:serverId", deleteServer as any);

// Assign server to reservation
router.post("/assign-reservation", assignServerToReservation as any);

// Remove server from reservation
router.delete("/:serverId/remove-reservation", removeServerFromReservation as any);

export default router;
