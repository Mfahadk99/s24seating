import { Request, Response } from "express";
import Restaurant from "../models/restaurant.model";
import {
  handleResponse,
  handleError,
  handleRedirect,
} from "../utils/responseHandler";
import { Menu } from "../modules/menu";

// Extend Request interface for user authentication
interface IUserRequest extends Request {
  user: { _id: string };
}

const menuInstance = new Menu();

// Get restaurant settings page
export const getRestaurantSettings = async (req: Request, res: Response) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return handleError(req, res, 404, 'Restaurant not found');
    }
    
    res.render("partials/restaurant-settings", {
      restaurant,
      restaurantId,
      title: "Restaurant Settings",
      menu: menuInstance.client, // Use the menuInstance like in getAdminRestaurant
      currentUser: req.user || {
        firstname: 'Guest',
        lastname: 'User',
        image_url: '/public/images/default-profile.png'
      }
    });
  } catch (error) {
    handleError(req, res, 500, 'Error fetching restaurant details', error);
  }
};

// // Get all restaurants
export const getAllRestaurants = async (req: Request, res: Response) => {
  try {
    // Fetch restaurants directly from the database
    const restaurants = await Restaurant.find({ status: "active" });

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Restaurants fetched successfully",
        data: restaurants,
      });
    } else {
      console.log("Found restaurants:", restaurants.length);

      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "restaurants retrieved successfully",
          data: restaurants,
        });
      } else {
        // Render the view with the restaurant data
        res.render("restaurant/index", {
          restaurants: restaurants,
          title: "Restaurant Listings",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.render("restaurant/index", {
      restaurants: [],
      error: "Failed to load restaurants",
      title: "Restaurant Listings",
      currentUser: {
        firstname: "Guest",
        lastname: "User",
        image_url: "/public/images/default-profile.png",
      },
    });
  }
};

// Get restaurant by ID
export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      if (req.query.isJSON) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found",
          data: null
        });
      }
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
        data: null
      });
    }

    if (req.query.isJSON) {
      return res.status(200).json({
        success: true,
        message: "Restaurant fetched successfully",
        data: restaurant
      });
    } 

    res.render("restaurant/restaurant-detail/index", {
      restaurant: restaurant,
      title: "Restaurant Detail",
      currentUser: {
        firstname: "Guest",
        lastname: "User",
        image_url: "/public/images/default-profile.png",
      },
    });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    
    if (req.query.isJSON) {
      return res.status(500).json({
        success: false,
        message: "Error fetching restaurant",
        data: null
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error fetching restaurant",
      data: null,
    });
  }
};

export const getAdminRestaurant = async (req: Request, res: Response) => {
  console.log('Restaurant ID received:', req.params.id);
  
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      console.log("Restaurant not found with ID:", req.params.id);
      return handleError(req, res, 404, "Restaurant not found");
    }

    console.log("Restaurant found:", {
      id: restaurant._id,
      name: restaurant.name,
      address: restaurant.address,
      description: restaurant.description,
    });

    res.render("all-restaurants/detail/index", {
      title: "Admin Restaurant",
      menu: menuInstance.client,
      restaurant,
      restaurantId: req.params.id,
      // currentUser: {
      //   firstname: 'Guest',
      //   lastname: 'User',
      //   image_url: '/public/images/default-profile.png'
      // }
    });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return handleError(req, res, 500, "Error fetching restaurant details");
  }
};
// Get restaurants by owner
export const getRestaurantsByOwner = async (req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.find({
      owner: req.params.ownerId,
      status: "active",
    });
    handleResponse(req, res, 200, {
      success: true,
      message: `Restaurants for owner ${req.params.ownerId} have been retrieved successfully`,
      data: restaurants,
      count: restaurants.length,
      restaurants,
      ownerId: req.params.ownerId,
    });
  } catch (error) {
    handleError(req, res, 500, "Error fetching restaurants", error);
  }
};

// Create new restaurant
export const createRestaurant = async (req: IUserRequest, res: Response) => {
  console.log(req.body, "createRestaurantcreateRestaurant");
  try {
    const restaurant = new Restaurant({
      ...req.body,
      createdBy: req.user._id,
      owner: req.body.owner || req.user._id,
    });
    await restaurant.save();

    handleResponse(req, res, 201, {
      success: true,
      message: "Restaurant has been created successfully",
      data: restaurant,
    });
  } catch (error) {
    handleError(req, res, 400, "Error creating restaurant", error);
  }
};

// Update restaurant
export const updateRestaurant = async (req: IUserRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return handleError(req, res, 404, "Restaurant not found");
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return handleError(
        req,
        res,
        403,
        "Not authorized to update this restaurant"
      );
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id,
      },
      { new: true, runValidators: true }
    );

    if (req.query.resType === "json") {
      handleResponse(req, res, 200, {
        success: true,
        message: "Restaurant has been updated successfully",
        data: updatedRestaurant,
      });
    } else {
      handleRedirect(req, res, `/restaurants/${req.params.id}?success=updated`);
    }
  } catch (error) {
    handleError(req, res, 400, "Error updating restaurant", error);
  }
};

// Delete restaurant (soft delete)
export const deleteRestaurant = async (req: IUserRequest, res: Response) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return handleError(req, res, 404, "Restaurant not found");
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return handleError(
        req,
        res,
        403,
        "Not authorized to delete this restaurant"
      );
    }

    // Soft delete by updating status
    restaurant.status = "closed";
    restaurant.updatedBy = req.user._id as any;
    await restaurant.save();

    if (req.query.resType === "json") {
      handleResponse(req, res, 200, {
        success: true,
        message: "Restaurant has been deleted successfully",
        data: { id: restaurant._id, name: restaurant.name },
      });
    } else {
      handleRedirect(req, res, `/restaurants?success=deleted`);
    }
  } catch (error) {
    handleError(req, res, 500, "Error deleting restaurant", error);
  }
};
