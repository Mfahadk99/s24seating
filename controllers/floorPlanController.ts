import { Request, Response } from "express";
import FloorPlan from "../models/floor.model";
import Restaurant from "../models/restaurant.model";
import { handleResponse, handleError, handleRedirect } from "../utils/responseHandler";

// Extend Request interface for user authentication
interface IUserRequest extends Request {
  user: { _id: string };
}

// Get all floor plans for a restaurant
export const getFloorPlans = async (req: Request, res: Response) => {
  try {
    const floorPlans = await FloorPlan.find({
      restaurantId: req.params.restaurantId,
      isActive: true,
    });
    handleResponse(req, res, 200, {
      success: true,
      message: "All floor plans for this restaurant have been retrieved successfully",
      data: floorPlans,
      count: floorPlans.length,
      floorPlans,
      restaurantId: req.params.restaurantId,
    });
  } catch (error) {
    handleError(req, res, 500, "Error fetching floor plans", error);
  }
};

// Get floor plan by ID
export const getFloorPlanById = async (req: Request, res: Response) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id);
    if (!floorPlan) {
      return handleError(req, res, 404, "Floor plan not found");
    }

    handleResponse(req, res, 200, {
      success: true,
      message: "Floor plan has been retrieved successfully",
      data: floorPlan,
      floorPlan,
      restaurantId: floorPlan.restaurantId,
    });
  } catch (error) {
    handleError(req, res, 500, "Error fetching floor plan", error);
  }
};

// Create new floor plan
export const createFloorPlan = async (req: IUserRequest, res: Response) => {
  try {
    console.log("🚀 Creating floor plan with data:", req.body);
    console.log("👤 User ID:", req.user._id);

    // Check if restaurant exists and user has access
    const restaurant = await Restaurant.findById(req.body.restaurantId);
    if (!restaurant) {
      return handleError(req, res, 404, "Restaurant not found");
    }

    // if (restaurant.owner.toString() !== req.user._id.toString()) {
    //   return handleError(req, res, 403, "Not authorized to create floor plans for this restaurant");
    // }

    // Create the floor plan
    const floorPlan = new FloorPlan(req.body);
    await floorPlan.save();

    console.log("✅ Floor plan created:", floorPlan._id);

    handleResponse(req, res, 201, {
      success: true,
      message: "Floor plan has been created successfully",
      data: floorPlan,
    });


  } catch (error) {
    console.error("❌ Error creating floor plan:", error);
    handleError(req, res, 400, "Error creating floor plan", error);
  }
};

// Update floor plan
export const updateFloorPlan = async (req: IUserRequest, res: Response) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id);
    if (!floorPlan) {
      return handleError(req, res, 404, "Floor plan not found");
    }

    // Check authorization through restaurant ownership
    const restaurant = await Restaurant.findById(floorPlan.restaurantId);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return handleError(req, res, 403, "Not authorized to update this floor plan");
    }

    const updatedFloorPlan = await FloorPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (req.query.resType === "json") {
      handleResponse(req, res, 200, {
        success: true,
        message: "Floor plan has been updated successfully",
        data: updatedFloorPlan,
      });
    } else {
      handleRedirect(req, res, `/floorplans/restaurant/${floorPlan.restaurantId}?success=updated`);
    }
  } catch (error) {
    handleError(req, res, 400, "Error updating floor plan", error);
  }
};

// Delete floor plan (soft delete)
export const deleteFloorPlan = async (req: IUserRequest, res: Response) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id);
    if (!floorPlan) {
      return handleError(req, res, 404, "Floor plan not found");
    }

    // Check authorization through restaurant ownership
    const restaurant = await Restaurant.findById(floorPlan.restaurantId);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return handleError(req, res, 403, "Not authorized to delete this floor plan");
    }

    // Soft delete by setting isActive to false
    floorPlan.isActive = false;
    await floorPlan.save();

    if (req.query.resType === "json") {
      handleResponse(req, res, 200, {
        success: true,
        message: "Floor plan has been deleted successfully",
        data: { id: floorPlan._id, name: floorPlan.name },
      });
    } else {
      handleRedirect(req, res, `/floorplans/restaurant/${floorPlan.restaurantId}?success=deleted`);
    }
  } catch (error) {
    handleError(req, res, 500, "Error deleting floor plan", error);
  }
};
