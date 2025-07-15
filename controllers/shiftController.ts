import { Request, Response } from "express";
import Shift from "../models/shift";
import mongoose from "mongoose";
import { Menu } from "../modules/menu";
import { handleError, handleResponse } from "../utils/responseHandler";

export const createShift = async (req: Request, res: Response) => {
  try {
    const {
      name,
      startTime,
      endTime,
      day,
      duration,
      bufferTime,
      restaurantId,
    } = req.body;

    if (!name || !startTime || !endTime || !day || !restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Parse the date and get the day of the week

    // const shiftDate = new Date(date);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    // const day = days[shiftDate.getDay()];

    // Create a new shift
    const shift = new Shift({
      name,
      startTime,
      endTime,
      // date: shiftDate,
      day,
      duration: duration || 45, // Default to 45 minutes if not provided
      bufferTime: bufferTime || 15, // Default to 15 minutes if not provided
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
    });

    // Save the shift
    await shift.save();

    // Generate time slots for this shift
    // const timeSlotIds = await shift.generateTimeSlots();

    return res.status(201).json({
      success: true,
      message: "Shift created successfully with time slots",
      data: {
        shift,
        // timeSlotCount: timeSlotIds.length,
      },
    });
  } catch (error) {
    console.error("Error creating shift:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create shift",
      error: error.message,
    });
  }
};

export const getShifts = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required",
      });
    }

    // Find all shifts for the restaurant
    const shifts = await Shift.find({
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
    });

    return res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    console.error("Error getting shifts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get shifts",
      error: error.message,
    });
  }
};

export const getShiftById = async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;

    if (!shiftId) {
      return res.status(400).json({
        success: false,
        message: "Shift ID is required",
      });
    }

    // Find the shift by ID
    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: shift,
    });
  } catch (error) {
    console.error("Error getting shift:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get shift",
      error: error.message,
    });
  }
};

export const updateShift = async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const { name, startTime, endTime, day, duration, bufferTime, active } =
      req.body; // Changed date to day

    if (!shiftId) {
      return res.status(400).json({
        success: false,
        message: "Shift ID is required",
      });
    }

    // Find the shift by ID
    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    // Update shift properties if provided
    if (name) shift.name = name;
    if (startTime) shift.startTime = startTime;
    if (endTime) shift.endTime = endTime;
    if (day) shift.day = day; // Simply update the day directly
    if (duration) shift.duration = duration;
    if (bufferTime) shift.bufferTime = bufferTime;
    if (active !== undefined) shift.active = active;

    // Save the updated shift
    await shift.save();

    // If time-related parameters changed, regenerate time slots
    if (startTime || endTime || duration || bufferTime) {
      // Clear existing time slots
      // shift.timeSlots = [];
      await shift.save();

      // Generate new time slots
      // const timeSlotIds = await shift.generateTimeSlots();

      return res.status(200).json({
        success: true,
        message: "Shift updated successfully with new time slots",
        data: {
          shift,
          // timeSlotCount: timeSlotIds.length,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shift updated successfully",
      data: shift,
    });
  } catch (error) {
    console.error("Error updating shift:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update shift",
      error: error.message,
    });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;

    if (!shiftId) {
      return res.status(400).json({
        success: false,
        message: "Shift ID is required",
      });
    }

    // Find and delete the shift
    const shift = await Shift.findByIdAndDelete(shiftId);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shift deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete shift",
      error: error.message,
    });
  }
};


export const getTimeSlots = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return handleError(req, res, 400, "Restaurant ID is required");
    }

    // const timeSlots = await TimeSlot.find({ restaurantId }).sort({ order: 1 });

    // Import the Menu class
    const menuInstance = new Menu();

    if (req.query.isJSON === 'true') {
      return handleResponse(req, res, 200, {
        success: true,
        message: "Time slots retrieved successfully",
        // data: timeSlots
      });
    } else {
      return res.render('shifts/index', {
        timeSlots: [],
        title: "Time Slots",
        menu: menuInstance.client, // Add menu variable from Menu class
        restaurantId: restaurantId, // Pass restaurantId to the view
        currentUser: {
          firstname: 'Guest',
          lastname: 'User',
          image_url: '/public/images/default-profile.png'
        }
      });
    }

  } catch (error) {
    console.error("Error retrieving time slots:", error);
    return handleError(req, res, 500, "Error retrieving time slots");
  }
};





