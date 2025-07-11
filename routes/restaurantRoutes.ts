import express from "express";
import {
  getRestaurantById,
  getRestaurantsByOwner,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getAllRestaurants,
  getAdminRestaurant,
  getRestaurantSettings,
} from "../controllers/restaurantController";
import { authenticateToken } from "../middlewares/auth";
import Restaurant from "../models/restaurant.model";

const router = express.Router();

// Public routes

router.get("/my-restaurants", (req, res, next) => {
  res.render("all-restaurants/index");
});

router.get("/my-restaurants/detail/:id", getAdminRestaurant as any);

// Routes
router.get("/all", getAllRestaurants);

router.get("/detail/:id", getRestaurantById as any);
router.get("/settings/:id", getRestaurantSettings as any);

// router.get('/:id', getRestaurantById);
router.get("/owner/:ownerId", getRestaurantsByOwner);

// Protected routes (require authentication)
router.post("/", authenticateToken, createRestaurant);
router.put("/update/:id", authenticateToken, updateRestaurant as any);
router.delete("/:id", authenticateToken, deleteRestaurant as any);

export default router;
