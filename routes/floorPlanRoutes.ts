import express from "express";
import {
  getFloorPlans,
  getFloorPlanById,
  createFloorPlan,
  updateFloorPlan,
  deleteFloorPlan,
} from "../controllers/floorPlanController";
import { authenticateToken } from "../middlewares/auth";

const router = express.Router();

// Public routes
router.get("/restaurant/:restaurantId", getFloorPlans);
router.get("/:id", getFloorPlanById);

// Protected routes (require authentication)
router.post("/", authenticateToken, createFloorPlan);
router.put("/:id", authenticateToken, updateFloorPlan);
router.delete("/:id", authenticateToken, deleteFloorPlan);

export default router;
