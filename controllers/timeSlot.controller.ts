import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TimeSlot from '../models/timeSlot.model';
import { handleResponse, handleError } from '../utils/responseHandler';
import { Menu } from '../modules/menu';
import Shift from '../models/shift';

// Generate time slots based on parameters
export const generateTimeSlots = async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.body;

    if (!shiftId) {
      return handleError(req, res, 400, "Shift ID is required");
    }

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return handleError(req, res, 404, "Shift not found");
    }

    const restaurantId = shift.restaurantId;
    const startTime = shift.startTime; 
    const endTime = shift.endTime;     
    const slotDuration = shift.duration;     
    const bufferTime = shift.bufferTime;     

    // Delete existing time slots for this shift (optional)
    await TimeSlot.deleteMany({ shiftId });

    // Helper: convert "HH:mm" to minutes
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    // Format display label: "1:30 PM"
    const formatLabel = (hour: number, minute: number) => {
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const period = hour < 12 ? "AM" : "PM";
      return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const effectiveSlotTime = slotDuration + bufferTime;
    const timeSlots = [];

    let current = startMinutes;
    let order = 0;

    while (current + slotDuration <= endMinutes) {
      const hour = Math.floor(current / 60);
      const minute = current % 60;

      const value = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const label = formatLabel(hour, minute);

      timeSlots.push({
        label,
        value,
        order: order++,
        restaurantId,
        duration: slotDuration,
        bufferTime,
        shiftId: new mongoose.Types.ObjectId(shiftId),
      });

      current += effectiveSlotTime;
    }

    const createdSlots = await TimeSlot.insertMany(timeSlots);

    return handleResponse(req, res, 201, {
      success: true,
      message: "Time slots generated from shift successfully",
      data: {
        shiftId,
        count: createdSlots.length,
        slots: createdSlots,
      },
    });
  } catch (error) {
    console.error("Error generating time slots:", error);
    return handleError(req, res, 500, error as string);
  }
};

// Get all time slots for a restaurant
export const getTimeSlots = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return handleError(req, res, 400, "Restaurant ID is required");
    }

    const timeSlots = await TimeSlot.find({ restaurantId }).sort({ order: 1 });

    // Import the Menu class
    const menuInstance = new Menu();


    console.log(timeSlots, "timeSlotstimeSlots");
    if (req.query.isJSON === 'true') {
      return handleResponse(req, res, 200, {
        success: true,
        message: "Time slots retrieved successfully",
        data: timeSlots
      });
    } else {
      return res.render('time-slots/index', {
        timeSlots: timeSlots,
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

//get all time slots for a shift
export const getTimeSlotsByShiftId = async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const timeSlots = await TimeSlot.find({ shiftId });
    if(!timeSlots) {
      return handleResponse(req, res, 200, {
        success: true,
        message: "No time slots found",
        data: []
      });
    }
    if(timeSlots.length === 0) {
      return handleResponse(req, res, 200, {
        success: true,
        message: "No time slots found for this shift",
        data: []
      });
    }

    if (req.query.isJSON === 'true') {
    return handleResponse(req, res, 200, {
      success: true,
        message: "Time slots by shift retrieved successfully",
        data: timeSlots
      });
    }
  } catch (error) {
    console.error("Error retrieving time slots:", error);
    return handleError(req, res, 500, "Error retrieving time slots");
  }
};
// Get a single time slot by ID
export const getTimeSlotById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handleError(req, res, 400, "Invalid time slot ID");
    }

    const timeSlot = await TimeSlot.findById(id);

    if (!timeSlot) {
      return handleError(req, res, 404, "Time slot not found");
    }

    return handleResponse(req, res, 200, {
      success: true,
      message: "Time slot retrieved successfully",
      data: timeSlot
    });
  } catch (error) {
    console.error("Error retrieving time slot:", error);
    return handleError(req, res, 500, "Error retrieving time slot");
  }
};

// Update a time slot
export const updateTimeSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { label, value, order } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handleError(req, res, 400, "Invalid time slot ID");
    }

    const timeSlot = await TimeSlot.findById(id);

    if (!timeSlot) {
      return handleError(req, res, 404, "Time slot not found");
    }

    // Update fields
    if (label) timeSlot.label = label;
    if (value) timeSlot.value = value;
    if (order !== undefined) timeSlot.order = order;

    await timeSlot.save();

    return handleResponse(req, res, 200, {
      success: true,
      message: "Time slot updated successfully",
      data: timeSlot
    });
  } catch (error) {
    console.error("Error updating time slot:", error);
    return handleError(req, res, 500, "Error updating time slot");
  }
};

// Delete a time slot
export const deleteTimeSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handleError(req, res, 400, "Invalid time slot ID");
    }

    const timeSlot = await TimeSlot.findByIdAndDelete(id);

    if (!timeSlot) {
      return handleError(req, res, 404, "Time slot not found");
    }

    return handleResponse(req, res, 200, {
      success: true,
      message: "Time slot deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting time slot:", error);
    return handleError(req, res, 500, "Error deleting time slot");
  }
};

// Delete all time slots for a restaurant
export const deleteAllTimeSlots = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return handleError(req, res, 400, "Restaurant ID is required");
    }

    await TimeSlot.deleteMany({ restaurantId });

    return handleResponse(req, res, 200, {
      success: true,
      message: "All time slots deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting time slots:", error);
    return handleError(req, res, 500, "Error deleting time slots");
  }
}; 