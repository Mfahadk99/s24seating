import { Request, Response } from "express";
import mongoose from "mongoose";
import Server from "../models/server.model";
import { handleResponse, handleError } from "../utils/responseHandler";

// Create a new server (waiter)
export const createServer = async (req: Request, res: Response) => {
  try {
    const { name, restaurantId } = req.body;

    if (!name || !restaurantId) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(
          req,
          res,
          400,
          "Name and restaurant ID are required"
        );
      } else {
        return res.render("server/detail", {
          server: null,
          error: "Name and restaurant ID are required",
          title: "Create Server Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    const server = new Server({
      name,
      restaurantId,
    });

    const savedServer = await server.save();

    if (req.query.isJSON) {
      res.status(201).json({
        success: true,
        message: "Server created successfully",
        data: savedServer,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 201, {
          success: true,
          message: "Server created successfully",
          data: savedServer,
        });
      } else {
        res.render("server/detail", {
          server: savedServer,
          title: "Server Created",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error creating server:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error creating server", error);
    } else {
      res.render("server/detail", {
        server: null,
        error: "Failed to create server",
        title: "Server Error",
        currentUser: {
          firstname: "Guest",
          lastname: "User",
          image_url: "/public/images/default-profile.png",
        },
      });
    }
  }
};

// Get all servers for a restaurant
export const getServersByRestaurant = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 400, "Invalid restaurant ID");
      } else {
        return res.render("server/index", {
          servers: [],
          error: "Invalid restaurant ID",
          title: "Servers List Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    const servers = await Server.find({
      restaurantId,
      isActive: true,
    });

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Servers retrieved successfully",
        data: servers,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "Servers retrieved successfully",
          data: servers,
        });
      } else {
        res.render("server/index", {
          servers: servers,
          title: "Servers List",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error retrieving servers:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error retrieving servers", error);
    } else {
      res.render("server/index", {
        servers: [],
        error: "Failed to load servers",
        title: "Servers List Error",
        currentUser: {
          firstname: "Guest",
          lastname: "User",
          image_url: "/public/images/default-profile.png",
        },
      });
    }
  }
};

// Assign server to a reservation
export const assignServerToReservation = async (
  req: Request,
  res: Response
) => {
  try {
    const { serverId, reservationId } = req.body;

    if (!serverId || !reservationId) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(
          req,
          res,
          400,
          "Server ID and Reservation ID are required"
        );
      } else {
        return res.render("server/detail", {
          server: null,
          error: "Server ID and Reservation ID are required",
          title: "Assignment Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    if (
      !mongoose.Types.ObjectId.isValid(serverId) ||
      !mongoose.Types.ObjectId.isValid(reservationId)
    ) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(
          req,
          res,
          400,
          "Invalid server ID or reservation ID"
        );
      } else {
        return res.render("server/detail", {
          server: null,
          error: "Invalid server ID or reservation ID",
          title: "Assignment Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    const server = await Server.findById(serverId);

    if (!server) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 404, "Server not found");
      } else {
        return res.render("server/detail", {
          server: null,
          error: "Server not found",
          title: "Assignment Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    server.reservationId = reservationId;
    server.updatedAt = new Date();
    await server.save();

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Server assigned to reservation successfully",
        data: server,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "Server assigned to reservation successfully",
          data: server,
        });
      } else {
        res.render("server/detail", {
          server: server,
          title: "Server Assigned",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error assigning server:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(
        req,
        res,
        500,
        "Error assigning server to reservation",
        error
      );
    } else {
      res.render("server/detail", {
        server: null,
        error: "Failed to assign server",
        title: "Assignment Error",
        currentUser: {
          firstname: "Guest",
          lastname: "User",
          image_url: "/public/images/default-profile.png",
        },
      });
    }
  }
};

// Remove server from reservation
export const removeServerFromReservation = async (
  req: Request,
  res: Response
) => {
  try {
    const { serverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 400, "Invalid server ID");
      } else {
        return res.render("server/detail", {
          server: null,
          error: "Invalid server ID",
          title: "Remove Assignment Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    const server = await Server.findById(serverId);

    if (!server) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 404, "Server not found");
      } else {
        return res.render("server/detail", {
          server: null,
          error: "Server not found",
          title: "Remove Assignment Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    server.reservationId = null;
    server.updatedAt = new Date();
    await server.save();

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Server removed from reservation successfully",
        data: server,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "Server removed from reservation successfully",
          data: server,
        });
      } else {
        res.render("server/detail", {
          server: server,
          title: "Server Unassigned",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error removing server assignment:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(
        req,
        res,
        500,
        "Error removing server from reservation",
        error
      );
    } else {
      res.render("server/detail", {
        server: null,
        error: "Failed to remove server assignment",
        title: "Remove Assignment Error",
        currentUser: {
          firstname: "Guest",
          lastname: "User",
          image_url: "/public/images/default-profile.png",
        },
      });
    }
  }
};

// Update server details
export const updateServer = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    const { name, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 400, "Invalid server ID");
      } else {
        return res.render("server/detail", {
          server: null,
          error: "Invalid server ID",
          title: "Update Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    const server = await Server.findById(serverId);

    if (!server) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 404, "Server not found");
      } else {
        return res.render("server/detail", {
          server: null,
          error: "Server not found",
          title: "Update Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    if (name) server.name = name;
    if (isActive !== undefined) server.isActive = isActive;
    server.updatedAt = new Date();

    await server.save();

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Server updated successfully",
        data: server,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "Server updated successfully",
          data: server,
        });
      } else {
        res.render("server/detail", {
          server: server,
          title: "Server Updated",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error updating server:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error updating server", error);
    } else {
      res.render("server/detail", {
        server: null,
        error: "Failed to update server",
        title: "Update Error",
        currentUser: {
          firstname: "Guest",
          lastname: "User",
          image_url: "/public/images/default-profile.png",
        },
      });
    }
  }
};

// Delete server (soft delete)
export const deleteServer = async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 400, "Invalid server ID");
      } else {
        return res.render("server/index", {
          servers: [],
          error: "Invalid server ID",
          title: "Delete Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    const server = await Server.findById(serverId);

    if (!server) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 404, "Server not found");
      } else {
        return res.render("server/index", {
          servers: [],
          error: "Server not found",
          title: "Delete Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    server.isActive = false;
    server.updatedAt = new Date();
    await server.save();

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Server deleted successfully",
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "Server deleted successfully",
        });
      } else {
        // After deletion, redirect to the servers index page
        res.redirect("/servers?success=deleted");
      }
    }
  } catch (error) {
    console.error("Error deleting server:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error deleting server", error);
    } else {
      res.render("server/index", {
        servers: [],
        error: "Failed to delete server",
        title: "Delete Error",
        currentUser: {
          firstname: "Guest",
          lastname: "User",
          image_url: "/public/images/default-profile.png",
        },
      });
    }
  }
};
