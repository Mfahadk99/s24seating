import { Request, Response } from "express";
import Waitlist from "../models/waitlist.model";
import { handleResponse, handleError } from "../utils/responseHandler";

// Create a new waitlist entry
export const createWaitlistEntry = async (req: Request, res: Response) => {
  try {
    const waitlistEntry = new Waitlist({
      restaurantId: req.body.restaurantId,
      userId: req.body.userId,
      partySize: req.body.partySize,
      waitingTime: req.body.waitingTime,
      guestInfo: {
        name: req.body.guestInfo.name,
        email: req.body.guestInfo.email,
        phone: req.body.guestInfo.phone,
      },
    });

    const savedEntry = await waitlistEntry.save();

    if (req.query.isJSON) {
      res.status(201).json({
        success: true,
        message: "Waitlist entry created successfully",
        data: savedEntry,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 201, {
          success: true,
          message: "Waitlist entry created successfully",
          data: savedEntry,
        });
      } else {
        res.render("waitlist/detail", {
          waitlistEntry: savedEntry,
          title: "Waitlist Entry Created",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error creating waitlist entry:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error creating waitlist entry", error);
    } else {
      res.render("waitlist/detail", {
        waitlistEntry: null,
        error: "Failed to create waitlist entry",
        title: "Waitlist Entry Error",
        currentUser: {
          firstname: "Guest",
          lastname: "User",
          image_url: "/public/images/default-profile.png",
        },
      });
    }
  }
};

// Get all waitlist entries for a restaurant
export const getWaitlistByRestaurant = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const waitlist = await Waitlist.find({ restaurantId }).sort({
      createdAt: 1,
    });

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Waitlist by restaurant fetched successfully",
        data: waitlist,
      });
    } else {
      console.log("Found waitlist entries:", waitlist.length);

      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "Waitlist retrieved successfully",
          data: waitlist,
        });
      } else {
        res.render("waitlist/index", {
          waitlist: waitlist,
          title: "Waitlist Entries",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error retrieving waitlist", error);
    } else {
      res.render("waitlist/index", {
        waitlist: [],
        error: "Failed to load waitlist",
        title: "Waitlist Entries",
        currentUser: {
          firstname: "Guest",
          lastname: "User",
          image_url: "/public/images/default-profile.png",
        },
      });
    }
  }
};

// Get a single waitlist entry
export const getWaitlistEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const waitlistEntry = await Waitlist.findById(id);

    if (!waitlistEntry) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 404, "Waitlist entry not found");
      } else {
        return res.render("waitlist/detail", {
          waitlistEntry: null,
          error: "Waitlist entry not found",
          title: "Entry Not Found",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Waitlist entry fetched successfully",
        data: waitlistEntry,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "Waitlist entry retrieved successfully",
          data: waitlistEntry,
        });
      } else {
        res.render("waitlist/detail", {
          waitlistEntry: waitlistEntry,
          title: "Waitlist Entry Details",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error fetching waitlist entry:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(
        req,
        res,
        500,
        "Error retrieving waitlist entry",
        error
      );
    } else {
      res.render("waitlist/detail", {
        waitlistEntry: null,
        error: "Failed to load waitlist entry",
        title: "Entry Error",
        currentUser: {
          firstname: "Guest",
          lastname: "User",
          image_url: "/public/images/default-profile.png",
        },
      });
    }
  }
};

// Update a waitlist entry
export const updateWaitlistEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = {
      partySize: req.body.partySize,
      waitingTime: req.body.waitingTime,
      guestInfo: {
        name: req.body.guestInfo?.name,
        email: req.body.guestInfo?.email,
        phone: req.body.guestInfo?.phone,
      },
    };

    const updatedEntry = await Waitlist.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    if (!updatedEntry) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 404, "Waitlist entry not found");
      } else {
        return res.render("waitlist/detail", {
          waitlistEntry: null,
          error: "Waitlist entry not found",
          title: "Update Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Waitlist entry updated successfully",
        data: updatedEntry,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "Waitlist entry updated successfully",
          data: updatedEntry,
        });
      } else {
        res.render("waitlist/detail", {
          waitlistEntry: updatedEntry,
          title: "Entry Updated",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error updating waitlist entry:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error updating waitlist entry", error);
    } else {
      res.render("waitlist/detail", {
        waitlistEntry: null,
        error: "Failed to update waitlist entry",
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

// Delete a waitlist entry
export const deleteWaitlistEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedEntry = await Waitlist.findByIdAndDelete(id);

    if (!deletedEntry) {
      if (req.query.isJSON || req.query.isJSON === "true") {
        return handleError(req, res, 404, "Waitlist entry not found");
      } else {
        return res.render("waitlist/index", {
          waitlist: [],
          error: "Waitlist entry not found",
          title: "Delete Error",
          currentUser: {
            firstname: "Guest",
            lastname: "User",
            image_url: "/public/images/default-profile.png",
          },
        });
      }
    }

    if (req.query.isJSON) {
      res.status(200).json({
        success: true,
        message: "Waitlist entry deleted successfully",
        data: deletedEntry,
      });
    } else {
      if (req.query.isJSON === "true") {
        return handleResponse(req, res, 200, {
          success: true,
          message: "Waitlist entry deleted successfully",
          data: deletedEntry,
        });
      } else {
        // After deletion, redirect to the waitlist index page
        res.redirect("/waitlist?success=deleted");
      }
    }
  } catch (error) {
    console.error("Error deleting waitlist entry:", error);
    if (req.query.isJSON || req.query.isJSON === "true") {
      return handleError(req, res, 500, "Error deleting waitlist entry", error);
    } else {
      res.render("waitlist/index", {
        waitlist: [],
        error: "Failed to delete waitlist entry",
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
